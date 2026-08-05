# msal-authless

Internal research lab for one question: instead of sending every user through an
interactive OAuth sign-in, can a single organization-level access token (the OAuth 2.0
client credentials grant against `https://graph.microsoft.com/.default`) read mail,
contacts, and calendars for any user in a tenant?

> Research only. You paste a tenant id, client id, and client secret into the browser,
> and the app keeps them in IndexedDB so a reload does not lose them. Use a throwaway
> app registration. Never point this at production credentials.

## How it works

1. The home page (`src/routes/index.tsx`) collects the credential, validated by
   `credentialSchema` in `src/schema.ts`.
2. `POST /api/auth` (`src/routes/api/auth.ts`) hands it to `acquireToken`
   (`src/lib/cca.server.ts`), which builds a fresh `ConfidentialClientApplication` per
   call and returns the MSAL `AuthenticationResult`. Nothing is cached server-side, so
   no tenant state leaks between requests.
3. The result lives in `authStore` (`src/stores/auth.ts`), mirrored to IndexedDB. There
   is no refresh token. `isTokenValid` checks `expiresOn`, and renewing means submitting
   the form again. Signing out just drops the local token and credential.
4. Dashboard pages send that token as `Authorization: Bearer …` to the proxy routes
   under `src/routes/api/`, which share `graphResourceHandlers` in
   `src/lib/graph-route.server.ts`.

An app-only token has no signed-in user, so Graph `/me` does not exist here. Every path
names a user: `/users`, `/users/{id|upn}`, `/users/{id}/messages`,
`/users/{id}/contacts`, `/users/{id}/calendar/events`. The handlers escape every path
segment with `encodeURIComponent`, because an unescaped `https://` in a segment would
let `GraphRequest.parsePath` repoint the request at another host.

| Route            | Graph resource     | Query params                         |
| ---------------- | ------------------ | ------------------------------------ |
| `/api/users`     | tenant directory   | optional `?id=` (object id or UPN)   |
| `/api/mails`     | `/messages`        | `?userId=` required, optional `?id=` |
| `/api/contacts`  | `/contacts`        | `?userId=` required, optional `?id=` |
| `/api/calendars` | `/calendar/events` | `?userId=` required, optional `?id=` |

The handlers expose GET/POST/DELETE; the UI currently only reads. Pages live under
`src/routes/(dashboard)/`. `/profile` shows the acquired token's scopes and expiry,
`/users` lists the directory, and `/users/$id` links through to that user's emails,
contacts, and calendar.

## Entra setup

1. Register an application in the target tenant and add a client secret.
2. Grant application permissions (not delegated) and click _Grant admin consent_:
   `User.Read.All`, `Mail.Read`, `Contacts.Read`, `Calendars.Read`.
3. Without consent, Graph answers `403 Insufficient privileges to complete the
operation.`, and the proxy forwards that message verbatim.

Exchange-backed paths (`/messages`, `/contacts`, `/calendar/events`) answer a bodyless
`401` when the target user has no mailbox, so the proxy keeps the upstream status
instead of collapsing it into a 502. If your tenant uses an [application access
policy](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access), the app can
only reach the mailboxes that policy allows.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm preview`, `pnpm deploy`, `pnpm generate-routes`
(`tsr generate`). This project uses [Vite+](https://viteplus.dev/guide/), so `vp check`
formats, lints, and typechecks, and `vp test` runs the test suite.

## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`:

1. Install Wrangler: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Deploy: `npx wrangler deploy`

Public (non-secret) vars go in `wrangler.jsonc` under `vars`. Note that credentials are
supplied at runtime through the form, not through environment variables.

KV, D1, R2, and Durable Object bindings are configured in `wrangler.jsonc`. See https://developers.cloudflare.com/workers/wrangler/configuration/.

## Untitled UI

Add components using the [Untitled UI React](https://www.untitledui.com/react) CLI.

```bash
npx untitledui@latest add input
```

Vendored components live under `src/components/base/` and `src/components/foundations/`;
shared helpers under `src/utils/`. Design tokens are in `src/styles/theme.css`, and the
Tailwind entry is `src/styles/globals.css`.

Note that Untitled UI's token names invert shadcn's: `bg-primary` is the page surface and
`text-primary` is the foreground ink. The brand ramp lives under `brand`
(`bg-brand-solid`, `text-brand-secondary`).

## Routing

File-based routing with [TanStack Router](https://tanstack.com/router); routes are files
in `src/routes` and `src/routeTree.gen.ts` is generated. The root layout is
`src/routes/__root.tsx`. API routes use the `server.handlers` property. See
`src/routes/api/users.ts` for the smallest example.
