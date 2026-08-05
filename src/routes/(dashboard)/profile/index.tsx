import { Badge } from "#/components/base/badges/badges";
import { Button } from "#/components/base/buttons/button";
import { isTokenValid } from "#/schema";
import { authStore } from "#/stores/auth.ts";
import { credentialStore } from "#/stores/credential";
import { createFileRoute } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { Check, Copy01 } from "@untitledui/icons";
import { useState, type ReactNode } from "react";

export const Route = createFileRoute("/(dashboard)/profile/")({
  component: RouteComponent,
});

function shorten(value: string, head = 8, tail = 8): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function relativeExpiry(expiresOn: Date | string | null | undefined): string {
  if (!expiresOn) return "unknown";
  const ms = new Date(expiresOn).getTime() - Date.now();
  if (Number.isNaN(ms)) return "unknown";
  if (ms <= 0) return "expired";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-b border-secondary py-3 last:border-b-0 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="mt-1 min-w-0 text-sm text-primary sm:mt-0">{children}</dd>
    </div>
  );
}

function RouteComponent() {
  const auth = useSelector(authStore);
  const credential = useSelector(credentialStore);
  const valid = isTokenValid(auth);
  const [copied, setCopied] = useState(false);

  const token = auth?.accessToken ?? "";
  const scopes = auth?.scopes ?? [];
  const expiresOn = auth?.expiresOn;

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="animate-in rounded-2xl bg-primary px-6 py-8 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3 sm:px-10 sm:py-10">
      <header className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-display-xs font-semibold tracking-tight text-primary">
          Session
        </h1>
        <Badge color="brand" size="sm">
          App-only
        </Badge>
        <Badge color={valid ? "success" : "error"} size="sm">
          {valid ? "Valid" : "Expired"}
        </Badge>
      </header>

      <dl className="mb-8">
        <Fact label="Expires">
          {expiresOn ? (
            <>
              <span className="font-medium">{new Date(expiresOn).toLocaleString()}</span>
              <span className="ml-2 text-tertiary">({relativeExpiry(expiresOn)})</span>
            </>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </Fact>
        <Fact label="Scopes">
          {scopes.length ? (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {scopes.map((scope) => (
                <li key={scope}>
                  <Badge color="gray" size="sm">
                    {scope}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </Fact>
        <Fact label="Authority">
          <code className="break-all font-mono text-xs text-secondary">
            {auth?.authority || "—"}
          </code>
        </Fact>
        <Fact label="Token type">
          <span className="font-medium">{auth?.tokenType || "—"}</span>
        </Fact>
        <Fact label="From cache">
          <span className="font-medium">{auth?.fromCache ? "Yes" : "No"}</span>
        </Fact>
        {auth?.correlationId ? (
          <Fact label="Correlation ID">
            <code className="font-mono text-xs text-secondary">{shorten(auth.correlationId)}</code>
          </Fact>
        ) : null}
      </dl>

      <div className="mb-8 border-t border-secondary pt-6">
        <h2 className="mb-3 text-sm font-semibold text-primary">App registration</h2>
        <dl>
          <Fact label="Client ID">
            <code className="font-mono text-xs text-secondary">
              {credential.clientId ? shorten(credential.clientId) : "—"}
            </code>
          </Fact>
          <Fact label="Tenant ID">
            <code className="break-all font-mono text-xs text-secondary">
              {credential.tenantId || "—"}
            </code>
          </Fact>
          <Fact label="Client secret">
            <code className="font-mono text-xs text-secondary">
              {credential.clientSecret || "—"}
            </code>
          </Fact>
        </dl>
      </div>

      <div className="border-t border-secondary pt-6">
        <h2 className="mb-3 text-sm font-semibold text-primary">Access token</h2>
        <div className="flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 break-all font-mono text-xs text-secondary">
            {token ? shorten(token) : "—"}
          </code>
          <Button
            color="secondary"
            size="sm"
            iconLeading={copied ? Check : Copy01}
            onClick={() => void copyToken()}
            isDisabled={!token}
            aria-label={copied ? "Copied" : "Copy access token"}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {auth ? (
          <details className="mt-4 rounded-lg bg-secondary ring-1 ring-secondary">
            <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-medium text-secondary select-none hover:text-primary">
              Raw auth JSON
            </summary>
            <pre className="max-h-64 overflow-auto border-t border-secondary px-3.5 py-3 text-xs text-tertiary">
              <code>{JSON.stringify(auth, null, 2)}</code>
            </pre>
          </details>
        ) : null}
      </div>
    </section>
  );
}
