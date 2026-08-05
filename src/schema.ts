import type { AuthenticationResult } from "@azure/msal-node";
import { z } from "zod/v4";

export const credentialSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  // A tenantId containing "/" would inject extra segments into the MSAL authority
  // URL. GUIDs, domains, and the well-known aliases all fit this shape.
  tenantId: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9.-]+$/, "tenantId must be a GUID, a domain, or a well-known alias"),
});

export type CredentialType = z.infer<typeof credentialSchema>;

/** Expire a token early so a request in flight cannot expire mid-call. */
const EXPIRY_SKEW_MS = 60_000;

export function isTokenValid(auth: AuthenticationResult | null): boolean {
  const expiresOn = auth?.expiresOn;
  return !!expiresOn && new Date(expiresOn).getTime() - EXPIRY_SKEW_MS > Date.now();
}

export const GraphUserSchema = z.object({
  businessPhones: z.array(z.any()),
  displayName: z.string(),
  givenName: z.string(),
  jobTitle: z.null(),
  mail: z.null(),
  mobilePhone: z.null(),
  officeLocation: z.null(),
  preferredLanguage: z.string(),
  surname: z.string(),
  userPrincipalName: z.string(),
  id: z.string(),
});
export type GraphUserType = z.infer<typeof GraphUserSchema>;

export const GraphUsersSchema = z.object({
  "@odata.context": z.string(),
  value: z.array(GraphUserSchema),
});
export type GraphUsersType = z.infer<typeof GraphUsersSchema>;

/** Graph message fields we surface; typing only — fetch does not parse with zod. */
export type GraphEmailAddress = {
  name?: string | null;
  address?: string | null;
};

export type GraphRecipient = {
  emailAddress?: GraphEmailAddress | null;
};

export type GraphMessageBody = {
  contentType?: string | null;
  content?: string | null;
};

export type GraphMessageType = {
  id: string;
  subject?: string | null;
  bodyPreview?: string | null;
  receivedDateTime?: string | null;
  sentDateTime?: string | null;
  isRead?: boolean | null;
  isDraft?: boolean | null;
  from?: GraphRecipient | null;
  toRecipients?: Array<GraphRecipient> | null;
  body?: GraphMessageBody | null;
};

export type GraphMessagesType = {
  value: Array<GraphMessageType>;
};

/** Graph calendar event fields we surface; typing only — fetch does not parse with zod. */
export type GraphDateTimeTimeZone = {
  dateTime?: string | null;
  timeZone?: string | null;
};

export type GraphEventLocation = {
  displayName?: string | null;
};

export type GraphAttendee = {
  emailAddress?: GraphEmailAddress | null;
  type?: string | null;
};

export type GraphEventType = {
  id: string;
  subject?: string | null;
  bodyPreview?: string | null;
  start?: GraphDateTimeTimeZone | null;
  end?: GraphDateTimeTimeZone | null;
  location?: GraphEventLocation | null;
  isAllDay?: boolean | null;
  showAs?: string | null;
  isCancelled?: boolean | null;
  organizer?: GraphRecipient | null;
  attendees?: Array<GraphAttendee> | null;
  body?: GraphMessageBody | null;
};

export type GraphEventsType = {
  value: Array<GraphEventType>;
};

/** Graph contact fields we surface; typing only — fetch does not parse with zod. */
export type GraphContactType = {
  id: string;
  displayName?: string | null;
  givenName?: string | null;
  surname?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  emailAddresses?: Array<GraphEmailAddress> | null;
  businessPhones?: Array<string> | null;
  homePhones?: Array<string> | null;
  mobilePhone?: string | null;
};

export type GraphContactsType = {
  value: Array<GraphContactType>;
};
