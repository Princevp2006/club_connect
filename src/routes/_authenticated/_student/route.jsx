import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/layout/RoleGate";
export const Route = createFileRoute("/_authenticated/_student")({
  component: () => (
    <RoleGate roles={["STUDENT"]}>
      <Outlet />
    </RoleGate>
  ),
});
