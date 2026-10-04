import { GraduationCap, CalendarDays, HandHeart, ScanLine } from "lucide-react";
import { USE_MOCK_API } from "@/api/apiClient";
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-crest p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-sidebar-accent-foreground">
              Student Union
            </p>
            <p className="text-xs text-sidebar-foreground/70">Organization Portal</p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
            Est. for students, by students
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            Run your society with clarity — from first event to final check-in.
          </h2>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              [CalendarDays, "Plan events and register attendees"],
              [HandHeart, "Recruit and coordinate volunteers"],
              [ScanLine, "Verify tickets at the door"],
            ].map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-brass" aria-hidden /> {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Student Organization Management System · V1
        </p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <GraduationCap className="h-6 w-6 text-primary" aria-hidden />
            <span className="font-display text-lg font-semibold">Student Union</span>
          </div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {USE_MOCK_API && (
            <div className="mt-8 rounded-lg border border-dashed bg-accent/50 p-4 text-xs text-accent-foreground">
              <p className="font-semibold">Demo mode — sample accounts (password: password123)</p>
              <p className="mt-1 font-mono">admin@uni.edu · leader@uni.edu · student@uni.edu</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
