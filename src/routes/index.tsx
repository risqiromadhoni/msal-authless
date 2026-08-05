import { credentialSchema, isTokenValid, type CredentialType } from "#/schema";
import { authStore } from "#/stores/auth";
import { credentialStore } from "#/stores/credential";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowUpRight, Key01 } from "@untitledui/icons";
import { useEffect, useRef } from "react";
import { Badge } from "../components/base/badges/badges";
import { Button } from "../components/base/buttons/button";
import { Input } from "../components/base/input/input";

export const Route = createFileRoute("/")({ component: App });

const FEATURES = [
  [
    "App-Only Token",
    "Client credentials grant against .default, so there is no consent screen and no refresh token.",
  ],
  ["No /me Endpoint", "Every call names a user explicitly: /users/{id} or the tenant directory."],
  [
    "Mail, Contacts, Calendar",
    "Read any tenant user's messages, contacts, and events through server-side proxy routes.",
  ],
  [
    "Credentials Stay Client-Side",
    "Tenant id, client id, and secret live in this browser's IndexedDB and are posted to /api/auth.",
  ],
];

const CREDENTIAL_FIELDS = [
  ["clientId", "Client ID", "text"],
  ["tenantId", "Tenant ID", "text"],
  ["clientSecret", "Client Secret", "password"],
] as const;

function App() {
  const credential = useSelector(credentialStore);
  const isAuthenticated = useSelector(authStore, isTokenValid);
  const navigate = useNavigate();

  const authMutation = useMutation({
    mutationFn: async (value: CredentialType) => {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
      }

      return payload;
    },
    onSuccess: (auth) => {
      authStore.setState(() => auth);
    },
  });

  const form = useForm({
    defaultValues: credentialStore.state,
    validators: { onChange: credentialSchema },
    listeners: {
      onChange: ({ formApi }) => credentialStore.setState(() => formApi.state.values),
    },
    onSubmit: ({ value }) => {
      authMutation.mutate(value);
    },
  });

  // credentialStore hydrates from IndexedDB after the first render, so defaultValues
  // starts empty. Reset once when the saved values land — a ref, not `isDirty`, because
  // the onChange listener writes back to the store and would otherwise loop.
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    if (credential.clientId || credential.tenantId || credential.clientSecret) {
      hasHydrated.current = true;
      form.reset(credential);
    }
  }, [credential, form]);

  // Not beforeLoad: authStore hydrates from IndexedDB after the first render, so a
  // loader-time check would always see null on a fresh load and never redirect.
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/profile", replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="mx-auto w-full max-w-container px-4 pt-14 pb-8">
      <section className="animate-in rounded-2xl bg-primary px-6 py-10 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3 sm:px-10 sm:py-14">
        <Badge color="brand" size="sm" className="mb-3">
          Internal Research Only
        </Badge>
        <h1 className="mb-5 max-w-3xl text-display-md font-semibold tracking-tight text-primary">
          One tenant token. No user sign-in.
        </h1>
        <p className="mb-8 max-w-2xl text-md text-tertiary">
          A lab for a single question: can an organization-level access token (OAuth 2.0 client
          credentials) stand in for per-user delegated sign-in when reading mail, contacts, and
          calendars? Enter a tenant app registration to acquire one.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="mb-6 grid items-start gap-3 sm:grid-cols-3">
            {CREDENTIAL_FIELDS.map(([name, label, type]) => (
              <form.Field key={name} name={name}>
                {(field) => (
                  <Input
                    label={label}
                    type={type}
                    isRequired
                    autoComplete="off"
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    hint={
                      field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                    }
                  />
                )}
              </form.Field>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              href="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow"
              target="_blank"
              rel="noopener noreferrer"
              color="secondary"
              size="md"
              iconTrailing={ArrowUpRight}
            >
              Client Credentials Flow
            </Button>
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  type="submit"
                  color="primary"
                  size="md"
                  iconLeading={Key01}
                  isLoading={authMutation.isPending}
                  isDisabled={!canSubmit}
                >
                  Acquire Token
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>

        {authMutation.isError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg bg-error-primary px-3.5 py-3 ring-1 ring-error_subtle"
          >
            <AlertCircle className="size-5 shrink-0 text-fg-error-secondary" />
            <p className="text-sm font-medium text-error-primary">{authMutation.error.message}</p>
          </div>
        )}
        {authMutation.isSuccess && (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-secondary p-4 text-xs text-secondary">
            {/* Deliberately not rendering the token itself. */}
            Token acquired. Expires {authMutation.data.expiresOn?.toLocaleString() ?? "unknown"}.
          </pre>
        )}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(([title, desc], index) => (
          <article
            key={title}
            className="animate-in rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-sm font-semibold text-primary">{title}</h2>
            <p className="m-0 text-sm text-tertiary">{desc}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
        <Badge color="brand" size="sm" className="mb-2">
          Before You Start
        </Badge>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-tertiary">
          <li>An Entra app registration in the target tenant, with a client secret.</li>
          <li>
            <strong className="font-semibold text-secondary">Application</strong> permissions with
            admin consent granted: <code>User.Read.All</code>, <code>Mail.Read</code>,{" "}
            <code>Contacts.Read</code>, <code>Calendars.Read</code>. Delegated scopes will not work
            here.
          </li>
          <li>
            The token is app-only and expires in about an hour. There is no refresh token, so submit
            the form again to renew.
          </li>
          <li>
            The secret is stored in this browser, so use a throwaway registration and never
            production credentials.
          </li>
        </ul>
      </section>
    </main>
  );
}
