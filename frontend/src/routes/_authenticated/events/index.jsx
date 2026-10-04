import { createFileRoute } from "@tanstack/react-router";
import { EventsBrowser, EventManager } from "@/components/features/events";
import { useAuth } from "@/contexts/AuthContext";
import { pageHead } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => pageHead("Events", "Browse and manage organization events."),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  if (user?.role === "ADMIN" || user?.role === "STUDENT_LEADER") {
    return <EventManager />;
  }
  return <EventsBrowser />;
}
