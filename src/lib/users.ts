/**
 * Client query helpers for Graph `/users` via `/api/users` (app-only token).
 * Optional `id` is a user object id or UPN — not `/me`.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/user-list
 * @see https://learn.microsoft.com/en-us/graph/api/user-get
 */
import type { GraphUsersType, GraphUserType } from "#/schema.ts";
import { queryOptions } from "@tanstack/react-query";

/**
 * The token is undefined until authStore hydrates from IndexedDB, so the guard
 * lives here rather than at each call site — `enabled` keeps it from ever firing.
 */
async function fetchUsers<T>(token: string | undefined, id?: string): Promise<T> {
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(id ? `/api/users?id=${encodeURIComponent(id)}` : "/api/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

// Only the first Graph page: @odata.nextLink is ignored until a tenant needs it.
export function usersQueryOptions(token: string | undefined) {
  return queryOptions({
    queryKey: ["users"],
    queryFn: () => fetchUsers<GraphUsersType>(token),
    enabled: !!token,
  });
}

export function userQueryOptions(token: string | undefined, id: string) {
  return queryOptions({
    queryKey: ["users", id],
    queryFn: () => fetchUsers<GraphUserType>(token, id),
    enabled: !!token,
  });
}
