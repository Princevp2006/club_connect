import { createFileRoute } from "@tanstack/react-router";
import { EventManager } from "@/components/features/events";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => pageHead("Manage events", "Create and manage organization events."),
  component: EventManager,
});
