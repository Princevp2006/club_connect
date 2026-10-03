import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: ProtectedLayout,
});
function ProtectedLayout() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  useEffect(() => {
    if (status === "anonymous") navigate({ to: "/login", replace: true });
  }, [status, navigate, href]);
  if (status !== "authenticated") {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading your account" />
      </div>
    );
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
