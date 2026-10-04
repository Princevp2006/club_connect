import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/features/dashboards";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => pageHead("Admin dashboard", "Organization-wide overview for administrators."),
  component: AdminDashboard,
});
