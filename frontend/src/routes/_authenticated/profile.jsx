import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatusBadge } from "@/components/common";
import { fmtDate, humanize, initials } from "@/lib/format";
import { pageHead, ROLE_LABEL } from "@/lib/nav";
import { membershipApi } from "@/api";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => pageHead("Profile", "Your account details."),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const memQ = useQuery({
    queryKey: ["membership", "me"],
    queryFn: async () => {
      try {
        const res = await membershipApi.getMine();
        return Array.isArray(res) ? res[0] ?? null : res ?? null;
      } catch {
        return null;
      }
    },
  });

  if (!user) return null;
  const m = memQ.data;

  const rows = [
    ["Full Name", user.fullName],
    ["Email", user.email],
    ["Student ID", user.studentId || "—"],
    ["College / University", user.collegeName || "—"],
    ["Year", user.year || "—"],
    ["Phone", user.phone || "—"],
    ["Role", <StatusBadge key="r" status={user.role} label={ROLE_LABEL[user.role] ?? user.role} />],
    [
      "Membership",
      memQ.isLoading ? (
        <span key="mem-load" className="text-xs text-muted-foreground">
          Loading…
        </span>
      ) : m ? (
        <div key="mem" className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={m.status || "ACTIVE"}
            label={`${humanize(m.membershipType)} Member`}
          />
          <span className="text-xs text-muted-foreground">
            {m.membershipType === "LIFETIME" || !m.endDate
              ? "(No Expiry)"
              : `(Expires ${fmtDate(m.endDate)})`}
          </span>
        </div>
      ) : (
        <span key="no-mem" className="text-muted-foreground">
          No active membership
        </span>
      ),
    ],
    ["Member Since", fmtDate(user.createdAt)],
  ];

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your personal and academic organization details."
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
