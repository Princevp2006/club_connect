import { createFileRoute } from "@tanstack/react-router";
import { EventManager } from "@/components/features/events";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/leader/events")({
  head: () => pageHead("Events", "Create and manage events as a student leader."),
  component: EventManager,
});
