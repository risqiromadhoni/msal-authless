import { Button } from "#/components/base/buttons/button";
import { contactQueryOptions } from "#/lib/contacts";
import type { GraphEmailAddress } from "#/schema.ts";
import { authStore } from "#/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { AlertCircle, ArrowLeft } from "@untitledui/icons";
import type { ReactNode } from "react";

export const Route = createFileRoute("/(dashboard)/users/$id/contacts/$contactId")({
  component: RouteComponent,
});

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-b border-secondary py-3 last:border-b-0 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="mt-1 min-w-0 text-sm text-primary sm:mt-0">{children}</dd>
    </div>
  );
}

function Value({ children }: { children: string | null | undefined }) {
  return children ? (
    <span className="break-words">{children}</span>
  ) : (
    <span className="text-tertiary">—</span>
  );
}

function formatEmail(addr: GraphEmailAddress | null | undefined): string | null {
  if (!addr) return null;
  if (addr.name && addr.address) return `${addr.name} <${addr.address}>`;
  return addr.address || addr.name || null;
}

function formatEmails(emails: Array<GraphEmailAddress> | null | undefined): string | null {
  if (!emails?.length) return null;
  const parts = emails.map((e) => formatEmail(e)).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function formatPhones(phones: Array<string> | null | undefined): string | null {
  if (!phones?.length) return null;
  const parts = phones.map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function RouteComponent() {
  const { id, contactId } = Route.useParams();
  const token = useSelector(authStore, (auth) => auth?.accessToken);
  const {
    data: contact,
    isPending,
    isError,
    error,
  } = useQuery(contactQueryOptions(token, id, contactId));

  const title = contact?.displayName?.trim() || "Untitled";

  return (
    <section className="animate-in rounded-2xl bg-primary px-6 py-8 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3 sm:px-10 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start gap-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-display-xs font-semibold tracking-tight text-primary">
            {isPending ? "Loading…" : title}
          </h1>
        </div>
        <Button
          href={`/users/${encodeURIComponent(id)}/contacts`}
          color="secondary"
          size="sm"
          iconLeading={ArrowLeft}
        >
          Contacts
        </Button>
      </header>

      {isError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-error-primary px-3.5 py-3 ring-1 ring-error_subtle"
        >
          <AlertCircle className="size-5 shrink-0 text-fg-error-secondary" />
          <p className="text-sm font-medium text-error-primary">{error.message}</p>
        </div>
      ) : isPending ? (
        <div aria-busy="true" aria-label="Loading contact">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="border-b border-secondary py-4 last:border-b-0">
              <div className="h-4 w-56 max-w-full animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        <dl className="mb-8">
          <Fact label="Emails">
            <Value>{formatEmails(contact.emailAddresses)}</Value>
          </Fact>
          <Fact label="Company">
            <Value>{contact.companyName}</Value>
          </Fact>
          <Fact label="Job title">
            <Value>{contact.jobTitle}</Value>
          </Fact>
          <Fact label="Department">
            <Value>{contact.department}</Value>
          </Fact>
          <Fact label="Mobile">
            <Value>{contact.mobilePhone}</Value>
          </Fact>
          <Fact label="Business phones">
            <Value>{formatPhones(contact.businessPhones)}</Value>
          </Fact>
          <Fact label="Home phones">
            <Value>{formatPhones(contact.homePhones)}</Value>
          </Fact>
          <Fact label="Given name">
            <Value>{contact.givenName}</Value>
          </Fact>
          <Fact label="Surname">
            <Value>{contact.surname}</Value>
          </Fact>
          <Fact label="Object ID">
            <code className="break-all font-mono text-xs text-secondary">{contact.id}</code>
          </Fact>
        </dl>
      )}
    </section>
  );
}
