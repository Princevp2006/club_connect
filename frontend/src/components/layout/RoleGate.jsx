import { Link } from "@tanstack/react-router";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { ForbiddenState } from "@/components/common";
import { Button } from "@/components/ui/button";
/** UI-level route guard. The backend remains the source of truth for authorization. */
export function RoleGate({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="space-y-4">
        <ForbiddenState message="Your role does not have access to this area." />
        <div className="text-center">
          <Button asChild variant="outline">
            <Link to={homeFor(user?.role)}>Go to my dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
