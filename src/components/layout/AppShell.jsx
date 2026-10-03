import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, GraduationCap, LogOut, Menu, UserCircle, FlaskConical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NAV, ROLE_LABEL } from "@/lib/nav";
import { initials } from "@/lib/format";
import { USE_MOCK_API } from "@/api/apiClient";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
function SidebarNav({ onNavigate }) {
  const { user } = useAuth();
  const items = NAV[user?.role ?? "STUDENT"] ?? [];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col bg-crest text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="h-5 w-5" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-semibold text-sidebar-accent-foreground">
            Student Union
          </p>
          <p className="text-xs text-sidebar-foreground/70">Organization Portal</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((it) => {
          const active =
            pathname === it.to || (it.to !== "/app" && pathname.startsWith(it.to + "/"));
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <it.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/60">
        V1 · {ROLE_LABEL[user?.role ?? ""]}
      </div>
    </div>
  );
}
export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV[user?.role ?? "STUDENT"] ?? [];
  const current = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) => pathname === i.to || pathname.startsWith(i.to + "/"));
  const title = pathname.includes("/scanner")
    ? "Ticket Scanner"
    : (current?.label ?? (pathname.startsWith("/events") ? "Events" : "Portal"));
  const bottom = items.slice(0, 4);
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
          <SidebarNav />
        </aside>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-72 border-0 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="lg:pl-64">
          {USE_MOCK_API && (
            <div className="flex items-center justify-center gap-2 bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo mode — showing sample data,
              not connected to the live server.
            </div>
          )}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <p className="truncate font-display text-lg font-semibold">{title}</p>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications (coming soon)"
                    aria-disabled
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications coming soon</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials(user?.fullName)}
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-semibold">{user?.fullName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {ROLE_LABEL[user?.role ?? ""]}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-semibold">{user?.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserCircle className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void logout()}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">
            {children}
          </main>
        </div>

        <nav
          aria-label="Quick"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card lg:hidden"
        >
          {bottom.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
              activeOptions={{ exact: it.to === "/app" }}
            >
              <it.icon className="h-5 w-5" aria-hidden />
              <span className="max-w-full truncate px-1">{it.label.replace("My ", "")}</span>
            </Link>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
          >
            <Menu className="h-5 w-5" aria-hidden /> More
          </button>
        </nav>
      </div>
    </TooltipProvider>
  );
}
