import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IdCard, Loader2, Pencil, Plus } from "lucide-react";
import { membershipApi, usersApi } from "@/api";
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
const STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"];
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
              endDate: item.endDate?.slice(0, 10),
              status: item.status,
            }
          : { userId: "", membershipType: "", startDate: "", endDate: "", status: "ACTIVE" },
      );
      setErrors({});
    }
  }, [open, item]);
  const save = useAction(
    (b) => (item ? membershipApi.update(String(item.id), b) : membershipApi.create(b)),
    { success: item ? "Membership updated" : "Membership created", invalidate: [["memberships"]] },
  );
  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!item && !f.userId) er.userId = "Select a member";
    if (!f.membershipType?.trim()) er.membershipType = "Membership type is required";
    if (!f.startDate) er.startDate = "Required";
    if (!f.endDate) er.endDate = "Required";
    if (f.startDate && f.endDate && f.endDate < f.startDate)
      er.endDate = "End date must be after start date";
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      await save.mutateAsync(f);
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
                      {u.fullName} — {u.studentId ?? u.email}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <Field label="Membership Type" htmlFor="m-type" required error={errors.membershipType}>
            <Input
              id="m-type"
              list="m-types"
              value={f.membershipType ?? ""}
              onChange={set("membershipType")}
            />
            <datalist id="m-types">
              <option value="ANNUAL" />
              <option value="SEMESTER" />
              <option value="LIFETIME" />
            </datalist>
          </Field>
          <Field label="Status" htmlFor="m-status" required>
            <select
              id="m-status"
              className={selectClass}
              value={f.status ?? "ACTIVE"}
              onChange={set("status")}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Start Date" htmlFor="m-start" required error={errors.startDate}>
            <Input id="m-start" type="date" value={f.startDate ?? ""} onChange={set("startDate")} />
          </Field>
          <Field label="End Date" htmlFor="m-end" required error={errors.endDate}>
            <Input id="m-end" type="date" value={f.endDate ?? ""} onChange={set("endDate")} />
          </Field>
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
  const q = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => asList(await membershipApi.getAll()).items,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  return (
    <>
      <PageHeader
        title="Memberships"
        description="Track who holds an active membership."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Membership
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState icon={IdCard} title="No memberships yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-semibold">{m.user?.fullName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.studentId}</p>
                  </TableCell>
                  <TableCell>{humanize(m.membershipType)}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDate(m.startDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDate(m.endDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <MembershipDialog open={open} onOpenChange={setOpen} item={editing} />
    </>
  );
}
