import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Users, UserCheck, UserX, Percent } from "lucide-react";
import { attendanceApi } from "@/api";
import { asList } from "@/api/apiClient";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from "@/components/common";
import { EventPicker } from "./events";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDateTime } from "@/lib/format";
export function AttendanceView() {
  const [eventId, setEventId] = useState("");
  const list = useQuery({
    queryKey: ["attendance", eventId],
    queryFn: async () => asList(await attendanceApi.getAttendance(eventId)).items,
    enabled: !!eventId,
  });
  const count = useQuery({
    queryKey: ["attendance-count", eventId],
    queryFn: () => attendanceApi.getCount(eventId),
    enabled: !!eventId,
  });
  const c = count.data ?? {};
  const pct = Number(
    c.percentage ??
      c.attendancePercentage ??
      (c.registered ? Math.round((c.checkedIn / c.registered) * 100) : 0),
  );
  return (
    <>
      <PageHeader
        title="Attendance"
        description="Attendance is generated automatically from ticket check-ins."
      />
      <div className="mb-5">
        <EventPicker value={eventId} onChange={setEventId} filter={(e) => e.status !== "DRAFT"} />
      </div>
      {count.error ? (
        <ErrorState error={count.error} onRetry={() => count.refetch()} />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Registered"
            value={count.isLoading ? "…" : (c.registered ?? 0)}
            icon={Users}
          />
          <StatCard
            label="Checked In"
            value={count.isLoading ? "…" : (c.checkedIn ?? 0)}
            icon={UserCheck}
          />
          <StatCard
            label="Not Checked In"
            value={
              count.isLoading
                ? "…"
                : (c.notCheckedIn ?? Math.max((c.registered ?? 0) - (c.checkedIn ?? 0), 0))
            }
            icon={UserX}
          />
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attendance
              </p>
              <Percent className="h-4 w-4 text-brass" aria-hidden />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold">
              {count.isLoading ? "…" : `${pct}%`}
            </p>
            <Progress value={pct} className="mt-2 h-2" aria-label="Attendance percentage" />
          </div>
        </div>
      )}
      {!eventId ? null : list.isLoading ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data?.length ? (
        <EmptyState
          icon={ScanLine}
          title="No check-ins yet."
          description="Scanned tickets will appear here in real time."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Scanned By</TableHead>
                <TableHead>Scanned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">
                    {r.attendee?.fullName ?? r.attendeeName ?? r.user?.fullName}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.ticket?.ticketCode ?? r.ticketCode}
                  </TableCell>
                  <TableCell>{r.scannedBy?.fullName ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDateTime(r.scannedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
