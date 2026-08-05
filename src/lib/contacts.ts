/**
 * Client query helpers for a user's contacts via `/api/contacts`.
 * Requires an explicit mailbox `userId` (GUID or UPN) — app-only auth has no `/me`.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/user-list-contacts
 * @see https://learn.microsoft.com/en-us/graph/api/contact-get
 */
import type { GraphContactsType, GraphContactType } from "#/schema.ts";
import { queryOptions } from "@tanstack/react-query";

/**
 * The token is undefined until authStore hydrates from IndexedDB, so the guard
 * lives here rather than at each call site — `enabled` keeps it from ever firing.
 */
async function fetchContacts<T>(
  token: string | undefined,
  userId: string,
  contactId?: string,
): Promise<T> {
  if (!token) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({ userId });
  if (contactId) params.set("id", contactId);

  const response = await fetch(`/api/contacts?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

// Only the first Graph page: @odata.nextLink is ignored until a tenant needs it.
export function contactsQueryOptions(token: string | undefined, userId: string) {
  return queryOptions({
    queryKey: ["contacts", userId],
    queryFn: () => fetchContacts<GraphContactsType>(token, userId),
    enabled: !!token,
  });
}

export function contactQueryOptions(token: string | undefined, userId: string, contactId: string) {
  return queryOptions({
    queryKey: ["contacts", userId, contactId],
    queryFn: () => fetchContacts<GraphContactType>(token, userId, contactId),
    enabled: !!token,
  });
}
