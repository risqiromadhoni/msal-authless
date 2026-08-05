import { Badge } from "#/components/base/badges/badges";
import { Button } from "#/components/base/buttons/button";
import { userQueryOptions } from "#/lib/users";
import { authStore } from "#/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { AlertCircle, ArrowLeft } from "@untitledui/icons";
import type { ReactNode } from "react";

export const Route = createFileRoute("/(dashboard)/users/$id/")({
  component: RouteComponent,
});

const RESOURCES = [
  ["/users/$id/emails", "Emails", "brand"],
  ["/users/$id/contacts", "Contacts", "warning"],
  ["/users/$id/calendars", "Calendars", "success"],
] as const;

// Same shape as the Fact in profile/index.tsx, kept local rather than reaching
// across routes to export it.
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

function RouteComponent() {
  const { id } = Route.useParams();
  const token = useSelector(authStore, (auth) => auth?.accessToken);
  const { data: user, isPending, isError, error } = useQuery(userQueryOptions(token, id));

  return (
    <section className="animate-in rounded-2xl bg-primary px-6 py-8 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3 sm:px-10 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start gap-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-display-xs font-semibold tracking-tight text-primary">
            {isPending ? "Loading…" : user?.displayName || user?.userPrincipalName || id}
          </h1>
          {user?.userPrincipalName ? (
            <p className="m-0 truncate text-sm text-tertiary">{user.userPrincipalName}</p>
          ) : null}
        </div>
        <Button href="/users" color="secondary" size="sm" iconLeading={ArrowLeft}>
          All users
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
        <div aria-busy="true" aria-label="Loading user">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="border-b border-secondary py-4 last:border-b-0">
              <div className="h-4 w-56 max-w-full animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <dl className="mb-8">
            <Fact label="Email">
              <Value>{user.mail}</Value>
            </Fact>
            <Fact label="Job title">
              <Value>{user.jobTitle}</Value>
            </Fact>
            <Fact label="Office">
              <Value>{user.officeLocation}</Value>
            </Fact>
            <Fact label="Mobile">
              <Value>{user.mobilePhone}</Value>
            </Fact>
            <Fact label="Business phones">
              <Value>{user.businessPhones?.join(", ")}</Value>
            </Fact>
            <Fact label="Preferred language">
              <Value>{user.preferredLanguage}</Value>
            </Fact>
            <Fact label="Object ID">
              <code className="break-all font-mono text-xs text-secondary">{user.id}</code>
            </Fact>
          </dl>

          <div className="border-t border-secondary pt-6">
            <h2 className="mb-3 text-sm font-semibold text-primary">Resources</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {RESOURCES.map(([to, label, color]) => (
                <li key={to}>
                  <Link
                    to={to}
                    params={{ id }}
                    className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Badge color={color} size="lg">
                      {label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
