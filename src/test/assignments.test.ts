import { describe, expect, it } from "vitest";
import {
  daysUntilDue,
  filterAssignments,
  isOverdue,
  sortAssignments,
  type Assignment,
} from "@/lib/assignments";

const base: Assignment = {
  id: "1",
  title: "Essay",
  course: "English",
  dueDate: "2026-10-15",
  priority: "medium",
  status: "todo",
  notes: "",
  createdAt: 0,
};

const NOW = new Date(2026, 9, 11); // Oct 11, 2026 local

describe("daysUntilDue", () => {
  it("returns positive days for future dates", () => {
    expect(daysUntilDue("2026-10-15", NOW)).toBe(4);
  });
  it("returns 0 for today and negative for past dates", () => {
    expect(daysUntilDue("2026-10-11", NOW)).toBe(0);
    expect(daysUntilDue("2026-10-09", NOW)).toBe(-2);
  });
});

describe("isOverdue", () => {
  it("is overdue when past due and not done", () => {
    expect(isOverdue({ ...base, dueDate: "2026-10-09" }, NOW)).toBe(true);
  });
  it("is not overdue when done, even if past due", () => {
    expect(isOverdue({ ...base, dueDate: "2026-10-09", status: "done" }, NOW)).toBe(false);
  });
});

describe("sortAssignments", () => {
  it("sorts by due date, then priority, with done last", () => {
    const list: Assignment[] = [
      { ...base, id: "done-early", dueDate: "2026-10-01", status: "done" },
      { ...base, id: "low", dueDate: "2026-10-12", priority: "low" },
      { ...base, id: "high", dueDate: "2026-10-12", priority: "high" },
      { ...base, id: "later", dueDate: "2026-10-20", priority: "high" },
    ];
    expect(sortAssignments(list).map((a) => a.id)).toEqual([
      "high",
      "low",
      "later",
      "done-early",
    ]);
  });
});

describe("filterAssignments", () => {
  const list: Assignment[] = [
    { ...base, id: "active", dueDate: "2026-10-15" },
    { ...base, id: "overdue", dueDate: "2026-10-01" },
    { ...base, id: "done", dueDate: "2026-10-01", status: "done" },
  ];
  it("active excludes done", () => {
    expect(filterAssignments(list, "active", NOW).map((a) => a.id)).toEqual([
      "active",
      "overdue",
    ]);
  });
  it("overdue excludes done items past their due date", () => {
    expect(filterAssignments(list, "overdue", NOW).map((a) => a.id)).toEqual(["overdue"]);
  });
  it("done returns only completed", () => {
    expect(filterAssignments(list, "done", NOW).map((a) => a.id)).toEqual(["done"]);
  });
});
