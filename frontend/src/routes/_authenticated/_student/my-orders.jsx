import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { ordersApi } from "@/api";
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
export const Route = createFileRoute("/_authenticated/_student/my-orders")({
  head: () => pageHead("My orders", "Track your merchandise orders."),
  component: Page,
});
function Page() {
  const q = useQuery({
    queryKey: ["orders", "me"],
    queryFn: async () => asList(await ordersApi.getMyOrders()).items,
  });
  return (
    <>
      <PageHeader title="My orders" />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={Package}
          title="You have not placed any merchandise orders."
          action={
            <Button asChild>
              <Link to="/merchandise">Browse merchandise</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-semibold">
                    <span>{o.product?.name}</span>
                    {o.size ? (
                      <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Size: {o.size}
                      </span>
                    ) : o.product?.size ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">({o.product.size})</span>
                    ) : null}
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
      )}
    </>
  );
}
