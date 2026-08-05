/**
 * Server-side MSAL client-credentials (app-only) token acquisition and Graph HTTP helpers.
 * Tokens are application tokens — there is no signed-in user and no Graph `/me`.
 *
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
 * @see https://learn.microsoft.com/en-us/graph/auth-v2-service
 * @see https://learn.microsoft.com/en-us/javascript/api/@azure/msal-node/
 */
import type { CredentialType } from "#/schema";
import type { AuthenticationResult } from "@azure/msal-node";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

/** Application permission scope; `.default` maps to the app registration's Graph roles. */
const GRAPH_SCOPE = "https://graph.microsoft.com/.default" as const;
const AUTHORITY_HOST = "https://login.microsoftonline.com" as const;

/**
 * Acquires a Microsoft Graph access token via MSAL `acquireTokenByClientCredential`.
 *
 * @see https://learn.microsoft.com/en-us/javascript/api/@azure/msal-node/confidentialclientapplication#acquireTokenByClientCredential
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc#the-default-scope
 */
export async function acquireToken(credential: CredentialType): Promise<AuthenticationResult> {
  const cca = new ConfidentialClientApplication({
    auth: {
      clientId: credential.clientId,
      authority: `${AUTHORITY_HOST}/${credential.tenantId}`,
      clientSecret: credential.clientSecret,
    },
  });

  const result = await cca.acquireTokenByClientCredential({ scopes: [GRAPH_SCOPE] });
  if (!result) {
    throw new Error("Failed to acquire token");
  }
  return result;
}

/**
 * Graph SDK client that presents a pre-acquired app-only access token.
 *
 * @see https://learn.microsoft.com/en-us/graph/sdks/choose-authentication-providers?tabs=typescript#client-credentials-provider
 */
function graphClient(accessToken: string): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: () => Promise.resolve(accessToken),
    },
  });
}

/** GET against a Graph path using an app-only bearer token. */
export function graphGet(accessToken: string, path: string): Promise<unknown> {
  return graphClient(accessToken).api(path).get();
}

/** POST against a Graph path using an app-only bearer token. */
export function graphPost(accessToken: string, path: string, body: unknown): Promise<unknown> {
  return graphClient(accessToken).api(path).post(body);
}

/** DELETE against a Graph path using an app-only bearer token. */
export function graphDelete(accessToken: string, path: string): Promise<unknown> {
  return graphClient(accessToken).api(path).delete();
}
