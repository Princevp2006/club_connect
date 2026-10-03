import {
  LayoutDashboard,
  Users,
  CalendarDays,
  IdCard,
  HandHeart,
  ClipboardList,
  ScanLine,
  Shirt,
  Package,
  Megaphone,
  UserCircle,
  Ticket,
} from "lucide-react";
const profile = { to: "/profile", label: "Profile", icon: UserCircle };
export const NAV = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/events", label: "Events", icon: CalendarDays },
    { to: "/admin/memberships", label: "Memberships", icon: IdCard },
    { to: "/admin/volunteers", label: "Volunteers", icon: HandHeart },
    { to: "/admin/tasks", label: "Tasks", icon: ClipboardList },
    { to: "/admin/attendance", label: "Attendance", icon: ScanLine },
    { to: "/admin/merchandise", label: "Merchandise", icon: Shirt },
    { to: "/admin/orders", label: "Orders", icon: Package },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    profile,
  ],
  STUDENT_LEADER: [
    { to: "/leader/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leader/events", label: "Events", icon: CalendarDays },
    { to: "/leader/volunteers", label: "Volunteers", icon: HandHeart },
    { to: "/leader/tasks", label: "Tasks", icon: ClipboardList },
    { to: "/leader/attendance", label: "Attendance", icon: ScanLine },
    { to: "/leader/announcements", label: "Announcements", icon: Megaphone },
    profile,
  ],
  STUDENT: [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard },
    { to: "/events", label: "Events", icon: CalendarDays },
    { to: "/my-tickets", label: "My Tickets", icon: Ticket },
    { to: "/my-volunteer-applications", label: "My Volunteer Applications", icon: HandHeart },
    { to: "/my-tasks", label: "My Tasks", icon: ClipboardList },
    { to: "/my-membership", label: "My Membership", icon: IdCard },
    { to: "/merchandise", label: "Merchandise", icon: Shirt },
    { to: "/my-orders", label: "My Orders", icon: Package },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    profile,
  ],
};
export const ROLE_LABEL = {
  ADMIN: "Administrator",
  STUDENT_LEADER: "Student Leader",
  STUDENT: "Student",
};
export function pageHead(title, description) {
  const t = `${title} · Student Organization`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
