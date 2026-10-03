import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatusBadge } from "@/components/common";
import { fmtDate, initials } from "@/lib/format";
import { pageHead, ROLE_LABEL } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/profile")({
  head: () => pageHead("Profile", "Your account details."),
  component: ProfilePage,
});
function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const rows = [
    ["Full Name", user.fullName],
    ["Email", user.email],
    ["Student ID", user.studentId || "—"],
    ["Phone", user.phone || "—"],
    ["Role", <StatusBadge key="r" status={user.role} label={ROLE_LABEL[user.role]} />],
    [
      "Account Status",
      <StatusBadge key="s" status={user.isActive === false ? "INACTIVE" : "ACTIVE"} />,
    ],
    ["Created", fmtDate(user.createdAt)],
  ];
  return (
    <>
      <PageHeader
        title="My profile"
        description="Contact an administrator to update your role or account status."
      />
      <div className="max-w-2xl overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="flex items-center gap-4 bg-crest p-6">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sidebar-primary font-display text-xl font-semibold text-sidebar-primary-foreground">
            {initials(user.fullName)}
          </span>
          <div>
            <p className="font-display text-xl font-semibold text-sidebar-accent-foreground">
              {user.fullName}
            </p>
            <p className="text-sm text-sidebar-foreground/75">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <dl className="divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4 px-6 py-3 text-sm">
              <dt className="font-medium text-muted-foreground">{k}</dt>
              <dd className="col-span-2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
