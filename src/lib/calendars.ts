/**
 * Client query helpers for a user's calendar events via `/api/calendars`.
 * Requires an explicit mailbox `userId` (GUID or UPN) — app-only auth has no `/me`.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/calendar-list-events
 * @see https://learn.microsoft.com/en-us/graph/api/event-get
 */
import type { GraphEventsType, GraphEventType } from "#/schema.ts";
import { queryOptions } from "@tanstack/react-query";

/**
 * The token is undefined until authStore hydrates from IndexedDB, so the guard
 * lives here rather than at each call site — `enabled` keeps it from ever firing.
 */
async function fetchCalendars<T>(
  token: string | undefined,
  userId: string,
  eventId?: string,
): Promise<T> {
  if (!token) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({ userId });
  if (eventId) params.set("id", eventId);

  const response = await fetch(`/api/calendars?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

// Only the first Graph page: @odata.nextLink is ignored until a tenant needs it.
export function calendarsQueryOptions(token: string | undefined, userId: string) {
  return queryOptions({
    queryKey: ["calendars", userId],
    queryFn: () => fetchCalendars<GraphEventsType>(token, userId),
    enabled: !!token,
  });
}

export function calendarQueryOptions(token: string | undefined, userId: string, eventId: string) {
  return queryOptions({
    queryKey: ["calendars", userId, eventId],
    queryFn: () => fetchCalendars<GraphEventType>(token, userId, eventId),
    enabled: !!token,
  });
}
