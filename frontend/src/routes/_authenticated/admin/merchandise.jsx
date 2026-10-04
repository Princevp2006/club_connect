import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Power, Shirt } from "lucide-react";
import { merchandiseApi } from "@/api";
import { asList } from "@/api/apiClient";
import { useAction } from "@/hooks/useAction";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  StatusBadge,
  fieldErrors,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pageHead } from "@/lib/nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/merchandise")({
  head: () => pageHead("Merchandise", "Manage merchandise products and stock."),
  component: Page,
});

const SUGGESTED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function parseSizes(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function ProductDialog({ open, onOpenChange, item }) {
  const [f, setF] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setF(
        item
          ? {
              name: item.name,
              description: item.description ?? "",
              sizes: item.sizes ?? parseSizes(item.size),
              stock: String(item.stockQuantity ?? item.stock ?? ""),
            }
          : { name: "", description: "", sizes: [], stock: "" },
      );
      setErrors({});
    }
  }, [open, item]);

  const save = useAction(
    (b) =>
      item ? merchandiseApi.updateProduct(String(item.id), b) : merchandiseApi.createProduct(b),
    { success: item ? "Product updated" : "Product created", invalidate: [["merchandise"]] },
  );

  const toggleSize = (sz) => {
    const current = f.sizes ?? [];
    const next = current.includes(sz) ? current.filter((s) => s !== sz) : [...current, sz];
    setF({ ...f, sizes: next });
  };

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.name?.trim()) er.name = "Name is required";
    if (!(Number.isInteger(Number(f.stock)) && Number(f.stock) >= 0) || f.stock === "")
      er.stock = "Stock must be 0 or more";
    setErrors(er);
    if (Object.keys(er).length) return;

    const payload = {
      name: f.name.trim(),
      description: f.description?.trim() || null,
      sizes: f.sizes ?? [],
      size: (f.sizes ?? []).length > 0 ? (f.sizes ?? []).join(", ") : null,
      stockQuantity: Number(f.stock),
    };

    try {
      await save.mutateAsync(payload);
      onOpenChange(false);
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            Products are reserved by members and collected in person.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Product Name" htmlFor="p-name" required error={errors.name}>
              <Input id="p-name" value={f.name ?? ""} onChange={set("name")} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="p-desc" error={errors.description}>
              <Textarea
                id="p-desc"
                rows={2}
                value={f.description ?? ""}
                onChange={set("description")}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Available Sizes" htmlFor="p-sizes" error={errors.sizes}>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 pt-1" id="p-sizes">
                  {SUGGESTED_SIZES.map((sz) => {
                    const selected = (f.sizes ?? []).includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground",
                        )}
                        aria-pressed={selected}
                      >
                        <span>{sz}</span>
                        {selected && <span className="ml-0.5 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select applicable sizes, or leave unselected for one-size items like caps or accessories.
                </p>
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Available Stock" htmlFor="p-stock" required error={errors.stock}>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={f.stock ?? ""}
                onChange={set("stock")}
              />
            </Field>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Page() {
  const q = useQuery({
    queryKey: ["merchandise", "admin"],
    queryFn: async () => asList(await merchandiseApi.getProducts()).items,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const toggle = useAction(
    (p) =>
      p.isActive ? merchandiseApi.deactivate(String(p.id)) : merchandiseApi.activate(String(p.id)),
    { success: "Product status updated", invalidate: [["merchandise"]] },
  );

  return (
    <>
      <PageHeader
        title="Merchandise"
        description="Manage products and available stock."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          icon={Shirt}
          title="No merchandise added yet."
          action={<Button onClick={() => setOpen(true)}>Add product</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Sizes</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((p) => {
                const sizes = p.sizes ?? parseSizes(p.size);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-semibold">{p.name}</p>
                      <p className="max-w-xs truncate text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((s) => (
                            <span
                              key={s}
                              className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">One size</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        Number(p.stockQuantity ?? p.stock) < 5 ? "font-semibold text-warning" : ""
                      }
                    >
                      {p.stockQuantity ?? p.stock}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(p);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setToggling(p)}>
                        <Power className="mr-1 h-4 w-4" /> {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <ProductDialog open={open} onOpenChange={setOpen} item={editing} />
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.isActive ? "Deactivate product?" : "Activate product?"}
        description={
          toggling?.isActive
            ? "Students will no longer see this product."
            : "Students will be able to order this product."
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        destructive={toggling?.isActive}
        onConfirm={() => toggle.mutateAsync(toggling)}
      />
    </>
  );
}
