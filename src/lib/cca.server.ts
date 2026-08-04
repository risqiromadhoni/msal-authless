import "server-only";
import type { AuthenticationResult } from "@azure/msal-node";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

const GRAPH_SCOPE = "https://graph.microsoft.com/.default" as const;

class CCA {
  private cca: ConfidentialClientApplication | null = null;
  private authResult: AuthenticationResult | null = null;
  private graph: Client | null = null;

  private get instance(): ConfidentialClientApplication {
    if (!this.cca) {
      throw new Error("CCA not initialized");
    }
    return this.cca;
  }

  private get client(): Client {
    if (!this.graph) {
      this.graph = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => this.getAccessToken(),
        },
      });
    }
    return this.graph;
  }

  private async getAccessToken(): Promise<string> {
    if (this.isTokenValid() && this.authResult) {
      return this.authResult.accessToken;
    }
    const result = await this.getClientCredential();
    return result.accessToken;
  }

  private graphGet(path: string): Promise<unknown> {
    return this.client.api(path).get();
  }

  private graphPost(path: string, body: unknown): Promise<unknown> {
    return this.client.api(path).post(body);
  }

  init(clientId: string, authority: string, clientSecret: string): ConfidentialClientApplication {
    if (!this.cca) {
      this.cca = new ConfidentialClientApplication({
        auth: {
          clientId,
          authority,
          clientSecret,
        },
      });
    }
    return this.cca;
  }

  async getClientCredential(): Promise<AuthenticationResult> {
    const result = await this.instance.acquireTokenByClientCredential({
      scopes: [GRAPH_SCOPE],
    });
    if (!result) {
      throw new Error("Failed to acquire token");
    }
    this.authResult = result;
    return this.authResult;
  }

  isTokenValid(): boolean {
    const expiresOn = this.authResult?.expiresOn;
    return expiresOn != null && expiresOn.getTime() > Date.now();
  }

  async refreshToken(): Promise<AuthenticationResult> {
    const result = await this.instance.acquireTokenByClientCredential({
      scopes: [GRAPH_SCOPE],
      skipCache: true,
    });
    if (!result) {
      throw new Error("Failed to refresh token");
    }
    this.authResult = result;
    return this.authResult;
  }

  getUserProfile(userId: string): Promise<unknown> {
    return this.graphGet(`/users/${encodeURIComponent(userId)}`);
  }

  getEmails(userId: string): Promise<unknown> {
    return this.graphGet(`/users/${encodeURIComponent(userId)}/messages`);
  }

  getEmailDetails(userId: string, messageId: string): Promise<unknown> {
    return this.graphGet(
      `/users/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`,
    );
  }

  createEmail(userId: string, message: unknown): Promise<unknown> {
    return this.graphPost(`/users/${encodeURIComponent(userId)}/messages`, message);
  }

  getCalendarEvents(userId: string): Promise<unknown> {
    return this.graphGet(`/users/${encodeURIComponent(userId)}/calendar/events`);
  }

  getCalendarEventDetails(userId: string, eventId: string): Promise<unknown> {
    return this.graphGet(
      `/users/${encodeURIComponent(userId)}/events/${encodeURIComponent(eventId)}`,
    );
  }

  createCalendarEvent(userId: string, event: unknown): Promise<unknown> {
    return this.graphPost(`/users/${encodeURIComponent(userId)}/calendar/events`, event);
  }

  getContacts(userId: string): Promise<unknown> {
    return this.graphGet(`/users/${encodeURIComponent(userId)}/contacts`);
  }

  getContactDetails(userId: string, contactId: string): Promise<unknown> {
    return this.graphGet(
      `/users/${encodeURIComponent(userId)}/contacts/${encodeURIComponent(contactId)}`,
    );
  }
}

export const cca = Object.freeze(new CCA());
