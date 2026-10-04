import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/leader/events")({
  beforeLoad: () => {
    throw redirect({ to: "/events" });
  },
});
