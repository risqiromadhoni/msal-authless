import { graphResourceHandlers } from "#/lib/graph-route.server";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Mailbox calendar proxy under `/users/{userId}/...` (app-only; `userId` required).
 * Graph lists/creates at `/calendar/events`, but a single event is `/events/{id}`.
 * Bearer token from the CCA client-credentials flow (`/api/auth`).
 *
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/graph/api/user-list-events
 * @see https://learn.microsoft.com/en-us/graph/api/event-get
 */
export const Route = createFileRoute("/api/calendars")({
  server: {
    handlers: graphResourceHandlers({ list: ["calendar", "events"], item: ["events"] }),
  },
});
