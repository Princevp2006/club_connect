import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IdCard } from "lucide-react";
import { membershipApi } from "@/api";
import { ApiError } from "@/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/common";
import { fmtDate, humanize } from "@/lib/format";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/_student/my-membership")({
  head: () => pageHead("My membership", "Your organization membership status."),
  component: Page,
});
function Page() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["membership", "me"],
    queryFn: async () => {
      try {
        return await membershipApi.getMine();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });
  const m = q.data;
  return (
    <>
      <PageHeader title="My membership" />
      {q.isLoading ? (
        <LoadingState rows={2} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !m ? (
        <EmptyState
          icon={IdCard}
          title="You don't have a membership yet."
          description="Contact an administrator to set up your membership."
        />
      ) : (
        <div className="max-w-lg overflow-hidden rounded-2xl border bg-crest p-6 text-sidebar-foreground shadow-card">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
              Member card
            </p>
            <StatusBadge status={m.status} />
          </div>
          <p className="mt-6 font-display text-2xl font-semibold text-sidebar-accent-foreground">
            {user?.fullName}
          </p>
          <p className="text-sm">{user?.studentId}</p>
          <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-sidebar-foreground/60">Type</dt>
              <dd className="font-semibold">{humanize(m.membershipType)}</dd>
            </div>
            <div>
              <dt className="text-xs text-sidebar-foreground/60">Start</dt>
              <dd className="font-semibold">{fmtDate(m.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-sidebar-foreground/60">End</dt>
              <dd className="font-semibold">{fmtDate(m.endDate)}</dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
}
