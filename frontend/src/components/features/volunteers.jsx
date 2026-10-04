import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, HandHeart, X } from "lucide-react";
import { volunteerApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAction } from "@/hooks/useAction";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "@/components/common";
import { EventPicker } from "./events";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDateTime } from "@/lib/format";
export function useEventApplications(eventId) {
  return useQuery({
    queryKey: ["applications", eventId || "all"],
    queryFn: async () => asList(eventId ? await volunteerApi.getForEvent(eventId) : await volunteerApi.getAll()).items,
  });
}
const needsVols = (e) => !!e.needsVolunteers;
export function VolunteerManager() {
  const [eventId, setEventId] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [confirm, setConfirm] = useState(null);
  const q = useEventApplications(eventId);
  const act = useAction(
    ({ id, action }) => (action === "approve" ? volunteerApi.approve(id) : volunteerApi.reject(id)),
    { success: "Application updated", invalidate: [["applications"]] },
  );
  const list = (q.data ?? []).filter((a) => !filter || a.status === filter);
  return (
    <>
      <PageHeader
        title="Volunteer applications"
        description="Review students who applied to volunteer at events."
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <EventPicker value={eventId} onChange={setEventId} filter={needsVols} />
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
          {["PENDING", "APPROVED", "REJECTED", ""].map((s) => (
            <Button
              key={s || "all"}
              role="tab"
              aria-selected={filter === s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {s ? s[0] + s.slice(1).toLowerCase() : "All"}
            </Button>
          ))}
        </div>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !list.length ? (
        <EmptyState
          icon={HandHeart}
          title={!eventId ? "No events need volunteers." : "No applications here."}
          description="Applications matching this filter will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Application Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.event?.title ?? "—"}</TableCell>
                  <TableCell>
                    <p className="font-semibold">{a.user?.fullName ?? a.student?.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.user?.studentId ?? a.user?.email}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fmtDateTime(a.appliedAt ?? a.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {a.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setConfirm({ app: a, action: "approve" })}>
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirm({ app: a, action: "reject" })}
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Reviewed {fmtDateTime(a.reviewedAt)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "approve" ? "Approve volunteer?" : "Reject application?"}
        description={`${confirm?.app.user?.fullName ?? "This student"} — ${confirm?.app.event?.title ?? ""}`}
        confirmLabel={confirm?.action === "approve" ? "Approve" : "Reject"}
        destructive={confirm?.action === "reject"}
        onConfirm={() => act.mutateAsync({ id: String(confirm.app.id), action: confirm.action })}
      />
    </>
  );
}
