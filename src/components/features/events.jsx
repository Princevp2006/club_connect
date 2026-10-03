import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Plus, Pencil, Users, Search, Loader2 } from "lucide-react";
import { eventsApi } from "@/api";
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
                  <StatusBadge tone="primary" label={`Volunteers · ${e.volunteerLimit ?? "—"}`} />
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
      setF(event ? { ...empty, ...event, volunteerLimit: event.volunteerLimit ?? "" } : empty);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event]);
  const save = useAction(
    (body) => (event ? eventsApi.updateEvent(String(event.id), body) : eventsApi.createEvent(body)),
    { success: event ? "Event updated" : "Event created", invalidate: [["events"], ["event"]] },
  );
  async function submit(ev) {
    ev.preventDefault();
    const e = {};
    ["title", "description", "eventDate", "startTime", "endTime", "location"].forEach((k) => {
      if (!String(f[k] ?? "").trim()) e[k] = "Required";
    });
    if (f.startTime && f.endTime && f.endTime <= f.startTime)
      e.endTime = "End time must be after start time";
    if (f.needsVolunteers && !(Number(f.volunteerLimit) > 0))
      e.volunteerLimit = "Volunteer limit must be a positive number";
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      title: f.title,
      description: f.description,
      eventDate: f.eventDate,
      startTime: f.startTime,
      endTime: f.endTime,
      location: f.location,
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
  const input = (k, label, type = "text") => (
    <Field label={label} htmlFor={`ev-${k}`} required error={errors[k]}>
      <Input
        id={`ev-${k}`}
        type={type}
        value={f[k] ?? ""}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        aria-invalid={!!errors[k]}
      />
    </Field>
  );
  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>Fields marked * are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{input("title", "Title")}</div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="ev-description" required error={errors.description}>
              <Textarea
                id="ev-description"
                rows={3}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            </Field>
          </div>
          {input("eventDate", "Event Date", "date")}
          {input("location", "Location")}
          {input("startTime", "Start Time", "time")}
          {input("endTime", "End Time", "time")}
          <Field label="Status" htmlFor="ev-status" required>
            <select
              id="ev-status"
              className={selectClass}
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
              {input("volunteerLimit", "Volunteer Limit", "number")}
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
  const q = useEvents(status ? { status } : undefined);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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
      <div className="mb-4 w-full sm:w-56">
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
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={CalendarDays}
          title="No events available yet."
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
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <EventFormDialog open={open} onOpenChange={setOpen} event={editing} />
    </>
  );
}
