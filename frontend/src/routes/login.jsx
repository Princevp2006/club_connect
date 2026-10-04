import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { tokenStore } from "@/api/apiClient";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/login")({
  head: () => pageHead("Sign in", "Sign in to your student organization account."),
  component: LoginPage,
});
function LoginPage() {
  const { login, completeLogin, status, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (status === "authenticated" && user) navigate({ to: homeFor(user.role), replace: true });
  }, [status, user, navigate]);
  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.fullName?.split(" ")[0] ?? ""}`);
      navigate({ to: homeFor(u.role), replace: true });
    } catch (err) {
      const e2 = err;
      const isMembershipRequired =
        e2.status === 403 &&
        (e2.errors?.code === "MEMBERSHIP_REQUIRED" ||
          e2.errors?.requiresMembership ||
          e2.message?.toLowerCase().includes("membership"));

      if (isMembershipRequired) {
        toast.info("Active membership required. Redirecting to membership plan selection…");
        if (e2.errors?.tempToken && completeLogin) {
          await completeLogin(e2.errors.tempToken, e2.errors?.user);
        } else if (e2.errors?.tempToken) {
          tokenStore.set(e2.errors.tempToken);
        }
        navigate({ to: "/subscribe" });
        return;
      }

      const msg =
        e2.status === 401
          ? "Invalid email or password."
          : e2.status === 403
            ? e2.message || "Your account is inactive. Please contact an administrator."
            : e2.message || "Server error. Please try again.";
      setFormError({ msg, trace: e2.traceId });
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout title="Sign in" subtitle="Access your organization dashboard.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {formError.msg}
            {formError.trace && (
              <span className="mt-1 block font-mono text-xs opacity-70">
                Trace ID: {formError.trace}
              </span>
            )}
          </div>
        )}
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
          />
        </Field>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() =>
              toast.info("Password reset is not available yet. Please contact an administrator.")
            }
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create a student account
          </Link>
        </p>

        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Quick-fill Demo Accounts:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@example.local");
                setPassword("Admin@123");
                setErrors({});
                setFormError(null);
              }}
              className="rounded-md border bg-card px-2.5 py-1.5 text-center font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("leader@example.local");
                setPassword("Leader@123");
                setErrors({});
                setFormError(null);
              }}
              className="rounded-md border bg-card px-2.5 py-1.5 text-center font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground"
            >
              Leader
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("student@example.local");
                setPassword("Student@123");
                setErrors({});
                setFormError(null);
              }}
              className="rounded-md border bg-card px-2.5 py-1.5 text-center font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground"
            >
              Student
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
