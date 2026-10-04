import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { NAV } from "@/lib/nav";

describe("Events Canonical Navigation & History", () => {
  it("NAV configuration has canonical /events route for all roles", () => {
    const adminEventsItem = NAV.ADMIN.find((i) => i.label === "Events");
    expect(adminEventsItem).toBeDefined();
    expect(adminEventsItem.to).toBe("/events");

    const leaderEventsItem = NAV.STUDENT_LEADER.find((i) => i.label === "Events");
    expect(leaderEventsItem).toBeDefined();
    expect(leaderEventsItem.to).toBe("/events");

    const studentEventsItem = NAV.STUDENT.find((i) => i.label === "Events");
    expect(studentEventsItem).toBeDefined();
    expect(studentEventsItem.to).toBe("/events");
  });

  it("navigating from /events to event details and browser back/forward works correctly", async () => {
    const history = createMemoryHistory({ initialEntries: ["/events"] });
    const queryClient = new QueryClient();
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history,
    });
    await router.load();

    expect(router.state.location.pathname).toBe("/events");

    // Navigate to event details
    await router.navigate({ to: "/events/$eventId", params: { eventId: "test-event-uuid" } });
    expect(router.state.location.pathname).toBe("/events/test-event-uuid");

    // Browser Back
    history.back();
    await router.load();
    expect(router.state.location.pathname).toBe("/events");

    // Browser Forward
    history.forward();
    await router.load();
    expect(router.state.location.pathname).toBe("/events/test-event-uuid");

    // Browser Back again to events
    history.back();
    await router.load();
    expect(router.state.location.pathname).toBe("/events");
  });

  it("/admin/events redirects to canonical /events", async () => {
    const history = createMemoryHistory({ initialEntries: ["/admin/events"] });
    const queryClient = new QueryClient();
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history,
    });
    await router.load();

    expect(router.state.location.pathname).toBe("/events");
  });

  it("/leader/events redirects to canonical /events", async () => {
    const history = createMemoryHistory({ initialEntries: ["/leader/events"] });
    const queryClient = new QueryClient();
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history,
    });
    await router.load();

    expect(router.state.location.pathname).toBe("/events");
  });
});
