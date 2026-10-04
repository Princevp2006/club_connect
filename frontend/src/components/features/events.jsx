import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Plus, Pencil, Users, Search, Loader2, XCircle } from "lucide-react";
import { eventsApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAction } from "@/hooks/useAction";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  StatusBadge,
  fieldErrors,
  selectClass,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { fmtDate, fmtTime } from "@/lib/format";

export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"];
export const CREATION_STATUSES = ["DRAFT", "PUBLISHED"];

export function formatAmPm(val) {
  if (!val) return "";
  const match = String(val).match(/(\d{1,2}):(\d{2})/);
  if (!match) return val;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

export function useEvents(query) {
  return useQuery({
    queryKey: ["events", query ?? {}],
    queryFn: async () => asList(await eventsApi.getEvents(query)).items,
  });
}
/** Event selector used by volunteer, task and attendance tools. */
export function EventPicker({ value, onChange, filter }) {
  const q = useEvents();
  const events = useMemo(() => (q.data ?? []).filter(filter ?? (() => true)), [q.data, filter]);
  useEffect(() => {
    if (!value && events.length) onChange(String(events[0].id));
  }, [value, events, onChange]);
  return (
    <div className="w-full sm:w-80">
      <label
        htmlFor="event-picker"
        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Event
      </label>
      <select
        id="event-picker"
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={q.isLoading}
      >
        {q.isLoading && <option>Loading events…</option>}
        {!q.isLoading && !events.length && <option value="">No events</option>}
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title} — {fmtDate(e.eventDate)}
          </option>
        ))}
      </select>
    </div>
  );
}
export function EventMeta({ e }) {
  return (
    <div className="space-y-1.5 text-sm text-muted-foreground">
      <p className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-brass" aria-hidden /> {fmtDate(e.eventDate)}
      </p>
      <p className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-brass" aria-hidden /> {fmtTime(e.startTime)} –{" "}
        {fmtTime(e.endTime)}
      </p>
      <p className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-brass" aria-hidden /> {e.location}
      </p>
    </div>
  );
}
export function EventsBrowser() {
  const [search, setSearch] = useState("");
  const q = useEvents();
  const list = (q.data ?? []).filter((e) => e.title?.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader title="Events" description="Discover what's happening across the organization." />
      <div className="relative mb-5 max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Search events"
          placeholder="Search events…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !list.length ? (
        <EmptyState icon={CalendarDays} title="No events available yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <Link
              key={e.id}
              to="/events/$eventId"
              params={{ eventId: String(e.id) }}
              className="group flex flex-col rounded-xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <StatusBadge status={e.status} />
                {e.needsVolunteers && (
                  <StatusBadge tone="primary" label="Volunteering Open" />
                )}
              </div>
              <h3 className="mb-3 text-lg font-semibold group-hover:text-primary">{e.title}</h3>
              <EventMeta e={e} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
export function EventFormDialog({ open, onOpenChange, event }) {
  const empty = {
    title: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    status: "DRAFT",
    needsVolunteers: false,
    volunteerLimit: "",
  };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (event) {
        const toDateStr = (v) => {
          if (!v) return "";
          try {
            const d = new Date(v);
            if (isNaN(d.getTime())) return "";
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
          } catch {
            return "";
          }
        };
        const toTimeStr = (v) => {
          if (!v) return "";
          try {
            const d = new Date(v);
            if (isNaN(d.getTime())) {
              return /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : "";
            }
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            return `${hh}:${mm}`;
          } catch {
            return "";
          }
        };

        const initialStatus = event.status === "PUBLISHED" || event.status === "ONGOING" || event.status === "COMPLETED"
          ? "PUBLISHED"
          : "DRAFT";

        setF({
          ...empty,
          ...event,
          eventDate: toDateStr(event.eventDate),
          startTime: toTimeStr(event.startTime),
          endTime: toTimeStr(event.endTime),
          status: initialStatus,
          volunteerLimit: event.volunteerLimit ?? "",
        });
      } else {
        setF(empty);
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event]);

  const save = useAction(
    (body) => (event ? eventsApi.updateEvent(String(event.id), body) : eventsApi.createEvent(body)),
    { success: event ? "Event updated" : "Event created", invalidate: [["events"], ["event"], ["dashboard"]] },
  );

  async function submit(ev) {
    ev.preventDefault();
    const e = {};
    ["title", "description", "eventDate", "startTime", "endTime", "location"].forEach((k) => {
      if (!String(f[k] ?? "").trim()) e[k] = "Required";
    });

    if (f.eventDate && f.startTime && f.endTime) {
      const datePart = f.eventDate.includes("T") ? f.eventDate.split("T")[0] : f.eventDate;
      const sPart = f.startTime.length === 5 ? `${f.startTime}:00` : f.startTime;
      const ePart = f.endTime.length === 5 ? `${f.endTime}:00` : f.endTime;
      const localStart = new Date(`${datePart}T${sPart}`);
      const localEnd = new Date(`${datePart}T${ePart}`);

      if (isNaN(localStart.getTime())) {
        e.startTime = "Invalid start time";
      }
      if (isNaN(localEnd.getTime())) {
        e.endTime = "Invalid end time";
      } else if (!isNaN(localStart.getTime()) && localEnd <= localStart) {
        e.endTime = "End time must be after start time";
      }
    } else if (f.startTime && f.endTime && f.endTime <= f.startTime) {
      e.endTime = "End time must be after start time";
    }

    if (f.needsVolunteers && !(Number(f.volunteerLimit) > 0)) {
      e.volunteerLimit = "Volunteer limit must be a positive number";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const datePart = f.eventDate.includes("T") ? f.eventDate.split("T")[0] : f.eventDate;
    const sPart = f.startTime.length === 5 ? `${f.startTime}:00` : f.startTime;
    const ePart = f.endTime.length === 5 ? `${f.endTime}:00` : f.endTime;

    const eventDateIso = new Date(`${datePart}T00:00:00`).toISOString();
    const startTimeIso = new Date(`${datePart}T${sPart}`).toISOString();
    const endTimeIso = new Date(`${datePart}T${ePart}`).toISOString();

    const body = {
      title: f.title.trim(),
      description: f.description.trim(),
      eventDate: eventDateIso,
      startTime: startTimeIso,
      endTime: endTimeIso,
      location: f.location.trim(),
      status: f.status,
      needsVolunteers: !!f.needsVolunteers,
    };
    if (f.needsVolunteers) body.volunteerLimit = Number(f.volunteerLimit);

    try {
      await save.mutateAsync(body);
      onOpenChange(false);
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>Fields marked * are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" htmlFor="ev-title" required error={errors.title}>
              <Input
                id="ev-title"
                type="text"
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
                aria-invalid={!!errors.title}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="ev-description" required error={errors.description}>
              <Textarea
                id="ev-description"
                rows={3}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                aria-invalid={!!errors.description}
              />
            </Field>
          </div>
          <Field label="Event Date" htmlFor="ev-eventDate" required error={errors.eventDate}>
            <Input
              id="ev-eventDate"
              type="date"
              value={f.eventDate}
              onChange={(e) => setF({ ...f, eventDate: e.target.value })}
              aria-invalid={!!errors.eventDate}
            />
          </Field>
          <Field label="Location" htmlFor="ev-location" required error={errors.location}>
            <Input
              id="ev-location"
              type="text"
              value={f.location}
              onChange={(e) => setF({ ...f, location: e.target.value })}
              aria-invalid={!!errors.location}
            />
          </Field>
          <Field label="Start Time" htmlFor="ev-startTime" required error={errors.startTime}>
            <div className="space-y-1.5">
              <Input
                id="ev-startTime"
                type="time"
                value={f.startTime}
                onChange={(e) => setF({ ...f, startTime: e.target.value })}
                aria-invalid={!!errors.startTime}
              />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span>
                  {f.startTime ? (
                    <>
                      Formatted: <strong className="text-foreground">{formatAmPm(f.startTime)}</strong>
                    </>
                  ) : (
                    <span className="italic">Choose start time (AM/PM formatted)</span>
                  )}
                </span>
              </div>
            </div>
          </Field>
          <Field label="End Time" htmlFor="ev-endTime" required error={errors.endTime}>
            <div className="space-y-1.5">
              <Input
                id="ev-endTime"
                type="time"
                value={f.endTime}
                onChange={(e) => setF({ ...f, endTime: e.target.value })}
                aria-invalid={!!errors.endTime}
              />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span>
                  {f.endTime ? (
                    <>
                      Formatted: <strong className="text-foreground">{formatAmPm(f.endTime)}</strong>
                    </>
                  ) : (
                    <span className="italic">Choose end time (AM/PM formatted)</span>
                  )}
                </span>
              </div>
            </div>
          </Field>
          <Field label="Status" htmlFor="ev-status" required>
            <select
              id="ev-status"
              className={selectClass}
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
            >
              {CREATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {f.status === "DRAFT"
                ? "Draft events are hidden from students until explicitly published."
                : "Published events automatically update to Ongoing and Completed based on date and time."}
            </p>
          </Field>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="ev-needs"
              checked={!!f.needsVolunteers}
              onCheckedChange={(v) => setF({ ...f, needsVolunteers: v })}
            />
            <label htmlFor="ev-needs" className="text-sm font-medium">
              Needs volunteers
            </label>
          </div>
          {f.needsVolunteers && (
            <div className="sm:col-span-2">
              <Field label="Volunteer Limit" htmlFor="ev-volunteerLimit" required error={errors.volunteerLimit}>
                <Input
                  id="ev-volunteerLimit"
                  type="number"
                  min="1"
                  value={f.volunteerLimit}
                  onChange={(e) => setF({ ...f, volunteerLimit: e.target.value })}
                  aria-invalid={!!errors.volunteerLimit}
                />
              </Field>
            </div>
          )}
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
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              {event ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EventManager() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const queryParams = useMemo(() => {
    const p = {};
    if (status) p.status = status;
    if (search.trim()) p.search = search.trim();
    return Object.keys(p).length ? p : undefined;
  }, [status, search]);
  const q = useEvents(queryParams);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cancellingEvent, setCancellingEvent] = useState(null);

  const cancelAction = useAction(
    (id) => eventsApi.updateEvent(String(id), { status: "CANCELLED" }),
    {
      success: "Event cancelled successfully",
      invalidate: [["events"], ["event"], ["dashboard"]],
    }
  );

  return (
    <>
      <PageHeader
        title="Events"
        description="Create, publish and manage organization events."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events by title, location, creator..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <select
            aria-label="Filter by status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={CalendarDays}
          title={search.trim() || status ? "No matching events found." : "No events available yet."}
          description={search.trim() || status ? "Try adjusting your search query or status filter." : undefined}
          action={<Button onClick={() => setOpen(true)}>Create the first event</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volunteers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold">
                    <Link
                      to="/events/$eventId"
                      params={{ eventId: String(e.id) }}
                      className="hover:text-primary hover:underline"
                    >
                      {e.title}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDate(e.eventDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fmtTime(e.startTime)} – {fmtTime(e.endTime)}
                  </TableCell>
                  <TableCell>{e.location}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    {e.needsVolunteers ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden /> {e.volunteerLimit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not needed</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(e);
                          setOpen(true);
                        }}
                        aria-label={`Edit ${e.title}`}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      {e.status !== "CANCELLED" && e.status !== "COMPLETED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setCancellingEvent(e)}
                          aria-label={`Cancel ${e.title}`}
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <EventFormDialog open={open} onOpenChange={setOpen} event={editing} />

      <ConfirmDialog
        open={!!cancellingEvent}
        onOpenChange={(o) => !o && setCancellingEvent(null)}
        title={`Cancel "${cancellingEvent?.title}"?`}
        description="Are you sure you want to cancel this event? This action will mark the event as cancelled."
        confirmLabel="Cancel Event"
        variant="destructive"
        loading={cancelAction.isPending}
        onConfirm={async () => {
          if (cancellingEvent) {
            await cancelAction.mutateAsync(cancellingEvent.id);
            setCancellingEvent(null);
          }
        }}
      />
    </>
  );
}
