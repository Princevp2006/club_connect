import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { ticketsApi } from "@/api";
import { asList } from "@/api/apiClient";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/common";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/format";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/_student/my-tickets")({
  head: () => pageHead("My tickets", "Your digital event tickets."),
  component: MyTickets,
});
function MyTickets() {
  const q = useQuery({
    queryKey: ["tickets", "me"],
    queryFn: async () => asList(await ticketsApi.getMine()).items,
  });
  return (
    <>
      <PageHeader
        title="My tickets"
        description="Show the QR code or ticket code at the entrance."
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={Ticket}
          title="You have no event tickets."
          description="Register for an event to receive your ticket."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((t) => {
            const e = t.event ?? {};
            const cancelled = t.status === "CANCELLED";
            return (
              <article
                key={t.id}
                className={`overflow-hidden rounded-2xl border bg-card shadow-card ${cancelled ? "opacity-60" : ""}`}
              >
                <div className="bg-crest p-5 text-sidebar-foreground">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                      Admit one
                    </p>
                    <StatusBadge status={t.status} />
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-sidebar-accent-foreground">
                    {e.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4" aria-hidden /> {fmtDate(e.eventDate)} ·{" "}
                    {fmtTime(e.startTime)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" aria-hidden /> {e.location}
                  </p>
                </div>
                <div className="relative border-t-2 border-dashed p-5 text-center">
                  <div className="mx-auto w-fit rounded-lg bg-card p-2">
                    <QRCodeSVG
                      value={JSON.stringify({ ticketCode: t.ticketCode })}
                      size={140}
                      level="M"
                      aria-label={`QR code for ticket ${t.ticketCode}`}
                    />
                  </div>
                  <p className="mt-3 font-mono text-2xl font-bold tracking-widest text-primary">
                    {t.ticketCode}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registered {fmtDateTime(t.createdAt ?? t.registeredAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
