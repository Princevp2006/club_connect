import { useState } from "react";
import { AlertTriangle, Inbox, ShieldX, RefreshCw, Loader2 } from "lucide-react";
import { ApiError } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";
export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
const TONES = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-info/12 text-info border-info/25",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
};
const STATUS_TONE = {
  PUBLISHED: "info",
  ONGOING: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  DRAFT: "neutral",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  ACTIVE: "success",
  INACTIVE: "neutral",
  EXPIRED: "neutral",
  PLACED: "info",
  CONFIRMED: "primary",
  READY: "warning",
  COLLECTED: "success",
  ASSIGNED: "neutral",
  ACCEPTED: "info",
  IN_PROGRESS: "warning",
  ADMIN: "primary",
  STUDENT_LEADER: "info",
  STUDENT: "neutral",
  QR_SCANNER: "primary",
};
export function StatusBadge({ status, label, tone }) {
  const t = tone ?? STATUS_TONE[status ?? ""] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONES[t],
      )}
    >
      {label ?? humanize(status)}
    </span>
  );
}
export function LoadingState({ rows = 4, label = "Loading" }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-accent p-3 text-accent-foreground">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ error, onRetry }) {
  const e = error instanceof ApiError ? error : null;
  if (e?.status === 403) return <ForbiddenState message={e.message} />;
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center"
    >
      <AlertTriangle className="mb-3 h-7 w-7 text-destructive" aria-hidden />
      <p className="font-display text-lg font-semibold">
        {e?.status === 404
          ? "Not found"
          : e && e.status >= 500
            ? "Server error"
            : "Couldn't load this page"}
      </p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {error?.message ?? "Unexpected error"}
      </p>
      {e?.traceId && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Trace ID: {e.traceId}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}
export function ForbiddenState({ message = "You do not have permission to view this page." }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center shadow-card"
    >
      <ShieldX className="mb-3 h-8 w-8 text-destructive" aria-hidden />
      <p className="font-display text-xl font-semibold">Access restricted</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
export function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-brass" aria-hidden />}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
export function Field({ label, htmlFor, required, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}{" "}
        {required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
/** Maps backend 422 field errors to a flat record of strings. */
export function fieldErrors(e) {
  if (!(e instanceof ApiError)) return {};
  return Object.fromEntries(
    Object.entries(e.errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
  );
}
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            onClick={async (ev) => {
              ev.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } catch {
                /* caller shows toast */
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function SimplePager({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
export function Panel({ title, action, children, className }) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
export const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
