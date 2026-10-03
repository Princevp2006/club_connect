import { createFileRoute } from "@tanstack/react-router";
import { EventsBrowser } from "@/components/features/events";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/events/")({
  head: () => pageHead("Events", "Browse published organization events."),
  component: EventsBrowser,
});
