import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  CalendarDays,
  HandHeart,
  ScanLine,
  ShoppingBag,
  Megaphone,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { pageHead } from "@/lib/nav";

export const Route = createFileRoute("/")(
  {
    head: () =>
      pageHead(
        "Student Organization Management System",
        "Plan events, recruit volunteers, sell merchandise and manage your student organization — all in one place.",
      ),
    component: LandingPage,
  },
);

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Event Management",
    desc: "Create, publish, and manage events with built-in ticket registration and attendance tracking.",
  },
  {
    icon: HandHeart,
    title: "Volunteer Coordination",
    desc: "Recruit volunteers, review applications, and assign tasks with deadline tracking.",
  },
  {
    icon: ScanLine,
    title: "QR Check-In",
    desc: "Verify attendees at the door with real-time QR code scanning and live attendance dashboards.",
  },
  {
    icon: Users,
    title: "Membership Portal",
    desc: "Track memberships, subscription plans, and member status across your organization.",
  },
  {
    icon: ShoppingBag,
    title: "Merchandise Store",
    desc: "List products, manage inventory, and process orders for your organization's merchandise.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Broadcast updates, pin important notices, and keep your entire community informed.",
  },
];

const STATS = [
  { value: "100%", label: "Free & Open" },
  { value: "6+", label: "Core Modules" },
  { value: "3", label: "Role-Based Dashboards" },
  { value: "24/7", label: "Self-Hosted Access" },
];

function LandingPage() {
  const { status, user } = useAuth();
  const isLoggedIn = status === "authenticated" && user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </div>
            <span className="font-display text-lg font-semibold">Student Union</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild>
                <Link to={homeFor(user.role)}>
                  Go to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login" className="font-medium text-foreground">
                    Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register">
                    Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-crest px-5 py-24 text-sidebar-foreground sm:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">
            Built for students, by students
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-bold leading-tight text-sidebar-accent-foreground sm:text-5xl lg:text-6xl">
            Run your student organization with{" "}
            <span className="text-brass">clarity & confidence</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-sidebar-foreground/80 sm:text-lg">
            From your first event to the final check-in — manage events, volunteers, tickets,
            merchandise, and memberships all in one unified platform.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" asChild>
                <Link to={homeFor(user.role)}>
                  Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-brass font-medium text-sidebar-primary-foreground hover:bg-brass/90"
                  asChild
                >
                  <Link to="/register">
                    Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 font-medium text-white shadow-sm backdrop-blur hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link to="/login" className="text-white hover:text-white">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        {/* Decorative gradient orb */}
        <div
          className="pointer-events-none absolute -bottom-32 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brass) 0%, transparent 70%)" }}
          aria-hidden
        />
      </section>

      {/* ── Features Grid ── */}
      <section className="px-5 py-20 sm:py-28" id="features">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
              Everything you need
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Powerful tools for every aspect of your organization
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Six integrated modules that work together seamlessly — so you spend less time on admin
              and more time building community.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-brass/15 group-hover:text-brass">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y bg-muted/40 px-5 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-bold text-primary">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
              Get started in minutes
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Three simple steps
            </h2>
          </div>
          <div className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up with your student email and college details — it takes under a minute.",
              },
              {
                step: "02",
                title: "Join your organization",
                desc: "Apply for a membership plan and get approved by your student leaders.",
              },
              {
                step: "03",
                title: "Start participating",
                desc: "Register for events, volunteer, purchase merchandise and stay updated.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brass/15 font-display text-lg font-bold text-brass">
                  {step}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Highlights ── */}
      <section className="bg-crest px-5 py-20 text-sidebar-foreground sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
              Built for every role
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-sidebar-accent-foreground sm:text-4xl">
              Tailored dashboards for everyone
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                role: "Students",
                items: [
                  "Register for events & get QR tickets",
                  "Apply to volunteer for events",
                  "Track membership status",
                  "Browse & order merchandise",
                ],
              },
              {
                role: "Student Leaders",
                items: [
                  "Create & manage organization events",
                  "Approve volunteer applications",
                  "Assign tasks with deadlines",
                  "Post announcements to members",
                ],
              },
              {
                role: "Administrators",
                items: [
                  "Full system oversight & analytics",
                  "Manage users, roles & memberships",
                  "Monitor attendance & check-ins",
                  "Oversee merchandise & orders",
                ],
              },
            ].map(({ role, items }) => (
              <div
                key={role}
                className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-6 backdrop-blur"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Star className="h-4 w-4 text-brass" aria-hidden />
                  <h3 className="font-display text-lg font-semibold text-sidebar-accent-foreground">
                    {role}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-sidebar-foreground/85">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Ready to streamline your organization?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join hundreds of student organizations already using our platform. Sign up today — it's
            completely free.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" asChild>
                <Link to={homeFor(user.role)}>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login" className="font-medium text-foreground">
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold">Student Union Portal</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Student Organization Management System · V1
          </p>
        </div>
      </footer>
    </div>
  );
}
