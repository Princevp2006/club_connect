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
export const Route = createFileRoute("/_authenticated/admin/merchandise")({
  head: () => pageHead("Merchandise", "Manage merchandise products and stock."),
  component: Page,
});
function ProductDialog({ open, onOpenChange, item }) {
  const [f, setF] = useState({});
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setF(
        item
          ? {
              name: item.name,
              description: item.description,
              size: item.size,
              stock: String(item.stock ?? ""),
            }
          : { name: "", description: "", size: "", stock: "" },
      );
      setErrors({});
    }
  }, [open, item]);
  const save = useAction(
    (b) =>
      item ? merchandiseApi.updateProduct(String(item.id), b) : merchandiseApi.createProduct(b),
    { success: item ? "Product updated" : "Product created", invalidate: [["merchandise"]] },
  );
  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.name?.trim()) er.name = "Name is required";
    if (!f.size?.trim()) er.size = "Size is required";
    if (!(Number.isInteger(Number(f.stock)) && Number(f.stock) >= 0) || f.stock === "")
      er.stock = "Stock must be 0 or more";
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      await save.mutateAsync({ ...f, stock: Number(f.stock) });
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
          <Field label="Size" htmlFor="p-size" required error={errors.size}>
            <Input id="p-size" value={f.size ?? ""} onChange={set("size")} />
          </Field>
          <Field label="Available Stock" htmlFor="p-stock" required error={errors.stock}>
            <Input
              id="p-stock"
              type="number"
              min={0}
              value={f.stock ?? ""}
              onChange={set("stock")}
            />
          </Field>
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
        <EmptyState icon={Shirt} title="No products yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-semibold">{p.name}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  </TableCell>
                  <TableCell>{p.size}</TableCell>
                  <TableCell className={Number(p.stock) < 5 ? "font-semibold text-warning" : ""}>
                    {p.stock}
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
              ))}
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
