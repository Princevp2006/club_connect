import { createFileRoute } from "@tanstack/react-router";
import { TaskManager } from "@/components/features/tasks";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/leader/tasks")({
  head: () => pageHead("Task assignment", "Assign tasks to approved volunteers."),
  component: TaskManager,
});
