import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Pencil, Search, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { usersApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAction } from "@/hooks/useAction";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  SimplePager,
  StatusBadge,
  fieldErrors,
  selectClass,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { fmtDate } from "@/lib/format";
import { pageHead, ROLE_LABEL } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => pageHead("User management", "Manage user roles and account status."),
  component: UsersPage,
});
const ROLES = ["ADMIN", "STUDENT_LEADER", "STUDENT"];
const LIMIT = 10;
const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Postgraduate",
  "Other",
];

function UsersPage() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const params = { search: debounced, role, isActive: active, page, limit: LIMIT };
  const q = useQuery({
    queryKey: ["users", params],
    queryFn: async () => asList(await usersApi.getUsers(params)),
    placeholderData: keepPreviousData,
  });
  const [detailId, setDetailId] = useState(null);
  const detail = useQuery({
    queryKey: ["user", detailId],
    queryFn: () => usersApi.getUser(detailId),
    enabled: !!detailId,
  });
  const [editTarget, setEditTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [confirmRole, setConfirmRole] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const changeRole = useAction(({ id, role }) => usersApi.changeRole(id, role), {
    success: "Role updated",
    invalidate: [["users"], ["user"]],
  });
  const toggle = useAction(
    (u) =>
      u.isActive ? usersApi.deactivateUser(String(u.id)) : usersApi.activateUser(String(u.id)),
    { success: "Account status updated", invalidate: [["users"], ["user"]] },
  );
  // Client-side pagination fallback when the backend returns the full list.
  const items = q.data
    ? q.data.items.length > LIMIT
      ? q.data.items.slice((page - 1) * LIMIT, page * LIMIT)
      : q.data.items
    : [];
  return (
    <>
      <PageHeader title="Users" description="Manage member roles and account access." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Search users"
            placeholder="Search name, email or student ID"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by role"
          className={`${selectClass} sm:w-48`}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className={`${selectClass} sm:w-40`}
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !items.length ? (
        <EmptyState icon={Users} title="No users match your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-semibold">{u.fullName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.studentId ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={u.role} label={ROLE_LABEL[u.role] ?? u.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Actions for ${u.fullName}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailId(String(u.id))}>
                            <Eye className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTarget(u)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={u.id === me?.id}
                            onClick={() => {
                              setRoleTarget(u);
                              setNewRole(u.role);
                            }}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" /> Change role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={u.id === me?.id}
                            onClick={() => setStatusTarget(u)}
                            className={u.isActive ? "text-destructive" : ""}
                          >
                            {u.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <SimplePager page={page} pageSize={LIMIT} total={q.data?.total ?? 0} onPage={setPage} />
        </>
      )}

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User details</SheetTitle>
            <SheetDescription>Account information from the server.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            {detail.isLoading ? (
              <LoadingState rows={3} />
            ) : detail.error ? (
              <ErrorState error={detail.error} />
            ) : (
              detail.data && (
                <dl className="divide-y text-sm">
                  {[
                    ["Full Name", detail.data.fullName],
                    ["Email", detail.data.email],
                    ["Student ID", detail.data.studentId ?? "—"],
                    ["Phone", detail.data.phone ?? "—"],
                    ["College", detail.data.collegeName ?? "—"],
                    ["Year", detail.data.year ?? "—"],
                    [
                      "Role",
                      <StatusBadge
                        key="r"
                        status={detail.data.role}
                        label={ROLE_LABEL[detail.data.role]}
                      />,
                    ],
                    [
                      "Status",
                      <StatusBadge key="s" status={detail.data.isActive ? "ACTIVE" : "INACTIVE"} />,
                    ],
                    ["Created", fmtDate(detail.data.createdAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!roleTarget && !confirmRole} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              {roleTarget?.fullName} · currently {ROLE_LABEL[roleTarget?.role]}
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="new-role" className="text-sm font-medium">
            New role
          </label>
          <select
            id="new-role"
            className={selectClass}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>
              Cancel
            </Button>
            <Button disabled={newRole === roleTarget?.role} onClick={() => setConfirmRole(true)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmRole}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmRole(false);
            setRoleTarget(null);
          }
        }}
        title="Confirm role change"
        description={`Change ${roleTarget?.fullName} from ${ROLE_LABEL[roleTarget?.role]} to ${ROLE_LABEL[newRole]}?`}
        confirmLabel="Change role"
        onConfirm={() => changeRole.mutateAsync({ id: String(roleTarget.id), role: newRole })}
      />
      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        title={statusTarget?.isActive ? "Deactivate account?" : "Activate account?"}
        description={
          statusTarget?.isActive
            ? `${statusTarget?.fullName} will no longer be able to sign in.`
            : `${statusTarget?.fullName} will be able to sign in again.`
        }
        confirmLabel={statusTarget?.isActive ? "Deactivate" : "Activate"}
        destructive={statusTarget?.isActive}
        onConfirm={() => toggle.mutateAsync(statusTarget)}
      />
      <EditStudentDialog
        user={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      />
    </>
  );
}

function EditStudentDialog({ user, open, onOpenChange }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    studentId: "",
    phone: "",
    collegeName: "",
    year: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        studentId: user.studentId || "",
        phone: user.phone || "",
        collegeName: user.collegeName || "",
        year: user.year || "",
      });
      setErrors({});
    }
  }, [user, open]);

  const updateStudent = useAction(
    (payload) => usersApi.updateUser(String(user.id), payload),
    {
      success: "Student details updated successfully",
      invalidate: [["users"], ["user"]],
    },
  );

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.fullName?.trim()) errs.fullName = "Full name is required";
    if (!form.email?.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Invalid email format";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      studentId: form.studentId?.trim() || null,
      phone: form.phone?.trim() || null,
      collegeName: form.collegeName?.trim() || null,
      year: form.year?.trim() || null,
    };

    try {
      await updateStudent.mutateAsync(payload);
      onOpenChange(false);
    } catch (err) {
      const fe = fieldErrors(err);
      if (err.message && !Object.keys(fe).length) {
        const msg = err.message.toLowerCase();
        if (msg.includes("email")) fe.email = err.message;
        else if (msg.includes("student id") || msg.includes("studentid")) {
          fe.studentId = err.message;
        } else {
          fe.general = err.message;
        }
      }
      setErrors(fe);
    }
  }

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !updateStudent.isPending && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student profile and academic details for {user?.fullName}.
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          <Field label="Full Name" htmlFor="stu-name" required error={errors.fullName}>
            <Input
              id="stu-name"
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="e.g. John Doe"
            />
          </Field>

          <Field label="Email Address" htmlFor="stu-email" required error={errors.email}>
            <Input
              id="stu-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="student@example.local"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Student ID" htmlFor="stu-id" error={errors.studentId}>
              <Input
                id="stu-id"
                value={form.studentId}
                onChange={set("studentId")}
                placeholder="STU-001"
              />
            </Field>

            <Field label="Phone" htmlFor="stu-phone" error={errors.phone}>
              <Input
                id="stu-phone"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+1-555-0000"
              />
            </Field>
          </div>

          <Field label="College / University" htmlFor="stu-college" error={errors.collegeName}>
            <Input
              id="stu-college"
              value={form.collegeName}
              onChange={set("collegeName")}
              placeholder="e.g. College of Engineering"
            />
          </Field>

          <Field label="Year" htmlFor="stu-year" error={errors.year}>
            <select
              id="stu-year"
              className={selectClass}
              value={form.year}
              onChange={set("year")}
            >
              <option value="">Select year</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateStudent.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateStudent.isPending}>
              {updateStudent.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
