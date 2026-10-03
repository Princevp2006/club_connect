import { createFileRoute } from "@tanstack/react-router";
import { LeaderDashboard } from "@/components/features/dashboards";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/leader/dashboard")({
  head: () => pageHead("Leader dashboard", "Operational overview for student leaders."),
  component: LeaderDashboard,
});
