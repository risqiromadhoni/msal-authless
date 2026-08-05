import { userHandlers } from "#/lib/graph-route.server";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Graph `/users` proxy for app-only (CCA) tokens. Expects `Authorization: Bearer`
 * from `/api/auth`; lists the tenant directory or GET `?id=` (GUID or UPN).
 * No `/me` — client credentials have no signed-in user.
 *
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/graph/api/user-list
 * @see https://learn.microsoft.com/en-us/graph/api/user-get
 */
export const Route = createFileRoute("/api/users")({
  server: {
    handlers: userHandlers,
  },
});
