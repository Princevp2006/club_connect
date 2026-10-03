import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { announcementApi } from "@/api";
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
import { fmtDateTime } from "@/lib/format";
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
        <div className="flex items-center gap-2">
          <StatusBadge status={published ? "PUBLISHED" : "DRAFT"} />
          {actions}
        </div>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
        {a.content}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        {a.createdBy?.fullName ? `By ${a.createdBy.fullName} · ` : ""}
        {published
          ? `Published ${fmtDateTime(a.publishedAt)}`
          : `Created ${fmtDateTime(a.createdAt)}`}
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
  const [f, setF] = useState({ title: "", content: "", isPublished: true });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setF(
        item
          ? {
              title: item.title,
              content: item.content,
              isPublished: !!(item.isPublished ?? item.publishedAt),
            }
          : { title: "", content: "", isPublished: true },
      );
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
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      await save.mutateAsync(f);
      onOpenChange(false);
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit announcement" : "New announcement"}</DialogTitle>
          <DialogDescription>Published announcements are visible to all members.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Title" htmlFor="an-title" required error={errors.title}>
            <Input
              id="an-title"
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
            />
          </Field>
          <Field label="Content" htmlFor="an-content" required error={errors.content}>
            <Textarea
              id="an-content"
              rows={5}
              value={f.content}
              onChange={(e) => setF({ ...f, content: e.target.value })}
            />
          </Field>
          <div className="flex items-center gap-3">
            <Switch
              id="an-pub"
              checked={f.isPublished}
              onCheckedChange={(v) => setF({ ...f, isPublished: v })}
            />
            <label htmlFor="an-pub" className="text-sm font-medium">
              Published
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
