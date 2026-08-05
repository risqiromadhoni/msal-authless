/**
 * Client query helpers for a user's messages via `/api/mails`.
 * Requires an explicit mailbox `userId` (GUID or UPN) — app-only auth has no `/me`.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/user-list-messages
 * @see https://learn.microsoft.com/en-us/graph/api/message-get
 */
import type { GraphMessagesType, GraphMessageType } from "#/schema.ts";
import { queryOptions } from "@tanstack/react-query";

/**
 * The token is undefined until authStore hydrates from IndexedDB, so the guard
 * lives here rather than at each call site — `enabled` keeps it from ever firing.
 */
async function fetchMails<T>(
  token: string | undefined,
  userId: string,
  mailId?: string,
): Promise<T> {
  if (!token) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({ userId });
  if (mailId) params.set("id", mailId);

  const response = await fetch(`/api/mails?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

// Only the first Graph page: @odata.nextLink is ignored until a tenant needs it.
export function mailsQueryOptions(token: string | undefined, userId: string) {
  return queryOptions({
    queryKey: ["mails", userId],
    queryFn: () => fetchMails<GraphMessagesType>(token, userId),
    enabled: !!token,
  });
}

export function mailQueryOptions(token: string | undefined, userId: string, mailId: string) {
  return queryOptions({
    queryKey: ["mails", userId, mailId],
    queryFn: () => fetchMails<GraphMessageType>(token, userId, mailId),
    enabled: !!token,
  });
}
