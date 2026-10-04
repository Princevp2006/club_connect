import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, IdCard, Loader2, XCircle } from "lucide-react";
import { membershipApi } from "@/api";
import { ApiError } from "@/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAction } from "@/hooks/useAction";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtDate, humanize } from "@/lib/format";
import { pageHead } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/_student/my-membership")({
  head: () => pageHead("My membership", "Your organization membership status."),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const cancelAction = useAction(() => membershipApi.cancelMine(), {
    success: "Membership cancelled successfully",
    invalidate: [["membership", "me"], ["dashboard"]],
  });

  const m = Array.isArray(q.data) ? q.data[0] : q.data;
  const isLifetime = m?.membershipType === "LIFETIME";
  const isActive = m?.status === "ACTIVE";
  const isCancelled = m?.status === "CANCELLED";

  async function handleConfirmCancel() {
    try {
      await cancelAction.mutateAsync();
      setConfirmOpen(false);
    } catch {
      // Handled by useAction
    }
  }

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
          description="Choose a membership plan to activate full access."
          action={
            <Button asChild>
              <Link to="/subscribe">
                Choose a Membership Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {isCancelled && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Membership Cancelled</p>
                <p className="text-muted-foreground">
                  Your membership has been cancelled. You will not be able to log in normally
                  during your next session until you purchase or activate a new membership.
                </p>
                <div className="pt-2">
                  <Button size="sm" asChild>
                    <Link to="/subscribe">
                      Renew Membership Plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

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
                <dd className="font-semibold">
                  {isLifetime ? "No Expiry / Lifetime" : fmtDate(m.endDate)}
                </dd>
              </div>
            </dl>

            {isActive && (
              <div className="mt-8 border-t border-sidebar-border/40 pt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Cancel Membership
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !cancelAction.isPending && setConfirmOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Cancel Your Membership?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-foreground/90">
              <p>
                Are you sure you want to cancel your active{" "}
                <strong>{m?.membershipType ? humanize(m.membershipType) : ""}</strong> membership?
              </p>
              <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground font-medium">
                <strong>Important Notice:</strong> Cancelling your membership will make your account
                require a new membership before you can access or log in to the organization portal again.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={cancelAction.isPending}
            >
              Keep Membership
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelAction.isPending}
              onClick={handleConfirmCancel}
            >
              {cancelAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
