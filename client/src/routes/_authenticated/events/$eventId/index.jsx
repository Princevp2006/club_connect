import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, HandHeart, Loader2, Pencil, Ticket } from "lucide-react";
import { eventsApi, ticketsApi, volunteerApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAction } from "@/hooks/useAction";
import { ErrorState, LoadingState, Panel, StatusBadge } from "@/components/common";
import { EventFormDialog, EventMeta } from "@/components/features/events";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/events/$eventId/")({
  head: () => pageHead("Event details", "Event information, tickets and volunteering."),
  component: EventDetail,
});
function EventDetail() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const isStaff = user?.role === "ADMIN" || user?.role === "STUDENT_LEADER";
  const [editing, setEditing] = useState(false);
  const ev = useQuery({ queryKey: ["event", eventId], queryFn: () => eventsApi.getEvent(eventId) });
  const tickets = useQuery({
    queryKey: ["tickets", "me"],
    queryFn: async () => asList(await ticketsApi.getMine()).items,
    enabled: isStudent,
  });
  const apps = useQuery({
    queryKey: ["applications", "me"],
    queryFn: async () => asList(await volunteerApi.getMine()).items,
    enabled: isStudent,
  });
  const register = useAction(() => ticketsApi.register(eventId), {
    success: "You're registered! Your ticket is in My Tickets.",
    invalidate: [["tickets"], ["dashboard"]],
  });
  const apply = useAction(() => volunteerApi.apply(eventId), {
    success: "Volunteer application submitted",
    invalidate: [["applications"], ["dashboard"]],
  });
  if (ev.isLoading) return <LoadingState rows={3} />;
  if (ev.error) return <ErrorState error={ev.error} onRetry={() => ev.refetch()} />;
  const e = ev.data;
  const sameEvent = (x) => String(x.eventId ?? x.event?.id) === String(eventId);
  const myTicket = tickets.data?.find((t) => sameEvent(t) && t.status !== "CANCELLED");
  const myApp =
    apps.data?.find((a) => sameEvent(a) && a.status !== "CANCELLED") ?? apps.data?.find(sameEvent);
  const open = ["PUBLISHED", "ONGOING"].includes(e.status);
  return (
    <>
      <Link
        to="/events"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border bg-card p-6 shadow-card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={e.status} />
          </div>
          <h1 className="text-3xl font-semibold">{e.title}</h1>
          <div className="mt-4">
            <EventMeta e={e} />
          </div>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/85">
            {e.description}
          </p>
          {isStaff && (
            <Button variant="outline" className="mt-6" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit event
            </Button>
          )}
        </article>
        <div className="space-y-6">
          {isStudent && (
            <Panel title="Your ticket">
              {tickets.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : myTicket ? (
                <div className="space-y-2 text-sm">
                  <p>You're registered.</p>
                  <p className="font-mono text-lg font-semibold text-primary">
                    {myTicket.ticketCode}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/my-tickets">View ticket</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={!open || register.isPending}
                  onClick={() => register.mutate(undefined)}
                >
                  {register.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Ticket className="mr-2 h-4 w-4" />
                  )}{" "}
                  {open ? "Register for event" : "Registration closed"}
                </Button>
              )}
            </Panel>
          )}
          <Panel title="Volunteers">
            {e.needsVolunteers ? (
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <HandHeart className="h-4 w-4 text-brass" /> Volunteer Required
                </p>
                <p className="text-muted-foreground">
                  Volunteer limit: <strong className="text-foreground">{e.volunteerLimit}</strong>
                </p>
                {isStudent &&
                  (apps.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : myApp ? (
                    <p className="flex items-center gap-2">
                      Your application: <StatusBadge status={myApp.status} />
                    </p>
                  ) : (
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled={!open || apply.isPending}
                      onClick={() => apply.mutate(undefined)}
                    >
                      {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Apply
                      as Volunteer
                    </Button>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This event does not need volunteers.</p>
            )}
          </Panel>
        </div>
      </div>
      {isStaff && <EventFormDialog open={editing} onOpenChange={setEditing} event={e} />}
    </>
  );
}
