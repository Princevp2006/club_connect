import { createFileRoute } from "@tanstack/react-router";
import { VolunteerManager } from "@/components/features/volunteers";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/leader/volunteers")({
  head: () => pageHead("Volunteer review", "Approve or reject volunteer applications."),
  component: VolunteerManager,
});
