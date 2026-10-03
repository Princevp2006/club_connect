import { createFileRoute } from "@tanstack/react-router";
import { StudentDashboard } from "@/components/features/dashboards";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/_student/app")({
  head: () => pageHead("Dashboard", "Your events, tickets, volunteer tasks and orders."),
  component: StudentDashboard,
});
