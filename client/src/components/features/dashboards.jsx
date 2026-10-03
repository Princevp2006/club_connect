import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  GraduationCap,
  UserCog,
  CalendarDays,
  HandHeart,
  UserCheck,
  ScanLine,
  Shirt,
  Package,
  Megaphone,
  ClipboardList,
  Ticket,
  Plus,
  ArrowRight,
  Shield,
  UserX,
} from "lucide-react";
import { dashboardApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { countOf, fmtDate, fmtDateTime, fmtTime, humanize } from "@/lib/format";
function Greeting({ subtitle }) {
  const { user } = useAuth();
  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-crest p-6 text-sidebar-foreground sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-sidebar-accent-foreground">
        Welcome back, {user?.fullName?.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-sidebar-foreground/75">{subtitle}</p>
    </div>
  );
}
function EventList({ events }) {
  if (!events?.length)
    return <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events.</p>;
  return (
    <ul className="divide-y">
      {events.map((e) => (
        <li key={e.id}>
          <Link
            to="/events/$eventId"
            params={{ eventId: String(e.id) }}
            className="flex items-center gap-3 py-3 hover:text-primary"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent text-center leading-none text-accent-foreground">
              <span className="text-[10px] font-bold uppercase">
                {fmtDate(e.eventDate).split(" ")[1]}
              </span>
              <span className="font-display text-lg font-semibold">
                {fmtDate(e.eventDate).split(" ")[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {fmtTime(e.startTime)} · {e.location}
              </p>
            </div>
            <StatusBadge status={e.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length)
    return <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate">{r.label}</span>
            <span className="font-semibold">{r.value}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
function QuickActions({ items }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((a) => (
        <Button key={a.label} asChild variant="outline" className="h-auto flex-col gap-2 py-4">
          <Link to={a.to}>
            <a.icon className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-xs">{a.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}
export function AdminDashboard() {
  const q = useQuery({ queryKey: ["dashboard", "admin"], queryFn: dashboardApi.getAdminDashboard });
  const d = q.data ?? {};
  return (
    <>
      <Greeting subtitle="Organization overview across members, events and operations." />
      {q.isLoading ? (
        <LoadingState rows={6} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total users" value={countOf(d.totalUsers)} icon={Users} />
            <StatCard label="Students" value={countOf(d.students)} icon={GraduationCap} />
            <StatCard label="Student leaders" value={countOf(d.studentLeaders)} icon={UserCog} />
            <StatCard label="Admins" value={countOf(d.admins)} icon={Shield} />
            <StatCard label="Inactive users" value={countOf(d.inactiveUsers)} icon={UserX} />
            <StatCard
              label="Upcoming events"
              value={countOf(d.upcomingEvents)}
              icon={CalendarDays}
            />
            <StatCard
              label="Volunteer applications"
              value={countOf(d.volunteerApplications)}
              icon={HandHeart}
            />
            <StatCard
              label="Approved volunteers"
              value={countOf(d.approvedVolunteers)}
              icon={UserCheck}
            />
            <StatCard label="Check-ins" value={countOf(d.attendance)} icon={ScanLine} />
            <StatCard
              label="Merchandise stock"
              value={countOf(d.merchandiseStock)}
              icon={Shirt}
              hint={`${countOf(d.orders)} orders · ${countOf(d.announcements)} announcements`}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Upcoming events"
              className="lg:col-span-2"
              action={
                <Link to="/admin/events" className="text-xs font-semibold text-primary">
                  Manage <ArrowRight className="inline h-3 w-3" />
                </Link>
              }
            >
              <EventList
                events={
                  d.upcomingEventsList ?? (Array.isArray(d.upcomingEvents) ? d.upcomingEvents : [])
                }
              />
            </Panel>
            <Panel title="Volunteer overview">
              <Bars
                rows={(d.volunteerOverview ?? []).map((r) => ({
                  label: humanize(r.status),
                  value: r.count,
                }))}
              />
            </Panel>
            <Panel title="Attendance overview" className="lg:col-span-2">
              {(d.attendanceOverview ?? []).length ? (
                <ul className="divide-y">
                  {d.attendanceOverview.map((r) => (
                    <li
                      key={r.eventId ?? r.title}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="truncate font-medium">{r.title}</span>
                      <span className="whitespace-nowrap text-muted-foreground">
                        {r.checkedIn}/{r.registered} checked in ·{" "}
                        <strong className="text-foreground">{r.percentage ?? 0}%</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No attendance data yet.
                </p>
              )}
            </Panel>
            <Panel title="Merchandise stock">
              <Bars
                rows={(d.merchandiseOverview ?? []).map((r) => ({ label: r.name, value: r.stock }))}
              />
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
export function LeaderDashboard() {
  const q = useQuery({
    queryKey: ["dashboard", "leader"],
    queryFn: dashboardApi.getStudentLeaderDashboard,
  });
  const d = q.data ?? {};
  return (
    <>
      <Greeting subtitle="Your operational view of events, volunteers and check-ins." />
      <div className="mb-6">
        <QuickActions
          items={[
            { to: "/leader/events", label: "Create Event", icon: Plus },
            { to: "/leader/volunteers", label: "Review Volunteers", icon: HandHeart },
            { to: "/leader/tasks", label: "Assign Tasks", icon: ClipboardList },
            { to: "/leader/attendance", label: "View Attendance", icon: ScanLine },
            { to: "/leader/announcements", label: "Create Announcement", icon: Megaphone },
            { to: "/events", label: "Browse Events", icon: CalendarDays },
          ]}
        />
      </div>
      {q.isLoading ? (
        <LoadingState rows={5} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Pending applications"
              value={countOf(d.pendingVolunteerApplications)}
              icon={HandHeart}
            />
            <StatCard
              label="Approved volunteers"
              value={countOf(d.approvedVolunteers ?? d.approvedVolunteerCounts)}
              icon={UserCheck}
            />
            <StatCard
              label="Volunteer tasks"
              value={countOf(d.volunteerTasks ?? d.volunteerTaskCounts)}
              icon={ClipboardList}
            />
            <StatCard
              label="Check-ins"
              value={countOf(d.attendanceCount ?? d.eventAttendanceCounts)}
              icon={ScanLine}
            />
            <StatCard
              label="Active QR scanners"
              value={countOf(d.activeQrScanners ?? d.activeQrScannerVolunteers)}
              icon={Ticket}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Upcoming events">
              <EventList events={Array.isArray(d.upcomingEvents) ? d.upcomingEvents : []} />
            </Panel>
            <Panel title="Recent announcements">
              <AnnouncementList items={d.recentAnnouncements} />
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
function AnnouncementList({ items }) {
  if (!items?.length)
    return <p className="py-6 text-center text-sm text-muted-foreground">No announcements yet.</p>;
  return (
    <ul className="divide-y">
      {items.map((a) => (
        <li key={a.id} className="py-3">
          <p className="font-semibold">{a.title}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmtDateTime(a.publishedAt ?? a.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
export function StudentDashboard() {
  const q = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: dashboardApi.getStudentDashboard,
  });
  const d = q.data ?? {};
  const list = (v) => (Array.isArray(v) ? v : []);
  return (
    <>
      <Greeting subtitle="Here's what's coming up for you." />
      <div className="mb-6">
        <QuickActions
          items={[
            { to: "/events", label: "Browse Events", icon: CalendarDays },
            { to: "/my-tickets", label: "My Tickets", icon: Ticket },
            { to: "/events", label: "Volunteer Opportunities", icon: HandHeart },
            { to: "/my-tasks", label: "My Tasks", icon: ClipboardList },
            { to: "/merchandise", label: "Merchandise", icon: Shirt },
            { to: "/my-orders", label: "My Orders", icon: Package },
          ]}
        />
      </div>
      {q.isLoading ? (
        <LoadingState rows={5} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Upcoming events" className="lg:col-span-2">
            <EventList events={list(d.upcomingEvents)} />
          </Panel>
          <Panel
            title="My tickets"
            action={
              <Link to="/my-tickets" className="text-xs font-semibold text-primary">
                View all
              </Link>
            }
          >
            {list(d.tickets).length ? (
              <ul className="space-y-2">
                {list(d.tickets)
                  .slice(0, 4)
                  .map((t) => (
                    <li key={t.id} className="rounded-lg border border-dashed p-3">
                      <p className="truncate text-sm font-semibold">{t.event?.title}</p>
                      <p className="font-mono text-xs text-primary">{t.ticketCode}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState icon={Ticket} title="You have no event tickets." />
            )}
          </Panel>
          <Panel title="My volunteer applications">
            {list(d.volunteerApplications).length ? (
              <ul className="divide-y">
                {list(d.volunteerApplications).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{a.event?.title}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You have not applied to any volunteer opportunity.
              </p>
            )}
          </Panel>
          <Panel title="My volunteer tasks">
            {list(d.tasks).length ? (
              <ul className="divide-y">
                {list(d.tasks).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You have no assigned volunteer tasks.
              </p>
            )}
          </Panel>
          <Panel title="My orders">
            {list(d.orders).length ? (
              <ul className="divide-y">
                {list(d.orders).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate">
                      {o.product?.name} × {o.quantity}
                    </span>
                    <StatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You have not placed any merchandise orders.
              </p>
            )}
          </Panel>
          <Panel title="Recent announcements" className="lg:col-span-3">
            <AnnouncementList items={d.recentAnnouncements} />
          </Panel>
        </div>
      )}
    </>
  );
}
