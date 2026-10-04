import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Megaphone, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import { announcementApi, eventsApi, usersApi } from "@/api";
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
import { fmtDate, fmtDateTime } from "@/lib/format";
export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => asList(await announcementApi.getAnnouncements()).items,
  });
}
export function AnnouncementCard({ a, actions }) {
  const published = a.isPublished ?? a.published ?? !!a.publishedAt;
  return (
    <article className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{a.title}</h3>
        {actions && (
          <div className="flex items-center gap-2">
            <StatusBadge status={published ? "PUBLISHED" : "DRAFT"} />
            {actions}
          </div>
        )}
      </div>
      {a.targetType && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-0.5 font-medium text-secondary-foreground">
            {a.targetType === "ALL_MEMBERS"
              ? "All Members"
              : a.targetType === "EVENT_REGISTERED_USERS"
              ? `Event: ${a.targetEvent?.title || "Registered Users"}`
              : a.targetType === "SELECTED_MEMBERS"
              ? `Selected Members (${a.recipients?.length ?? 0})`
              : a.targetType === "STUDENT_LEADERS"
              ? "Student Leaders"
              : a.targetType}
          </span>
        </div>
      )}
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
        {a.content}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        {a.createdBy?.fullName ? `By ${a.createdBy.fullName} · ` : ""}
        {actions
          ? published && a.publishedAt
            ? `Published ${fmtDateTime(a.publishedAt)}`
            : `Created ${fmtDateTime(a.createdAt)}`
          : fmtDateTime(a.publishedAt ?? a.createdAt)}
      </p>
    </article>
  );
}
export function AnnouncementsFeed() {
  const q = useAnnouncements();
  return (
    <>
      <PageHeader title="Announcements" description="News and updates from the organization." />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState icon={Megaphone} title="No announcements yet." />
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {q.data.map((a) => (
            <AnnouncementCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </>
  );
}
function AnnouncementForm({ open, onOpenChange, item }) {
  const [f, setF] = useState({
    title: "",
    content: "",
    isPublished: true,
    targetType: "ALL_MEMBERS",
    targetEventId: "",
    recipientUserIds: [],
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [errors, setErrors] = useState({});

  const eventsQ = useQuery({
    queryKey: ["events", "announcement-picker"],
    queryFn: async () => asList(await eventsApi.getEvents({ limit: 100 })).items,
    enabled: open,
  });

  const usersQ = useQuery({
    queryKey: ["users", "announcement-picker"],
    queryFn: async () => asList(await usersApi.getUsers({ limit: 100 })).items,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setF(
        item
          ? {
              title: item.title || "",
              content: item.content || "",
              isPublished: !!(item.isPublished ?? item.publishedAt),
              targetType: item.targetType || "ALL_MEMBERS",
              targetEventId: item.targetEventId || "",
              recipientUserIds: item.recipients?.map((r) => r.userId || r.user?.id) || [],
            }
          : {
              title: "",
              content: "",
              isPublished: true,
              targetType: "ALL_MEMBERS",
              targetEventId: "",
              recipientUserIds: [],
            },
      );
      setMemberSearch("");
      setErrors({});
    }
  }, [open, item]);

  const save = useAction(
    (b) =>
      item
        ? announcementApi.updateAnnouncement(String(item.id), b)
        : announcementApi.createAnnouncement(b),
    {
      success: item ? "Announcement updated" : "Announcement created",
      invalidate: [["announcements"]],
    },
  );

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = "Title is required";
    if (!f.content.trim()) er.content = "Content is required";
    if (f.targetType === "EVENT_REGISTERED_USERS" && !f.targetEventId) {
      er.targetEventId = "Please select an event";
    }
    if (
      f.targetType === "SELECTED_MEMBERS" &&
      (!f.recipientUserIds || f.recipientUserIds.length === 0)
    ) {
      er.recipientUserIds = "Please select at least one member";
    }
    setErrors(er);
    if (Object.keys(er).length) return;

    try {
      const payload = {
        title: f.title.trim(),
        content: f.content.trim(),
        isPublished: f.isPublished,
        targetType: f.targetType,
        targetEventId: f.targetType === "EVENT_REGISTERED_USERS" ? f.targetEventId : null,
        recipientUserIds: f.targetType === "SELECTED_MEMBERS" ? f.recipientUserIds : [],
      };
      await save.mutateAsync(payload);
      onOpenChange(false);
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  }

  const filteredUsers = useMemo(() => {
    const list = usersQ.data ?? [];
    if (!memberSearch.trim()) return list;
    const q = memberSearch.toLowerCase();
    return list.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studentId?.toLowerCase().includes(q),
    );
  }, [usersQ.data, memberSearch]);

  const toggleRecipient = (id) => {
    setF((prev) => {
      const exists = prev.recipientUserIds.includes(id);
      return {
        ...prev,
        recipientUserIds: exists
          ? prev.recipientUserIds.filter((x) => x !== id)
          : [...prev.recipientUserIds, id],
      };
    });
  };

  const selectedUsers = useMemo(() => {
    const all = usersQ.data ?? [];
    return all.filter((u) => f.recipientUserIds.includes(u.id));
  }, [usersQ.data, f.recipientUserIds]);

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit announcement" : "New announcement"}</DialogTitle>
          <DialogDescription>
            Configure announcement details and target audience.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Title" htmlFor="an-title" required error={errors.title}>
            <Input
              id="an-title"
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="Announcement title"
            />
          </Field>
          <Field label="Content" htmlFor="an-content" required error={errors.content}>
            <Textarea
              id="an-content"
              rows={4}
              value={f.content}
              onChange={(e) => setF({ ...f, content: e.target.value })}
              placeholder="Announcement content..."
            />
          </Field>

          {/* Audience / Target Selection */}
          <Field label="Target Audience" htmlFor="an-targetType" required>
            <select
              id="an-targetType"
              className={selectClass}
              value={f.targetType}
              onChange={(e) => setF({ ...f, targetType: e.target.value })}
            >
              <option value="ALL_MEMBERS">All Members</option>
              <option value="EVENT_REGISTERED_USERS">Event Registered Users</option>
              <option value="SELECTED_MEMBERS">Selected Members</option>
              <option value="STUDENT_LEADERS">Student Leaders</option>
            </select>
          </Field>

          {/* Conditional Target UI */}
          {f.targetType === "ALL_MEMBERS" && (
            <p className="text-xs text-muted-foreground">
              Visible to all organization members with active membership.
            </p>
          )}

          {f.targetType === "STUDENT_LEADERS" && (
            <p className="text-xs text-muted-foreground">
              Visible only to student leaders and administrators. No manual member selection required.
            </p>
          )}

          {f.targetType === "EVENT_REGISTERED_USERS" && (
            <Field label="Select Event" htmlFor="an-event" required error={errors.targetEventId}>
              <select
                id="an-event"
                className={selectClass}
                value={f.targetEventId}
                onChange={(e) => setF({ ...f, targetEventId: e.target.value })}
                disabled={eventsQ.isLoading}
              >
                <option value="">Choose an event…</option>
                {(eventsQ.data ?? []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.eventDate ? `(${fmtDate(ev.eventDate)})` : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {f.targetType === "SELECTED_MEMBERS" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Members ({f.recipientUserIds.length} selected)
                </label>
              </div>

              {/* Selected member chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/40 max-h-24 overflow-y-auto">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-xs font-medium border shadow-xs"
                    >
                      {u.fullName || u.email}
                      <button
                        type="button"
                        onClick={() => toggleRecipient(u.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${u.fullName}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Input
                  className="pl-8"
                  placeholder="Search members by name, email, or student ID..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              {/* User selection list */}
              <div className="max-h-48 overflow-y-auto rounded-md border bg-card p-1 space-y-0.5">
                {usersQ.isLoading ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">Loading members…</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">No members found.</div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = f.recipientUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => toggleRecipient(u.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleRecipient(u.id);
                          }
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors ${
                          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{u.fullName}</p>
                          <p className="text-muted-foreground">
                            {u.email} {u.studentId ? `· ${u.studentId}` : ""} {u.role ? `· ${u.role}` : ""}
                          </p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {errors.recipientUserIds && (
                <p className="text-xs text-destructive">{errors.recipientUserIds}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="an-pub"
              checked={f.isPublished}
              onCheckedChange={(v) => setF({ ...f, isPublished: v })}
            />
            <label htmlFor="an-pub" className="text-sm font-medium">
              Publish immediately
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function AnnouncementManager({ canDelete }) {
  const q = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const del = useAction((id) => announcementApi.deleteAnnouncement(id), {
    success: "Announcement deleted",
    invalidate: [["announcements"]],
  });
  return (
    <>
      <PageHeader
        title="Announcements"
        description="Publish updates for members."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Announcement
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet."
          action={<Button onClick={() => setOpen(true)}>Write the first one</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {q.data.map((a) => (
            <AnnouncementCard
              key={a.id}
              a={a}
              actions={
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${a.title}`}
                    onClick={() => {
                      setEditing(a);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${a.title}`}
                      onClick={() => setDeleting(a)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
      <AnnouncementForm open={open} onOpenChange={setOpen} item={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete announcement?"
        description={`"${deleting?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => del.mutateAsync(String(deleting.id))}
      />
    </>
  );
}
