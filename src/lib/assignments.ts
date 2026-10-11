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
  type?: TaskType;
  estimatedMinutes?: number;
  color?: string;
  dueTime?: string; // HH:mm, defaults to 23:59
}

export type TaskType = "assignment" | "essay" | "project" | "exam" | "quiz" | "reading" | "lab" | "other";
export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "assignment", label: "Assignment" },
  { value: "essay", label: "Essay" },
  { value: "project", label: "Project" },
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "reading", label: "Reading" },
  { value: "lab", label: "Lab" },
  { value: "other", label: "Other" },
];

export const STATUS_LABEL: Record<Status, string> = {
  todo: "Not started",
  "in-progress": "In progress",
  done: "Completed",
};

export const COLORS = ["#e76f51", "#f4a261", "#e9c46a", "#2a9d8f", "#4c8bf5", "#8e6cd8", "#d6609b", "#6b7280"];

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
}

/** Precise time left until due (date + optional time, default end of day). */
export function timeLeftLabel(a: Assignment, now: Date = new Date()): string {
  if (a.status === "done") return "Completed";
  const [y = 0, mo = 1, d = 1] = a.dueDate.split("-").map(Number);
  const [hh = 23, mm = 59] = (a.dueTime || "23:59").split(":").map(Number);
  const diff = new Date(y, mo - 1, d, hh, mm).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);
  const txt = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return diff < 0 ? `${txt} overdue` : `${txt} left`;
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
