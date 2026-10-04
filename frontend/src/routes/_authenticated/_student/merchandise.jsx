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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_student/merchandise")({
  head: () => pageHead("Merchandise", "Order official organization merchandise."),
  component: Page,
});

function parseSizes(p) {
  if (!p) return [];
  if (Array.isArray(p.sizes) && p.sizes.length > 0) return p.sizes;
  if (!p.size) return [];
  if (Array.isArray(p.size)) return p.size;
  return String(p.size)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function Page() {
  const q = useQuery({
    queryKey: ["merchandise", "student"],
    queryFn: async () => asList(await merchandiseApi.getProducts({ activeOnly: true })).items,
  });
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState("1");
  const [selectedSize, setSelectedSize] = useState("");
  const [err, setErr] = useState("");
  const [sizeErr, setSizeErr] = useState("");

  const order = useAction((b) => ordersApi.createOrder(b), {
    success: "Order placed. Track it in My Orders.",
    invalidate: [["merchandise"], ["orders"], ["dashboard"]],
  });

  const stock = (p) => Number(p?.stockQuantity ?? p?.stock ?? p?.availableStock ?? 0);

  // Filter client-side as well to guarantee students only see active items
  const products = (q.data ?? []).filter((p) => p.isActive !== false);

  async function submit(e) {
    e.preventDefault();
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) return setErr("Quantity must be at least 1");
    if (n > stock(product)) return setErr(`Only ${stock(product)} available`);
    setErr("");

    const availableSizes = parseSizes(product);
    if (availableSizes.length > 0 && !selectedSize) {
      return setSizeErr("Please select a size");
    }
    setSizeErr("");

    try {
      await order.mutateAsync({
        productId: String(product.id),
        quantity: n,
        size: availableSizes.length > 0 ? selectedSize : undefined,
      });
      setProduct(null);
    } catch {
      /* handled by useAction toast */
    }
  }

  const openOrderModal = (p) => {
    setProduct(p);
    setQty("1");
    setErr("");
    setSizeErr("");
    const sizes = parseSizes(p);
    setSelectedSize(sizes.length === 1 ? sizes[0] : "");
  };

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
      ) : !products.length ? (
        <EmptyState icon={Shirt} title="No merchandise available right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const availableSizes = parseSizes(p);
            return (
              <article key={p.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-card">
                <div className="mb-4 grid h-28 place-items-center rounded-lg bg-accent">
                  <Shirt className="h-10 w-10 text-accent-foreground/70" aria-hidden />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                </div>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>
                    {availableSizes.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-muted-foreground">Sizes:</span>
                        <strong className="text-foreground">{availableSizes.join(", ")}</strong>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">One size</span>
                    )}
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
                  onClick={() => openOrderModal(p)}
                >
                  {stock(p) < 1 ? "Out of stock" : "Order"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
      <Dialog open={!!product} onOpenChange={(o) => !order.isPending && !o && setProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {product?.name}</DialogTitle>
            <DialogDescription>
              {product && `${stock(product)} available in stock.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-4">
            {product && parseSizes(product).length > 0 && (
              <Field label="Select Size" required error={sizeErr}>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-2 pt-1" role="radiogroup" aria-label="Select size">
                    {parseSizes(product).map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setSelectedSize(sz);
                            setSizeErr("");
                          }}
                          className={cn(
                            "min-w-10 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground",
                          )}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && (
                    <p className="text-xs text-muted-foreground">
                      Selected size: <strong className="text-foreground">{selectedSize}</strong>
                    </p>
                  )}
                </div>
              </Field>
            )}
            <Field label="Quantity" htmlFor="qty" required error={err}>
              <Input
                id="qty"
                type="number"
                min={1}
                max={stock(product) || 999}
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
