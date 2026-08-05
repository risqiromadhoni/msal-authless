import { acquireToken } from "#/lib/cca.server";
import { credentialSchema } from "#/schema";
import { createFileRoute } from "@tanstack/react-router";

/**
 * App-only token endpoint: accepts tenant/client/secret, returns an MSAL
 * `AuthenticationResult` from the OAuth 2.0 client credentials grant
 * (`acquireTokenByClientCredential` with `https://graph.microsoft.com/.default`).
 * No interactive user — this lab never uses Graph `/me`.
 *
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/entra/msal/javascript/node/client-credentials-grant-flow
 */
export const Route = createFileRoute("/api/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = await request
          .json()
          .then((body) => credentialSchema.safeParse(body))
          .catch(() => null);

        if (!parsed?.success) {
          return Response.json({ error: "Invalid credential" }, { status: 400 });
        }

        try {
          const result = await acquireToken(parsed.data);
          console.log("result", result);
          return Response.json(result);
        } catch (cause) {
          console.error("Failed to acquire token:", cause);
          return Response.json({ error: "Authentication failed" }, { status: 502 });
        }
      },
    },
  },
});
