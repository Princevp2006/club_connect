import { createFileRoute } from "@tanstack/react-router";
import { TaskManager } from "@/components/features/tasks";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/admin/tasks")({
  head: () => pageHead("Volunteer tasks", "Assign and reassign volunteer tasks."),
  component: TaskManager,
});
