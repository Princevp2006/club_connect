import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route as AdminMembershipsRoute } from "@/routes/_authenticated/admin/memberships";
import { Route as StudentMyMembershipRoute } from "@/routes/_authenticated/_student/my-membership";
import { EventManager } from "@/components/features/events";
import { membershipApi, eventsApi } from "@/api";
import * as AuthContext from "@/contexts/AuthContext";

// Mock router link and navigate
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: () => "/admin/memberships",
  createFileRoute: () => (config) => ({ options: config }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Admin Memberships Module", () => {
  const AdminMemberships = AdminMembershipsRoute.options.component;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { id: "admin-1", role: "ADMIN", fullName: "Admin User" },
      status: "authenticated",
    });
  });

  it("does NOT render New Membership / Add Membership button", async () => {
    vi.spyOn(membershipApi, "getAll").mockResolvedValueOnce({
      items: [],
      meta: { total: 0 },
    });

    render(<AdminMemberships />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/new membership/i)).toBeNull();
      expect(screen.queryByText(/add membership/i)).toBeNull();
    });
  });

  it("renders database-backed search input", async () => {
    vi.spyOn(membershipApi, "getAll").mockResolvedValueOnce({
      items: [],
      meta: { total: 0 },
    });

    render(<AdminMemberships />, { wrapper: createWrapper() });

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      expect(searchInput).toBeDefined();
    });
  });

  it("renders Delete button for CANCELLED or EXPIRED memberships, but NOT for ACTIVE ones", async () => {
    vi.spyOn(membershipApi, "getAll").mockResolvedValueOnce({
      items: [
        {
          id: "mem-active",
          membershipType: "ANNUAL",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          user: { fullName: "Active User", email: "active@example.com" },
        },
        {
          id: "mem-cancelled",
          membershipType: "SEMESTER",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          status: "CANCELLED",
          user: { fullName: "Cancelled User", email: "cancelled@example.com" },
        },
      ],
      meta: { total: 2 },
    });

    render(<AdminMemberships />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Active User")).toBeDefined();
      expect(screen.getByText("Cancelled User")).toBeDefined();
    });

    // Delete button must exist for the cancelled user
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBe(1);
  });
});

describe("Student My Membership Cancellation", () => {
  const StudentMyMembership = StudentMyMembershipRoute.options.component;

  it("shows Cancel Membership button when membership is ACTIVE", async () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { id: "stu-1", role: "STUDENT", fullName: "Student One" },
      status: "authenticated",
    });

    vi.spyOn(membershipApi, "getMine").mockResolvedValueOnce([
      {
        id: "mem-1",
        membershipType: "ANNUAL",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: "ACTIVE",
      },
    ]);

    render(<StudentMyMembership />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel membership/i })).toBeDefined();
    });
  });

  it("shows Membership Cancelled alert and hides Cancel button when CANCELLED", async () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { id: "stu-1", role: "STUDENT", fullName: "Student One" },
      status: "authenticated",
    });

    vi.spyOn(membershipApi, "getMine").mockResolvedValueOnce([
      {
        id: "mem-1",
        membershipType: "ANNUAL",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: "CANCELLED",
      },
    ]);

    render(<StudentMyMembership />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/membership cancelled/i)).toBeDefined();
      expect(screen.queryByRole("button", { name: /cancel membership/i })).toBeNull();
    });
  });
});

describe("Admin Events Database Search UI", () => {
  it("EventManager renders database search input alongside status filter", async () => {
    vi.spyOn(eventsApi, "getEvents").mockResolvedValueOnce({
      items: [],
      meta: { total: 0 },
    });

    render(<EventManager />, { wrapper: createWrapper() });

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search events by title, location, creator/i);
      expect(searchInput).toBeDefined();
      const statusFilter = screen.getByLabelText(/filter by status/i);
      expect(statusFilter).toBeDefined();
    });
  });
});
