import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, getErrorMessage } from "@/api/apiClient";
/** Mutation wrapper with success/error toasts and query invalidation. */
export function useAction(fn, opts = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      if (opts.success)
        toast.success(typeof opts.success === "function" ? opts.success(r) : opts.success);
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
    onError: (e) => {
      if (opts.silentError) return;
      const trace = e instanceof ApiError && e.traceId ? ` (Trace ID: ${e.traceId})` : "";
      toast.error(getErrorMessage(e) + trace);
    },
  });
}
