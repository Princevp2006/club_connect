import { createFileRoute } from "@tanstack/react-router";
import { AttendanceView } from "@/components/features/attendance";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/attendance")({
  head: () => pageHead("Attendance", "Event attendance from ticket check-ins."),
  component: AttendanceView,
});
