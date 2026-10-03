import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { ordersApi } from "@/api";
import { asList } from "@/api/apiClient";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SimplePager,
  StatusBadge,
  selectClass,
} from "@/components/common";
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
export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => pageHead("Orders", "All merchandise orders."),
  component: Page,
});
const STATUSES = ["PLACED", "CONFIRMED", "READY", "COLLECTED", "CANCELLED"];
const PAGE = 10;
function Page() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => asList(await ordersApi.getAllOrders()).items,
  });
  const list = (q.data ?? []).filter((o) => !status || o.status === status);
  return (
    <>
      <PageHeader title="Orders" description="Merchandise reservations from members." />
      <div className="mb-4 w-full sm:w-56">
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !list.length ? (
        <EmptyState icon={Package} title="No orders found." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.slice((page - 1) * PAGE, page * PAGE).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="font-semibold">{o.user?.fullName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.user?.studentId}</p>
                    </TableCell>
                    <TableCell>
                      {o.product?.name}
                      {o.product?.size ? ` (${o.product.size})` : ""}
                    </TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fmtDateTime(o.createdAt ?? o.orderDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <SimplePager page={page} pageSize={PAGE} total={list.length} onPage={setPage} />
        </>
      )}
    </>
  );
}
