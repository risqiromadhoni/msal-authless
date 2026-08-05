import { Badge } from "#/components/base/badges/badges";
import { Button } from "#/components/base/buttons/button";
import { contactsQueryOptions } from "#/lib/contacts";
import type { GraphContactType, GraphEmailAddress } from "#/schema.ts";
import { authStore } from "#/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { AlertCircle, ArrowLeft, ChevronRight } from "@untitledui/icons";

export const Route = createFileRoute("/(dashboard)/users/$id/contacts/")({
  component: RouteComponent,
});

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function formatEmail(addr: GraphEmailAddress | null | undefined): string {
  if (!addr) return "";
  return addr.address || addr.name || "";
}

function secondaryLine(contact: GraphContactType): string {
  const email = formatEmail(contact.emailAddresses?.[0]);
  const role = contact.companyName?.trim() || contact.jobTitle?.trim() || "";
  if (email && role) return `${email} · ${role}`;
  return email || role || "—";
}

function ContactRow({ userId, contact }: { userId: string; contact: GraphContactType }) {
  const name = contact.displayName?.trim() || "Unnamed";

  return (
    <li className="border-b border-secondary last:border-b-0">
      <Link
        to="/users/$id/contacts/$contactId"
        params={{ id: userId, contactId: contact.id }}
        className="flex items-center gap-3 rounded-lg px-2 py-3.5 transition hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-sm font-medium text-primary">{name}</p>
          <p className="m-0 truncate text-sm text-tertiary">{secondaryLine(contact)}</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
      </Link>
    </li>
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  const token = useSelector(authStore, (auth) => auth?.accessToken);
  const { data, isPending, isError, error } = useQuery(contactsQueryOptions(token, id));
  const contacts = data?.value ?? [];

  return (
    <section className="animate-in rounded-2xl bg-primary px-6 py-8 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3 sm:px-10 sm:py-10">
      <header className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-display-xs font-semibold tracking-tight text-primary">
          Contacts
        </h1>
        {!isPending && !isError ? (
          <Badge color="gray" size="sm">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </Badge>
        ) : null}
        <Button
          href={`/users/${encodeURIComponent(id)}`}
          color="secondary"
          size="sm"
          iconLeading={ArrowLeft}
        >
          Back
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
        <ul className="m-0 list-none p-0" aria-busy="true" aria-label="Loading contacts">
          {SKELETON_ROWS.map((row) => (
            <li key={row} className="border-b border-secondary px-2 py-3.5 last:border-b-0">
              <div className="mb-2 h-4 w-48 max-w-full animate-pulse rounded bg-secondary" />
              <div className="h-4 w-64 max-w-full animate-pulse rounded bg-secondary" />
            </li>
          ))}
        </ul>
      ) : contacts.length === 0 ? (
        <p className="py-8 text-center text-sm text-tertiary">
          No contacts returned for this user.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {contacts.map((contact) => (
            <ContactRow key={contact.id} userId={id} contact={contact} />
          ))}
        </ul>
      )}
    </section>
  );
}
