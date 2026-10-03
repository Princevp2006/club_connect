import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Welcome",
      "Sign in to manage events, volunteers, tickets and announcements for your student organization.",
    ),
  component: Index,
});
function Index() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (status === "authenticated") navigate({ to: homeFor(user?.role), replace: true });
    if (status === "anonymous") navigate({ to: "/login", replace: true });
  }, [status, user, navigate]);
  return (
    <div className="grid min-h-screen place-items-center bg-crest text-sidebar-foreground">
      <div className="flex flex-col items-center gap-3">
        <GraduationCap className="h-10 w-10 text-brass" aria-hidden />
        <h1 className="text-2xl">Student Union Portal</h1>
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
      </div>
    </div>
  );
}
