import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementsFeed } from "@/components/features/announcements";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => pageHead("Announcements", "Latest news and updates from the organization."),
  component: AnnouncementsFeed,
});
