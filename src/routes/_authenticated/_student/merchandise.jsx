import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Shirt } from "lucide-react";
import { merchandiseApi, ordersApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAction } from "@/hooks/useAction";
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/_student/merchandise")({
  head: () => pageHead("Merchandise", "Order official organization merchandise."),
  component: Page,
});
function Page() {
  const q = useQuery({
    queryKey: ["merchandise"],
    queryFn: async () => asList(await merchandiseApi.getProducts()).items,
  });
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState("1");
  const [err, setErr] = useState("");
  const order = useAction((b) => ordersApi.createOrder(b), {
    success: "Order placed. Track it in My Orders.",
    invalidate: [["merchandise"], ["orders"], ["dashboard"]],
  });
  const stock = (p) => Number(p.stock ?? p.availableStock ?? 0);
  async function submit(e) {
    e.preventDefault();
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) return setErr("Quantity must be at least 1");
    if (n > stock(product)) return setErr(`Only ${stock(product)} available`);
    setErr("");
    try {
      await order.mutateAsync({ productId: String(product.id), quantity: n });
      setProduct(null);
    } catch {
      /* toast */
    }
  }
  return (
    <>
      <PageHeader
        title="Merchandise"
        description="Reserve items and collect them from the society desk. No online payment required."
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState icon={Shirt} title="No merchandise available right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {q.data.map((p) => (
            <article key={p.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-card">
              <div className="mb-4 grid h-28 place-items-center rounded-lg bg-accent">
                <Shirt className="h-10 w-10 text-accent-foreground/70" aria-hidden />
              </div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <StatusBadge status={p.isActive === false ? "INACTIVE" : "ACTIVE"} />
              </div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>
                  Size: <strong>{p.size}</strong>
                </span>
                <span
                  className={stock(p) < 5 ? "font-semibold text-warning" : "text-muted-foreground"}
                >
                  {stock(p)} in stock
                </span>
              </div>
              <Button
                className="mt-4"
                disabled={stock(p) < 1}
                onClick={() => {
                  setProduct(p);
                  setQty("1");
                  setErr("");
                }}
              >
                {stock(p) < 1 ? "Out of stock" : "Order"}
              </Button>
            </article>
          ))}
        </div>
      )}
      <Dialog open={!!product} onOpenChange={(o) => !order.isPending && !o && setProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {product?.name}</DialogTitle>
            <DialogDescription>
              Size {product?.size} · {product && stock(product)} available
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field label="Quantity" htmlFor="qty" required error={err}>
              <Input
                id="qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProduct(null)}
                disabled={order.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={order.isPending}>
                {order.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Place order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
