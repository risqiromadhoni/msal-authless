import { graphResourceHandlers } from "#/lib/graph-route.server";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Mailbox messages proxy: `/users/{userId}/messages[/{id}]` with an app-only
 * bearer token from the CCA client-credentials grant. Explicit `userId` only.
 *
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/graph/api/user-list-messages
 * @see https://learn.microsoft.com/en-us/graph/api/message-get
 */
export const Route = createFileRoute("/api/mails")({
  server: {
    handlers: graphResourceHandlers({ list: ["messages"], item: ["messages"] }),
  },
});
