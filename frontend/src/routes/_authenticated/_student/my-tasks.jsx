import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, MapPin, ScanLine } from "lucide-react";
import { tasksApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAction } from "@/hooks/useAction";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
  selectClass,
} from "@/components/common";
import { TASK_STATUSES } from "@/components/features/tasks";
import { Button } from "@/components/ui/button";
import { fmtDateTime, humanize } from "@/lib/format";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/_student/my-tasks")({
  head: () => pageHead("My tasks", "Your assigned volunteer tasks."),
  component: MyTasks,
});
function MyTasks() {
  const q = useQuery({
    queryKey: ["tasks", "me"],
    queryFn: async () => asList(await tasksApi.getMyTasks()).items,
  });
  const update = useAction(({ id, status }) => tasksApi.updateStatus(id, status), {
    success: "Task status updated",
    invalidate: [["tasks"], ["dashboard"]],
  });
  return (
    <>
      <PageHeader
        title="My tasks"
        description="Update your progress as you work through each task."
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState icon={ClipboardList} title="You have no assigned volunteer tasks." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {q.data.map((t) => (
            <article key={t.id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={t.taskType}
                  tone={t.taskType === "QR_SCANNER" ? "primary" : "neutral"}
                />
                <StatusBadge status={t.status} />
              </div>
              <h2 className="mt-3 text-lg font-semibold">{t.title ?? t.taskTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.event?.title}</p>
              {t.description && <p className="mt-2 text-sm">{t.description}</p>}
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brass" aria-hidden /> {fmtDateTime(t.startTime)} –{" "}
                  {fmtDateTime(t.endTime)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brass" aria-hidden /> {t.location}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-48">
                  <label
                    htmlFor={`st-${t.id}`}
                    className="mb-1 block text-xs font-semibold text-muted-foreground"
                  >
                    Status
                  </label>
                  <select
                    id={`st-${t.id}`}
                    className={selectClass}
                    value={t.status}
                    disabled={update.isPending}
                    onChange={(e) => update.mutate({ id: String(t.id), status: e.target.value })}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {humanize(s)}
                      </option>
                    ))}
                  </select>
                </div>
                {t.taskType === "QR_SCANNER" && (t.eventId ?? t.event?.id) && (
                  <Button asChild>
                    <Link
                      to="/events/$eventId/scanner"
                      params={{ eventId: String(t.eventId ?? t.event.id) }}
                    >
                      <ScanLine className="mr-2 h-4 w-4" /> Open scanner
                    </Link>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
