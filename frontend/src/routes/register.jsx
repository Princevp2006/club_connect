import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field, fieldErrors } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/api/apiClient";
import { pageHead } from "@/lib/nav";

export const Route = createFileRoute("/register")({
  head: () => pageHead("Create account", "Register a new student account for your organization."),
  component: RegisterPage,
});

const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Postgraduate",
  "Other",
];

function RegisterPage() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const e = {};
    if (!form.fullName?.trim()) e.fullName = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email ?? "")) e.email = "Enter a valid email address";
    if (!form.collegeName?.trim()) e.collegeName = "College name is required";
    if (!form.year) e.year = "Please select your year";
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
        await completeLogin(token, res.user);
        toast.success("Account created! Let's set up your membership.");
        // Redirect to membership subscription flow after registration
        navigate({ to: "/subscribe", replace: true });
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
        {/* Full Name — full width */}
        <div className="sm:col-span-2">
          <Field label="Full Name" htmlFor="fullName" required error={errors.fullName}>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName ?? ""}
              aria-invalid={!!errors.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>
        </div>

        {/* Email — full width */}
        <div className="sm:col-span-2">
          <Field label="Email" htmlFor="email" required error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email ?? ""}
              aria-invalid={!!errors.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
        </div>

        {/* College Name — full width */}
        <div className="sm:col-span-2">
          <Field label="College Name" htmlFor="collegeName" required error={errors.collegeName}>
            <Input
              id="collegeName"
              type="text"
              autoComplete="organization"
              value={form.collegeName ?? ""}
              aria-invalid={!!errors.collegeName}
              onChange={(e) => set("collegeName", e.target.value)}
            />
          </Field>
        </div>

        {/* Year — dropdown */}
        <div>
          <Field label="Year" htmlFor="year" required error={errors.year}>
            <Select value={form.year ?? ""} onValueChange={(v) => set("year", v)}>
              <SelectTrigger id="year" aria-invalid={!!errors.year}>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Student ID */}
        <div>
          <Field label="Student ID" htmlFor="studentId" required error={errors.studentId}>
            <Input
              id="studentId"
              type="text"
              autoComplete="off"
              value={form.studentId ?? ""}
              aria-invalid={!!errors.studentId}
              onChange={(e) => set("studentId", e.target.value)}
            />
          </Field>
        </div>

        {/* Phone */}
        <div className="sm:col-span-2">
          <Field label="Phone" htmlFor="phone" required error={errors.phone}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone ?? ""}
              aria-invalid={!!errors.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
        </div>

        {/* Password */}
        <div>
          <Field label="Password" htmlFor="password" required error={errors.password}>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password ?? ""}
              aria-invalid={!!errors.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>
        </div>

        {/* Confirm Password */}
        <div>
          <Field
            label="Confirm Password"
            htmlFor="confirmPassword"
            required
            error={errors.confirmPassword}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword ?? ""}
              aria-invalid={!!errors.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
          </Field>
        </div>

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
