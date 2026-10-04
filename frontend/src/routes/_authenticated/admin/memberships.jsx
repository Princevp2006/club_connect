import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IdCard, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { membershipApi } from "@/api";
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
import { fmtDate, humanize } from "@/lib/format";
import { pageHead } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/admin/memberships")({
  head: () => pageHead("Memberships", "Create and manage member subscriptions."),
  component: Page,
});

const MEMBERSHIP_TYPES = ["SEMESTER", "ANNUAL", "LIFETIME"];

/** Calculate end date based on type + start date */
function calcEndDate(startDate, type) {
  if (!startDate || !type) return "";
  const rawDate = startDate.slice(0, 10);
  const d = new Date(`${rawDate}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return "";
  switch (type) {
    case "SEMESTER":
      d.setMonth(d.getMonth() + 6);
      break;
    case "ANNUAL":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "LIFETIME":
      d.setFullYear(d.getFullYear() + 100);
      break;
    default:
      return "";
  }
  return d.toISOString().slice(0, 10);
}

/** Derive display status from membership dates */
function deriveStatus(m) {
  if (m.membershipType === "LIFETIME") return "ACTIVE";
  const now = new Date();
  const end = new Date(m.endDate);
  if (m.status === "CANCELLED") return "CANCELLED";
  return end >= now ? "ACTIVE" : "EXPIRED";
}

function MembershipDialog({ open, onOpenChange, item }) {
  const [f, setF] = useState({});
  const [errors, setErrors] = useState({});
  const users = useQuery({
    queryKey: ["users", "all-for-select"],
    queryFn: async () => asList(await usersApi.getUsers({ limit: 500 })).items,
    enabled: open && !item,
  });

  useEffect(() => {
    if (open) {
      setF(
        item
          ? {
              membershipType: item.membershipType,
              startDate: item.startDate?.slice(0, 10),
            }
          : { userId: "", membershipType: "", startDate: "" },
      );
      setErrors({});
    }
  }, [open, item]);

  // Auto-calculate end date display
  const endDate = calcEndDate(f.startDate, f.membershipType);
  const isLifetime = f.membershipType === "LIFETIME";

  const save = useAction(
    (b) => (item ? membershipApi.update(String(item.id), b) : membershipApi.create(b)),
    { success: item ? "Membership updated" : "Membership created", invalidate: [["memberships"]] },
  );

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!item && !f.userId) er.userId = "Select a member";
    if (!f.membershipType) er.membershipType = "Select a membership type";
    if (!f.startDate) er.startDate = "Start date is required";
    setErrors(er);
    if (Object.keys(er).length) return;

    const toIsoDate = (dStr) => {
      if (!dStr) return dStr;
      if (dStr.includes("T")) return dStr;
      try {
        const d = new Date(`${dStr}T00:00:00.000Z`);
        return isNaN(d.getTime()) ? dStr : d.toISOString();
      } catch {
        return dStr;
      }
    };

    const payload = {
      ...f,
      startDate: toIsoDate(f.startDate),
      endDate: toIsoDate(endDate),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Update membership" : "New membership"}</DialogTitle>
          <DialogDescription>
            {item ? item.user?.fullName : "Grant a membership to a registered user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          {!item && (
            <div className="sm:col-span-2">
              <Field label="Member" htmlFor="m-user" required error={errors.userId}>
                <select
                  id="m-user"
                  className={selectClass}
                  value={f.userId ?? ""}
                  onChange={set("userId")}
                >
                  <option value="">{users.isLoading ? "Loading…" : "Select a user"}</option>
                  {(users.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} — {u.email}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <Field label="Membership Type" htmlFor="m-type" required error={errors.membershipType}>
            <select
              id="m-type"
              className={selectClass}
              value={f.membershipType ?? ""}
              onChange={set("membershipType")}
            >
              <option value="">Select type</option>
              {MEMBERSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Start Date" htmlFor="m-start" required error={errors.startDate}>
            <Input id="m-start" type="date" value={f.startDate ?? ""} onChange={set("startDate")} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="End Date" htmlFor="m-end" hint="Auto-calculated from type and start date">
              <Input
                id="m-end"
                type="date"
                value={isLifetime ? "" : endDate}
                disabled
                placeholder={isLifetime ? "No Expiry — Lifetime" : ""}
                className="bg-muted"
              />
              {isLifetime && (
                <p className="mt-1 text-xs font-medium text-success">
                  No Expiry / Lifetime
                </p>
              )}
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
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Page() {
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["memberships", search],
    queryFn: async () =>
      asList(
        await membershipApi.getAll(
          search.trim() ? { search: search.trim() } : undefined
        )
      ).items,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const deleteAction = useAction((id) => membershipApi.delete(String(id)), {
    success: "Membership deleted successfully",
    invalidate: [["memberships"]],
  });

  return (
    <>
      <PageHeader
        title="Memberships"
        description="Track who holds an active membership."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, student ID, college, type..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={IdCard}
          title={search.trim() ? "No matching memberships found." : "No memberships yet."}
          description={
            search.trim()
              ? "Try adjusting your search query."
              : "Memberships are granted when students subscribe through the registration/subscription flow."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((m) => {
                const displayStatus = deriveStatus(m);
                const isLifetime = m.membershipType === "LIFETIME";
                const isDeletable = displayStatus !== "ACTIVE";
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="font-semibold">{m.user?.fullName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                      {m.user?.studentId && (
                        <p className="text-xs text-muted-foreground/80 font-mono">
                          ID: {m.user.studentId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.user?.collegeName ?? "—"}
                    </TableCell>
                    <TableCell>{humanize(m.membershipType)}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(m.startDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {isLifetime ? (
                        <span className="text-xs font-medium text-success">No Expiry / Lifetime</span>
                      ) : (
                        fmtDate(m.endDate)
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={displayStatus} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(m);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Update
                      </Button>
                      {isDeletable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(m)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Update Membership Dialog */}
      <MembershipDialog open={open} onOpenChange={setOpen} item={editing} />

      {/* Delete Inactive/Cancelled Confirmation Dialog */}
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => !deleteAction.isPending && !o && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Membership Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{" "}
              <span className="font-semibold text-foreground">
                {deleting ? deriveStatus(deleting).toLowerCase() : ""}
              </span>{" "}
              membership record for{" "}
              <strong>{deleting?.user?.fullName ?? "this member"}</strong> ({deleting?.user?.email})?
              <br />
              <span className="mt-2 block text-xs text-muted-foreground">
                This will permanently delete the membership record. The student's user account will NOT be deleted.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deleteAction.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteAction.isPending}
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteAction.mutateAsync(deleting.id);
                  setDeleting(null);
                } catch {
                  // Error handled by useAction
                }
              }}
            >
              {deleteAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
