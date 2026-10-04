import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  CheckCircle2,
  Loader2,
  Clock,
  CreditCard,
  ArrowRight,
  Shield,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, selectClass } from "@/components/common";
import { membershipApi } from "@/api";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/api/apiClient";
import { pageHead } from "@/lib/nav";

export const Route = createFileRoute("/subscribe")({
  head: () =>
    pageHead("Choose Membership", "Select a membership plan to activate your account."),
  component: SubscribePage,
});

const PLANS = [
  {
    type: "SEMESTER",
    label: "Semester",
    duration: "6 months",
    description: "Full access to events and activities for the academic semester.",
    price: "₹500",
  },
  {
    type: "ANNUAL",
    label: "Annual",
    duration: "1 year",
    description: "Full year access — best value for active student members.",
    price: "₹800",
    popular: true,
  },
  {
    type: "LIFETIME",
    label: "Lifetime",
    duration: "No expiry",
    description: "Permanent student membership that never expires.",
    price: "₹1,500",
  },
];

// Deterministic visual simulated QR code generator (demo only, no real payments)
function SimulatedQR({ seed }) {
  const size = 21;
  const cells = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinderTL = r < 7 && c < 7;
      const inFinderTR = r < 7 && c >= size - 7;
      const inFinderBL = r >= size - 7 && c < 7;
      const isFinder = inFinderTL || inFinderTR || inFinderBL;

      let filled;
      if (isFinder) {
        const lr = inFinderTL ? r : inFinderTR ? r : r - (size - 7);
        const lc = inFinderTL ? c : inFinderTR ? c - (size - 7) : c;
        filled =
          lr === 0 || lr === 6 || lc === 0 || lc === 6 ||
          (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
        filled = hash % 3 !== 0;
      }

      if (filled) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * 10 + 40} y={r * 10 + 40} width={10} height={10} rx={1} />
        );
      }
    }
  }
  return (
    <svg viewBox="0 0 290 290" className="h-48 w-48 sm:h-56 sm:w-56" data-testid="simulated-qr">
      <rect width="290" height="290" rx="16" fill="white" />
      <g fill="currentColor">{cells}</g>
    </svg>
  );
}

function SubscribePage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("");
  const [phase, setPhase] = useState("select"); // "select" | "confirming" | "success"
  const [countdown, setCountdown] = useState(5);
  const [busy, setBusy] = useState(false);
  const subscribedRef = useRef(false);

  // Check if unauthenticated or already holds an active membership (idempotent protection on reload)
  useEffect(() => {
    let isMounted = true;
    async function checkState() {
      if (status === "anonymous") {
        navigate({ to: "/login", replace: true });
        return;
      }
      if (status === "authenticated") {
        try {
          const mine = await membershipApi.getMine();
          const items = Array.isArray(mine) ? mine : [mine];
          const hasActive = items.some((m) => m && m.status === "ACTIVE");
          if (hasActive && isMounted) {
            toast.info("You already have an active membership.");
            navigate({ to: homeFor(user?.role), replace: true });
          }
        } catch {
          // If 404 or none found, continue to subscription flow
        }
      }
    }
    if (status !== "loading") {
      checkState();
    }
    return () => {
      isMounted = false;
    };
  }, [status, user, navigate]);

  // Handle plan change from dropdown or card
  function handleSelectType(type) {
    if (!type) {
      setSelectedType("");
      setPhase("select");
      return;
    }
    setSelectedType(type);
    subscribedRef.current = false;
    setCountdown(5);
    setPhase("confirming");
  }

  // 5-second countdown timer
  useEffect(() => {
    if (phase !== "confirming") return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Perform subscription when countdown reaches 0 or confirm clicked
  const doSubscribe = useCallback(async () => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    setBusy(true);
    try {
      await membershipApi.subscribe(selectedType);
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setPhase("success");
      toast.success("Membership activated successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
      subscribedRef.current = false;
      setPhase("select");
    } finally {
      setBusy(false);
    }
  }, [selectedType]);

  // Automatically mark subscription as successful once countdown hits 0
  useEffect(() => {
    if (phase === "confirming" && countdown === 0 && !busy) {
      doSubscribe();
    }
  }, [phase, countdown, busy, doSubscribe]);

  // Automatically redirect student to appropriate dashboard after success
  useEffect(() => {
    if (phase === "success") {
      const timer = setTimeout(() => {
        navigate({ to: homeFor(user?.role), replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, user, navigate]);

  const selectedPlan = PLANS.find((p) => p.type === selectedType);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold">Student Organization</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        {/* ── Selection Phase: Dropdown / Select ── */}
        {phase === "select" && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center">
              <CreditCard className="mx-auto h-10 w-10 text-brass" />
              <h1 className="mt-4 font-display text-3xl font-semibold">
                Choose your membership plan
              </h1>
              <p className="mt-2 text-muted-foreground">
                Welcome, {user?.fullName?.split(" ")[0]}! Select a membership type to activate your account.
              </p>
            </div>

            {/* Dropdown / Select Requirement */}
            <div className="mt-8 mx-auto max-w-md">
              <Field
                label="Membership Type"
                htmlFor="membershipType"
                required
                hint="Select SEMESTER, ANNUAL, or LIFETIME membership"
              >
                <select
                  id="membershipType"
                  name="membershipType"
                  className={selectClass}
                  value={selectedType}
                  onChange={(e) => handleSelectType(e.target.value)}
                >
                  <option value="">-- Select Membership Type --</option>
                  <option value="SEMESTER">SEMESTER</option>
                  <option value="ANNUAL">ANNUAL</option>
                  <option value="LIFETIME">LIFETIME</option>
                </select>
              </Field>
            </div>

            {/* Plan Preview Cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => {
                const isSelected = selectedType === plan.type;
                return (
                  <button
                    key={plan.type}
                    type="button"
                    onClick={() => handleSelectType(plan.type)}
                    className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card shadow-card hover:border-primary/40"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brass px-3 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
                        Most Popular
                      </span>
                    )}
                    <p className="font-display text-lg font-semibold">{plan.label}</p>
                    <p className="mt-1 text-2xl font-bold text-primary">{plan.price}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{plan.duration}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
                    <div
                      className={`mt-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              <Shield className="mr-1 inline-block h-3.5 w-3.5 text-muted-foreground" />
              This is a demo subscription confirmation flow and must not process real payments.
            </p>
          </div>
        )}

        {/* ── Confirming Phase: Simulated QR + 5s Countdown ── */}
        {phase === "confirming" && selectedPlan && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
            <h1 className="font-display text-3xl font-semibold">Simulated QR Payment</h1>
            <p className="mt-2 text-muted-foreground">
              Selected: <strong className="text-foreground">{selectedPlan.label} ({selectedPlan.type})</strong> · {selectedPlan.duration} · {selectedPlan.price}
            </p>

            {/* Simulated QR Code */}
            <div className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
              <div className="text-primary flex justify-center">
                <SimulatedQR seed={`${user?.id}-${selectedPlan.type}`} />
              </div>
            </div>

            {/* 5-second countdown timer */}
            <div className="mt-6 flex items-center justify-center gap-2.5 text-lg">
              <Clock className="h-5 w-5 text-brass animate-pulse" />
              {countdown > 0 ? (
                <span className="font-display font-semibold">
                  Confirming subscription in{" "}
                  <span className="text-2xl font-bold text-primary">{countdown}</span>s
                </span>
              ) : (
                <span className="flex items-center gap-2 font-display font-semibold text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" /> Activating membership…
                </span>
              )}
            </div>

            <p className="mt-3 max-w-md text-xs text-muted-foreground">
              Demo subscription confirmation flow. No real payments are processed.
              Your membership will automatically activate once the countdown finishes.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhase("select");
                  setSelectedType("");
                }}
                disabled={busy}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Change Plan
              </Button>
              <Button
                size="sm"
                onClick={doSubscribe}
                disabled={busy}
              >
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Confirm Now
              </Button>
            </div>
          </div>
        )}

        {/* ── Success Phase ── */}
        {phase === "success" && selectedPlan && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-success/15">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-semibold">
              Membership Activated!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your <span className="font-semibold text-foreground">{selectedPlan.label}</span>{" "}
              membership is now active. Redirecting to your dashboard…
            </p>

            <div className="mt-6 w-full max-w-sm rounded-xl border bg-card p-5 shadow-card text-left">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold">{selectedPlan.label} ({selectedPlan.type})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">{selectedPlan.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-success">Active</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-6"
              onClick={() => navigate({ to: homeFor(user?.role), replace: true })}
            >
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
