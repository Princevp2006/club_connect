import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnnouncementCard } from "@/components/features/announcements";
import { EventsBrowser } from "@/components/features/events";
import { StudentDashboard } from "@/components/features/dashboards";
import { membershipApi, dashboardApi, eventsApi } from "@/api";
import * as AuthContext from "@/contexts/AuthContext";

// Mock router link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  createFileRoute: () => () => ({ component: () => null, head: () => null }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Task 1: Student-Facing UI Cleanup", () => {
  it("AnnouncementCard hides published-status controls from student view", () => {
    const announcement = {
      id: "ann-1",
      title: "Campus Library Update",
      content: "Extended hours during exams.",
      isPublished: true,
      publishedAt: new Date().toISOString(),
    };

    // Student view (no actions prop)
    const { container: studentView } = render(
      <AnnouncementCard a={announcement} />
    );
    expect(studentView.textContent).toContain("Campus Library Update");
    expect(studentView.textContent).not.toContain("PUBLISHED");
    expect(studentView.textContent).not.toContain("DRAFT");

    // Admin/Leader view (with actions prop)
    const { container: staffView } = render(
      <AnnouncementCard a={announcement} actions={<button>Edit</button>} />
    );
    expect(staffView.textContent).toContain("Campus Library Update");
    expect(staffView.textContent).toContain("Published");
    expect(staffView.textContent).toContain("Edit");
  });

  it("EventsBrowser hides volunteerLimit and number of volunteers needed", async () => {
    vi.spyOn(eventsApi, "getEvents").mockResolvedValueOnce([
      {
        id: "ev-1",
        title: "Hackathon 2026",
        eventDate: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        location: "Hall A",
        status: "PUBLISHED",
        needsVolunteers: true,
        volunteerLimit: 25, // Should not be displayed
      },
    ]);

    const wrapper = createWrapper();
    render(<EventsBrowser />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Hackathon 2026")).toBeDefined();
    });

    const bodyText = document.body.textContent;
    expect(bodyText).not.toContain("25");
    expect(bodyText).not.toContain("Volunteers ·");
    expect(bodyText).toContain("Volunteering Open");
  });
});

describe("Task 2: Student Dashboard Membership Card", () => {
  const mockStudent = {
    id: "student-123",
    fullName: "Jane Doe",
    email: "jane@university.edu",
    role: "STUDENT",
    studentId: "STU-JANE-01",
    collegeName: "College of Engineering",
    year: "2nd Year",
    phone: "+1-555-0199",
  };

  beforeEach(() => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: mockStudent,
      status: "authenticated",
    });

    vi.spyOn(dashboardApi, "getStudentDashboard").mockResolvedValue({
      upcomingEvents: [],
      tickets: [],
      volunteerApplications: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and displays real membership data (SEMESTER membership with dates)", async () => {
    vi.spyOn(membershipApi, "getMine").mockResolvedValueOnce([
      {
        id: "mem-1",
        userId: "student-123",
        membershipType: "SEMESTER",
        status: "ACTIVE",
        startDate: "2026-01-15T00:00:00.000Z",
        endDate: "2026-07-15T00:00:00.000Z",
      },
    ]);

    const wrapper = createWrapper();
    render(<StudentDashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Semester Membership")).toBeDefined();
    });

    const text = document.body.textContent;
    expect(text).toContain("Semester Membership");
    expect(text).toContain("Start Date:");
    expect(text).toContain("End Date:");
    expect(text).not.toContain("Account Status");
  });

  it("displays 'No Expiry' for LIFETIME membership", async () => {
    vi.spyOn(membershipApi, "getMine").mockResolvedValueOnce([
      {
        id: "mem-2",
        userId: "student-123",
        membershipType: "LIFETIME",
        status: "ACTIVE",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2126-01-01T00:00:00.000Z",
      },
    ]);

    const wrapper = createWrapper();
    render(<StudentDashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Lifetime Membership")).toBeDefined();
    });

    const text = document.body.textContent;
    expect(text).toContain("No Expiry");
  });

  it("handles a student without membership gracefully with empty state", async () => {
    vi.spyOn(membershipApi, "getMine").mockResolvedValueOnce([]);

    const wrapper = createWrapper();
    render(<StudentDashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Not Enrolled")).toBeDefined();
    });

    const text = document.body.textContent;
    expect(text).toContain("Not Enrolled");
    expect(text).toContain("You do not have an active membership.");
    expect(screen.getByText("Subscribe Now")).toBeDefined();
  });
});
