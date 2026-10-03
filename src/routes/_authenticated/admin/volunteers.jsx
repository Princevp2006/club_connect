import { createFileRoute } from "@tanstack/react-router";
import { VolunteerManager } from "@/components/features/volunteers";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  head: () => pageHead("Volunteers", "Review and approve volunteer applications."),
  component: VolunteerManager,
});
