import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HandHeart } from "lucide-react";
import { volunteerApi } from "@/api";
import { asList } from "@/api/apiClient";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDateTime } from "@/lib/format";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/_student/my-volunteer-applications")({
  head: () =>
    pageHead("My volunteer applications", "Track the status of your volunteer applications."),
  component: Page,
});
function Page() {
  const q = useQuery({
    queryKey: ["applications", "me"],
    queryFn: async () => asList(await volunteerApi.getMine()).items,
  });
  return (
    <>
      <PageHeader
        title="My volunteer applications"
        description="Apply from any event that needs volunteers."
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={HandHeart}
          title="You have not applied to any volunteer opportunity."
          action={
            <Button asChild>
              <Link to="/events">Find opportunities</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Application Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.event?.title}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fmtDateTime(a.appliedAt ?? a.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDateTime(a.reviewedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
