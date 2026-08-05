import { graphResourceHandlers } from "#/lib/graph-route.server";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Mailbox contacts proxy: `/users/{userId}/contacts[/{id}]` with an app-only
 * bearer token. Requires explicit `userId` (GUID or UPN) — no Graph `/me`.
 *
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/graph/api/user-list-contacts
 * @see https://learn.microsoft.com/en-us/graph/api/contact-get
 */
export const Route = createFileRoute("/api/contacts")({
  server: {
    handlers: graphResourceHandlers({ list: ["contacts"], item: ["contacts"] }),
  },
});
