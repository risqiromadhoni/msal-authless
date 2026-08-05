/**
 * Shared HTTP handlers for app-only Graph access. Paths are always
 * `/users/{userId|upn}/...` (or `/users` for the directory list) — never `/me`.
 * Callers must supply a bearer token from the CCA flow and an explicit `userId`
 * query param for mailbox-scoped resources.
 *
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/graph/api/resources/users
 */
import { graphDelete, graphGet, graphPost } from "./cca.server";

/**
 * Path segments beneath `/users/{userId}`: `list` addresses the collection, `item`
 * the parent of a single item, which the id is appended to. Calendars differ
 * between the two — `/calendar/events` lists, `/events/{id}` addresses one.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/resources/users
 */
export interface GraphResource {
  list: Array<string>;
  item: Array<string>;
}

interface HandlerCtx {
  request: Request;
}

type ParsedRequest =
  | { ok: true; accessToken: string; userId: string; id: string | null }
  | { ok: false; response: Response };

function fail(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Forward the upstream status so 403 stays distinguishable from 404. */
function upstreamStatus(cause: unknown): number {
  const statusCode = (cause as { statusCode?: unknown } | null)?.statusCode;
  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 600 ? statusCode : 502;
}

/**
 * Graph's own message names the cause — a missing application permission reads
 * "Insufficient privileges to complete the operation." Only a GraphError's message
 * is forwarded (it carries statusCode); an unexpected exception could hold
 * internals the caller has no business seeing.
 *
 * When the error response carries no Content-Type, GraphResponseHandler hands back
 * the raw body stream, so GraphErrorHandler.getError falls through to its last
 * branch and parks that stream on `body` with no message at all. Read it, or the
 * only thing that ever reaches the caller is "Graph request failed".
 */
async function upstreamMessage(cause: unknown): Promise<string> {
  const graph = cause as { statusCode?: unknown; message?: unknown; body?: unknown } | null;
  if (typeof graph?.statusCode !== "number") {
    return "Graph request failed";
  }
  if (typeof graph.message === "string" && graph.message) {
    return graph.message;
  }

  const body =
    graph.body instanceof ReadableStream
      ? await new Response(graph.body).text().catch(() => "")
      : graph.body;

  // Truncated: a 500 can answer with a whole HTML error page.
  // Exchange-backed paths (/messages, /calendar/events, /contacts) answer with a
  // bodyless 401 when the user has no mailbox, so keep the status — it is the only
  // thing that distinguishes that case from a real auth failure.
  return typeof body === "string" && body.trim()
    ? body.trim().slice(0, 500)
    : `Graph returned ${graph.statusCode} with no error details`;
}

function bearerToken(request: Request): string | null {
  return /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1] ?? null;
}

function parseRequest(request: Request): ParsedRequest {
  const accessToken = bearerToken(request);
  if (!accessToken) {
    return { ok: false, response: fail("Missing bearer token", 401) };
  }

  const params = new URL(request.url).searchParams;
  const userId = params.get("userId");
  if (!userId) {
    return { ok: false, response: fail("Missing userId", 400) };
  }

  // An empty ?id= counts as absent, so it can never build a trailing-slash path.
  return { ok: true, accessToken, userId, id: params.get("id") || null };
}

async function send(work: () => Promise<unknown>): Promise<Response> {
  try {
    const data = await work();
    // Graph answers a delete with 204 and no body.
    return data == null ? new Response(null, { status: 204 }) : Response.json(data);
  } catch (cause) {
    const message = await upstreamMessage(cause);
    console.error("Graph request failed:", message, cause);
    return fail(message, upstreamStatus(cause));
  }
}

/**
 * Builds a Graph path with every segment escaped. Escaping is what keeps a caller
 * from repointing the request: GraphRequest.parsePath rewrites the target host when
 * a path contains "https://", so an unescaped segment would be an SSRF vector.
 */
function graphPath(...segments: Array<string>): string {
  const path = `/${segments.map(encodeURIComponent).join("/")}`;
  return path;
}

/**
 * CRUD handlers for a per-user Graph collection. Requires `Authorization: Bearer`
 * (app-only token) and `?userId=` (GUID or UPN); optional `?id=` for a single item.
 * Paths are built from fixed segments — only `userId` / `id` vary, and both are escaped.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/resources/users
 */
export function graphResourceHandlers(resource: GraphResource) {
  const listPath = (userId: string) => graphPath("users", userId, ...resource.list);
  const itemPath = (userId: string, id: string) => graphPath("users", userId, ...resource.item, id);

  return {
    GET: async ({ request }: HandlerCtx) => {
      const parsed = parseRequest(request);
      if (!parsed.ok) {
        return parsed.response;
      }

      const { accessToken, userId, id } = parsed;
      const path = !id
        ? graphGet(accessToken, listPath(userId))
        : graphGet(accessToken, itemPath(userId, id));
      return send(() => path);
    },

    POST: async ({ request }: HandlerCtx) => {
      const parsed = parseRequest(request);
      if (!parsed.ok) {
        return parsed.response;
      }

      const body: unknown = await request.json().catch(() => undefined);
      if (body === undefined) {
        return fail("Invalid JSON body", 400);
      }

      const { accessToken, userId } = parsed;
      return send(() => graphPost(accessToken, listPath(userId), body));
    },

    DELETE: async ({ request }: HandlerCtx) => {
      const parsed = parseRequest(request);
      if (!parsed.ok) {
        return parsed.response;
      }

      const { accessToken, userId, id } = parsed;
      if (id === null) {
        return fail("Missing id", 400);
      }

      return send(() => graphDelete(accessToken, itemPath(userId, id)));
    },
  };
}

/**
 * `/users` directory handlers (tenant-wide). No mailbox `userId` query param —
 * GET lists users; GET with `?id=` fetches one by object id or UPN.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/user-list
 * @see https://learn.microsoft.com/en-us/graph/api/user-get
 */
export const userHandlers = {
  GET: async ({ request }: HandlerCtx) => {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return fail("Missing bearer token", 401);
    }

    // An empty ?id= counts as absent, so it can never build a trailing-slash path.
    const id = new URL(request.url).searchParams.get("id") || null;
    return send(() =>
      graphGet(accessToken, id === null ? graphPath("users") : graphPath("users", id)),
    );
  },
};
