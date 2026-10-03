import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/layout/RoleGate";
export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <RoleGate roles={["ADMIN"]}>
      <Outlet />
    </RoleGate>
  ),
});
