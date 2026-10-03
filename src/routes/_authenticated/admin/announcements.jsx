import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementManager } from "@/components/features/announcements";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => pageHead("Manage announcements", "Create, edit and delete announcements."),
  component: () => <AnnouncementManager canDelete />,
});
