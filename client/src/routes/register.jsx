import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field, fieldErrors } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/api";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/api/apiClient";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/register")({
  head: () => pageHead("Create account", "Register a new student account for your organization."),
  component: RegisterPage,
});
const FIELDS = [
  ["fullName", "Full Name", "text", "name"],
  ["email", "Email", "email", "email"],
  ["studentId", "Student ID", "text", "off"],
  ["phone", "Phone", "tel", "tel"],
  ["password", "Password", "password", "new-password"],
  ["confirmPassword", "Confirm Password", "password", "new-password"],
];
function RegisterPage() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  function validate() {
    const e = {};
    if (!form.fullName?.trim()) e.fullName = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email ?? "")) e.email = "Enter a valid email address";
    if (!form.studentId?.trim()) e.studentId = "Student ID is required";
    if (!/^[+\d][\d\s-]{6,}$/.test(form.phone ?? "")) e.phone = "Enter a valid phone number";
    if ((form.password ?? "").length < 8) e.password = "Password must be at least 8 characters";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";
    return e;
  }
  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const { confirmPassword: _c, ...body } = form;
      const res = await authApi.register(body);
      const token = res?.token ?? res?.accessToken;
      if (token) {
        const u = await completeLogin(token, res.user);
        toast.success("Account created. Welcome!");
        navigate({ to: homeFor(u.role), replace: true });
      } else {
        toast.success("Account created. Please sign in.");
        navigate({ to: "/login" });
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your student organization in under a minute."
    >
      <div className="mb-5 flex gap-2 rounded-md border border-info/25 bg-info/8 px-3 py-2 text-sm text-info">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> New accounts are registered as
        Student accounts.
      </div>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([k, label, type, ac]) => (
          <div key={k} className={k === "fullName" || k === "email" ? "sm:col-span-2" : ""}>
            <Field label={label} htmlFor={k} required error={errors[k]}>
              <Input
                id={k}
                type={type}
                autoComplete={ac}
                value={form[k] ?? ""}
                aria-invalid={!!errors[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </Field>
          </div>
        ))}
        <Button type="submit" className="sm:col-span-2" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground sm:col-span-2">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
