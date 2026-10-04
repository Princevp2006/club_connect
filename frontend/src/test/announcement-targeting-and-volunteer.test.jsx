import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnnouncementCard } from "@/components/features/announcements";
import { AppShell } from "@/components/layout/AppShell";
import { volunteerApi } from "@/api";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }) => (select ? select({ location: { pathname: "/admin/dashboard" } }) : "/admin/dashboard"),
  createFileRoute: () => () => ({ component: () => null, head: () => null }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { fullName: "Test Admin", role: "ADMIN", email: "admin@test.local" },
    logout: vi.fn(),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Announcement Targeting UI", () => {
  it("AnnouncementCard displays targeting badges for each target type", () => {
    const allMembersAnn = {
      id: "ann-1",
      title: "All Members Notice",
      content: "For everyone.",
      targetType: "ALL_MEMBERS",
      isPublished: true,
    };
    const { container: c1 } = render(<AnnouncementCard a={allMembersAnn} />);
    expect(c1.textContent).toContain("All Members");

    const eventAnn = {
      id: "ann-2",
      title: "Event Update",
      content: "For attendees.",
      targetType: "EVENT_REGISTERED_USERS",
      targetEvent: { title: "Spring Hackathon" },
      isPublished: true,
    };
    const { container: c2 } = render(<AnnouncementCard a={eventAnn} />);
    expect(c2.textContent).toContain("Event: Spring Hackathon");

    const selectedAnn = {
      id: "ann-3",
      title: "Private Invitation",
      content: "For chosen ones.",
      targetType: "SELECTED_MEMBERS",
      recipients: [{ id: "r1" }, { id: "r2" }],
      isPublished: true,
    };
    const { container: c3 } = render(<AnnouncementCard a={selectedAnn} />);
    expect(c3.textContent).toContain("Selected Members (2)");

    const leadersAnn = {
      id: "ann-4",
      title: "Executive Sync",
      content: "For leaders.",
      targetType: "STUDENT_LEADERS",
      isPublished: true,
    };
    const { container: c4 } = render(<AnnouncementCard a={leadersAnn} />);
    expect(c4.textContent).toContain("Student Leaders");
  });
});

describe("Volunteer API Authorization & Endpoints", () => {
  it("volunteerApi exports getAll, getForEvent, apply, approve, and reject methods", () => {
    expect(typeof volunteerApi.getAll).toBe("function");
    expect(typeof volunteerApi.getForEvent).toBe("function");
    expect(typeof volunteerApi.apply).toBe("function");
    expect(typeof volunteerApi.approve).toBe("function");
    expect(typeof volunteerApi.reject).toBe("function");
  });
});

describe("Notification Bell Removal", () => {
  it("AppShell header does not contain notification bell button or icon", () => {
    const { container } = render(
      <AppShell>
        <div>Page Body</div>
      </AppShell>,
      { wrapper: createWrapper() }
    );

    // Verify notification bell button is not rendered
    expect(screen.queryByLabelText(/notifications/i)).toBeNull();
    // Verify no Bell SVG icon is rendered
    expect(container.querySelector("svg.lucide-bell")).toBeNull();
    // Verify user profile and nav remain intact
    expect(screen.getByText("Test Admin")).toBeDefined();
    expect(screen.getByText("Page Body")).toBeDefined();
  });
});
