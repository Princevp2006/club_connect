import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementManager } from "@/components/features/announcements";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/leader/announcements")({
  head: () => pageHead("Announcements", "Create and edit announcements as a student leader."),
  component: () => <AnnouncementManager canDelete={false} />,
});
