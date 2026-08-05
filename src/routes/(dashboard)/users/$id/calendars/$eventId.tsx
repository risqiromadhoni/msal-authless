import { Badge } from "#/components/base/badges/badges";
import { Button } from "#/components/base/buttons/button";
import { calendarQueryOptions } from "#/lib/calendars";
import type { GraphAttendee, GraphDateTimeTimeZone, GraphRecipient } from "#/schema.ts";
import { authStore } from "#/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { AlertCircle, ArrowLeft } from "@untitledui/icons";
import type { ReactNode } from "react";

export const Route = createFileRoute("/(dashboard)/users/$id/calendars/$eventId")({
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

function formatAddress(recipient: GraphRecipient | null | undefined): string | null {
  const addr = recipient?.emailAddress;
  if (!addr) return null;
  if (addr.name && addr.address) return `${addr.name} <${addr.address}>`;
  return addr.name || addr.address || null;
}

function formatAttendees(attendees: Array<GraphAttendee> | null | undefined): string | null {
  if (!attendees?.length) return null;
  const parts = attendees
    .map((a) => formatAddress({ emailAddress: a.emailAddress }))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function formatWhen(slot: GraphDateTimeTimeZone | null | undefined): string | null {
  const raw = slot?.dateTime;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const when = date.toLocaleString();
  return slot?.timeZone ? `${when} (${slot.timeZone})` : when;
}

function RouteComponent() {
  const { id, eventId } = Route.useParams();
  const token = useSelector(authStore, (auth) => auth?.accessToken);
  const {
    data: event,
    isPending,
    isError,
    error,
  } = useQuery(calendarQueryOptions(token, id, eventId));

  const subject = event?.subject?.trim() || "Untitled";
  const body = event?.body;
  const isTextBody = body?.contentType?.toLowerCase() === "text" && !!body.content?.trim();
  const isHtmlBody = body?.contentType?.toLowerCase() === "html" && !!body.content?.trim();

  return (
    <section className="animate-in rounded-2xl bg-primary px-6 py-8 shadow-xs ring-1 ring-secondary fade-in slide-in-from-bottom-3 sm:px-10 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start gap-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-display-xs font-semibold tracking-tight text-primary">
            {isPending ? "Loading…" : subject}
          </h1>
        </div>
        <Button
          href={`/users/${encodeURIComponent(id)}/calendars`}
          color="secondary"
          size="sm"
          iconLeading={ArrowLeft}
        >
          Calendar
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
        <div aria-busy="true" aria-label="Loading event">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="border-b border-secondary py-4 last:border-b-0">
              <div className="h-4 w-56 max-w-full animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <dl className="mb-8">
            <Fact label="Start">
              <Value>{formatWhen(event.start)}</Value>
            </Fact>
            <Fact label="End">
              <Value>{formatWhen(event.end)}</Value>
            </Fact>
            <Fact label="Location">
              <Value>{event.location?.displayName}</Value>
            </Fact>
            <Fact label="Organizer">
              <Value>{formatAddress(event.organizer)}</Value>
            </Fact>
            <Fact label="Attendees">
              <Value>{formatAttendees(event.attendees)}</Value>
            </Fact>
            <Fact label="Show as">
              <Value>{event.showAs}</Value>
            </Fact>
            <Fact label="All day">
              <Badge color={event.isAllDay ? "brand" : "gray"} size="sm">
                {event.isAllDay ? "Yes" : "No"}
              </Badge>
            </Fact>
            <Fact label="Cancelled">
              <Badge color={event.isCancelled ? "error" : "gray"} size="sm">
                {event.isCancelled ? "Yes" : "No"}
              </Badge>
            </Fact>
            <Fact label="Preview">
              <Value>{event.bodyPreview}</Value>
            </Fact>
          </dl>

          {isTextBody ? (
            <div className="border-t border-secondary pt-6">
              <h2 className="mb-3 text-sm font-semibold text-primary">Body</h2>
              <pre className="m-0 whitespace-pre-wrap break-words font-body text-sm text-secondary">
                {body!.content}
              </pre>
            </div>
          ) : isHtmlBody ? (
            <div className="border-t border-secondary pt-6">
              <p className="m-0 text-sm text-tertiary">HTML body not rendered.</p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
