import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Package, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = {
    search: debounced,
    status: status || undefined,
    page,
    limit: PAGE,
  };

  const q = useQuery({
    queryKey: ["orders", params],
    queryFn: async () => asList(await ordersApi.getAllOrders(params)),
    placeholderData: keepPreviousData,
  });

  const rawItems = q.data?.items ?? [];
  const total = q.data?.total ?? 0;

  // Fallback slice in case mock or unpaginated array is returned
  const items =
    rawItems.length > PAGE && total === rawItems.length
      ? rawItems.slice((page - 1) * PAGE, page * PAGE)
      : rawItems;

  return (
    <>
      <PageHeader title="Orders" description="Merchandise reservations from members." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Search orders"
            placeholder="Search order ID, student, email or product"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by status"
          className={`${selectClass} sm:w-56`}
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
      ) : !items.length ? (
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
                {items.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="font-semibold">{o.user?.fullName ?? "—"}</p>
                      {o.user?.email && (
                        <p className="text-xs text-muted-foreground">{o.user.email}</p>
                      )}
                      {o.user?.studentId && (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {o.user.studentId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{o.product?.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        ID: {o.id ? o.id.slice(0, 8) : "—"}
                      </p>
                      {o.size ? (
                        <p className="text-xs font-medium text-primary">Size: {o.size}</p>
                      ) : o.product?.size ? (
                        <p className="text-xs text-muted-foreground">Size: {o.product.size}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fmtDateTime(o.orderedAt ?? o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <SimplePager page={page} pageSize={PAGE} total={total} onPage={setPage} />
        </>
      )}
    </>
  );
}
