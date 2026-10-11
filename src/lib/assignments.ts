export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in-progress" | "done";

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string; // ISO date yyyy-mm-dd
  priority: Priority;
  status: Status;
  notes: string;
  createdAt: number;
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Days from today until due (negative = overdue). Uses local calendar days. */
export function daysUntilDue(dueDate: string, now: Date = new Date()): number {
  const [y = 0, m = 1, d = 1] = dueDate.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(a: Assignment, now: Date = new Date()): boolean {
  return a.status !== "done" && daysUntilDue(a.dueDate, now) < 0;
}

/** Sort: incomplete first (by due date, then priority), done last. */
export function sortAssignments(list: Assignment[]): Assignment[] {
  return [...list].sort((a, b) => {
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

export type Filter = "all" | "active" | "done" | "overdue";

export function filterAssignments(
  list: Assignment[],
  filter: Filter,
  now: Date = new Date(),
): Assignment[] {
  switch (filter) {
    case "active":
      return list.filter((a) => a.status !== "done");
    case "done":
      return list.filter((a) => a.status === "done");
    case "overdue":
      return list.filter((a) => isOverdue(a, now));
    default:
      return list;
  }
}

export function dueLabel(a: Assignment, now: Date = new Date()): string {
  const days = daysUntilDue(a.dueDate, now);
  if (a.status === "done") return "Completed";
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
