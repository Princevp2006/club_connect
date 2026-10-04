import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2, Plus, Repeat } from "lucide-react";
import { tasksApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAction } from "@/hooks/useAction";
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  StatusBadge,
  fieldErrors,
  selectClass,
} from "@/components/common";
import { EventPicker } from "./events";
import { useEventApplications } from "./volunteers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDateTime, humanize } from "@/lib/format";
export const TASK_TYPES = [
  "QR_SCANNER",
  "REGISTRATION",
  "SEATING",
  "HELP_DESK",
  "EVENT_SETUP",
  "OTHER",
];
export const TASK_STATUSES = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];
const volunteerId = (a) => String(a.userId ?? a.user?.id ?? a.studentId);
function TaskFormDialog({ open, onOpenChange, eventId, approved }) {
  const empty = {
    volunteerId: "",
    taskType: "REGISTRATION",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setF(empty);
      setErrors({});
    } /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [open]);
  const save = useAction((body) => tasksApi.create(eventId, body), {
    success: "Task assigned",
    invalidate: [["tasks"]],
  });
  async function submit(ev) {
    ev.preventDefault();
    const e = {};
    ["volunteerId", "taskType", "title", "startTime", "endTime", "location"].forEach((k) => {
      if (!f[k]) e[k] = "Required";
    });
    if (f.startTime && f.endTime && new Date(f.endTime) <= new Date(f.startTime))
      e.endTime = "End must be after start";
    setErrors(e);
    if (Object.keys(e).length) return;

    const toIso = (dt) => {
      if (!dt) return null;
      try {
        const d = new Date(dt);
        return isNaN(d.getTime()) ? dt : d.toISOString();
      } catch {
        return dt;
      }
    };

    const payload = {
      volunteerUserId: f.volunteerId,
      volunteerId: f.volunteerId,
      taskType: f.taskType,
      taskTitle: f.title,
      title: f.title,
      description: f.description || "",
      startTime: toIso(f.startTime),
      endTime: toIso(f.endTime),
      location: f.location,
    };

    try {
      await save.mutateAsync(payload);
      onOpenChange(false);
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign volunteer task</DialogTitle>
          <DialogDescription>
            Only approved volunteers for this event can receive tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Volunteer" htmlFor="t-vol" required error={errors.volunteerId}>
            <select
              id="t-vol"
              className={selectClass}
              value={f.volunteerId}
              onChange={set("volunteerId")}
            >
              <option value="">Select volunteer</option>
              {approved.map((a) => (
                <option key={a.id} value={volunteerId(a)}>
                  {a.user?.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Task Type" htmlFor="t-type" required error={errors.taskType}>
            <select
              id="t-type"
              className={selectClass}
              value={f.taskType}
              onChange={set("taskType")}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Task Title" htmlFor="t-title" required error={errors.title}>
              <Input id="t-title" value={f.title} onChange={set("title")} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="t-desc" error={errors.description}>
              <Textarea id="t-desc" rows={2} value={f.description} onChange={set("description")} />
            </Field>
          </div>
          <Field label="Start Time" htmlFor="t-start" required error={errors.startTime}>
            <Input
              id="t-start"
              type="datetime-local"
              value={f.startTime}
              onChange={set("startTime")}
            />
          </Field>
          <Field label="End Time" htmlFor="t-end" required error={errors.endTime}>
            <Input id="t-end" type="datetime-local" value={f.endTime} onChange={set("endTime")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Location" htmlFor="t-loc" required error={errors.location}>
              <Input id="t-loc" value={f.location} onChange={set("location")} />
            </Field>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Assign task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function ReassignDialog({ task, onOpenChange, approved }) {
  const [vid, setVid] = useState("");
  useEffect(() => setVid(""), [task]);
  const act = useAction((v) => tasksApi.reassign(String(task.id), v), {
    success: "Task reassigned",
    invalidate: [["tasks"]],
  });
  const current = String(task?.volunteerId ?? task?.volunteer?.id);
  const options = approved.filter((a) => volunteerId(a) !== current);
  return (
    <Dialog open={!!task} onOpenChange={(o) => !act.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign task</DialogTitle>
          <DialogDescription>
            {task?.title ?? task?.taskTitle} — currently {task?.volunteer?.fullName ?? "unassigned"}
          </DialogDescription>
        </DialogHeader>
        <Field label="New volunteer" htmlFor="r-vol" required>
          <select
            id="r-vol"
            className={selectClass}
            value={vid}
            onChange={(e) => setVid(e.target.value)}
          >
            <option value="">Select an approved volunteer</option>
            {options.map((a) => (
              <option key={a.id} value={volunteerId(a)}>
                {a.user?.fullName}
              </option>
            ))}
          </select>
        </Field>
        {!options.length && (
          <p className="text-sm text-muted-foreground">
            No other approved volunteers for this event.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={act.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!vid || act.isPending}
            onClick={async () => {
              try {
                await act.mutateAsync(vid);
                onOpenChange(false);
              } catch {
                /* toast */
              }
            }}
          >
            {act.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function TaskManager() {
  const [eventId, setEventId] = useState("");
  const [open, setOpen] = useState(false);
  const [reassign, setReassign] = useState(null);
  const tasks = useQuery({
    queryKey: ["tasks", eventId],
    queryFn: async () => asList(await tasksApi.getForEvent(eventId)).items,
    enabled: !!eventId,
  });
  const apps = useEventApplications(eventId);
  const approved = (apps.data ?? []).filter((a) => a.status === "APPROVED");
  return (
    <>
      <PageHeader
        title="Volunteer tasks"
        description="Assign and reassign tasks to approved volunteers."
        actions={
          <Button disabled={!eventId} onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Assign Task
          </Button>
        }
      />
      <div className="mb-5">
        <EventPicker value={eventId} onChange={setEventId} filter={(e) => !!e.needsVolunteers} />
      </div>
      {!eventId ? (
        <EmptyState icon={ClipboardList} title="No events need volunteers." />
      ) : tasks.isLoading ? (
        <LoadingState />
      ) : tasks.error ? (
        <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />
      ) : !tasks.data?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks assigned for this event."
          description={
            approved.length
              ? "Assign a task to an approved volunteer."
              : "Approve volunteers first, then assign tasks."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Volunteer</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold">{t.title ?? t.taskTitle}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={t.taskType}
                      tone={t.taskType === "QR_SCANNER" ? "primary" : "neutral"}
                    />
                  </TableCell>
                  <TableCell>{t.volunteer?.fullName ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {fmtDateTime(t.startTime)}
                    <br />→ {fmtDateTime(t.endTime)}
                  </TableCell>
                  <TableCell>{t.location}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={t.status === "COMPLETED"}
                      onClick={() => setReassign(t)}
                    >
                      <Repeat className="mr-1 h-4 w-4" /> Reassign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <TaskFormDialog open={open} onOpenChange={setOpen} eventId={eventId} approved={approved} />
      <ReassignDialog
        task={reassign}
        onOpenChange={(o) => !o && setReassign(null)}
        approved={approved}
      />
    </>
  );
}
