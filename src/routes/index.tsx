import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Loader,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  daysUntilDue,
  dueLabel,
  filterAssignments,
  isOverdue,
  sortAssignments,
  type Assignment,
  type Filter,
  type Priority,
  type Status,
} from "@/lib/assignments";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyDesk — Assignment Tracker" },
      {
        name: "description",
        content:
          "Track your assignments, due dates, courses and priorities in one calm place.",
      },
      { property: "og:title", content: "StudyDesk — Assignment Tracker" },
      {
        property: "og:description",
        content:
          "Track your assignments, due dates, courses and priorities in one calm place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "studydesk-assignments-v1";

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-overdue/10 text-overdue",
  medium: "bg-warning/60 text-warning-foreground",
  low: "bg-success/40 text-success-foreground",
};

const STATUS_ICON: Record<Status, typeof Circle> = {
  todo: Circle,
  "in-progress": Loader,
  done: CheckCircle2,
};

const NEXT_STATUS: Record<Status, Status> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

function loadAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Assignment[]) : [];
  } catch {
    return [];
  }
}

interface Draft {
  title: string;
  course: string;
  dueDate: string;
  priority: Priority;
  notes: string;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  course: "",
  dueDate: "",
  priority: "medium",
  notes: "",
};

function Index() {
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [filter, setFilter] = useState<Filter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const courses = useMemo(
    () => [...new Set(assignments.map((a) => a.course).filter(Boolean))].sort(),
    [assignments],
  );

  const visible = useMemo(() => {
    let list = filterAssignments(assignments, filter);
    if (courseFilter !== "all") list = list.filter((a) => a.course === courseFilter);
    return sortAssignments(list);
  }, [assignments, filter, courseFilter]);

  const activeCount = assignments.filter((a) => a.status !== "done").length;
  const overdueCount = assignments.filter((a) => isOverdue(a)).length;
  const dueThisWeek = assignments.filter((a) => {
    const d = daysUntilDue(a.dueDate);
    return a.status !== "done" && d >= 0 && d <= 7;
  }).length;

  function openNew() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  }

  function openEdit(a: Assignment) {
    setEditingId(a.id);
    setDraft({
      title: a.title,
      course: a.course,
      dueDate: a.dueDate,
      priority: a.priority,
      notes: a.notes,
    });
    setFormOpen(true);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.dueDate) return;
    if (editingId) {
      setAssignments((list) =>
        list.map((a) => (a.id === editingId ? { ...a, ...draft, title: draft.title.trim() } : a)),
      );
    } else {
      setAssignments((list) => [
        ...list,
        {
          id: crypto.randomUUID(),
          ...draft,
          title: draft.title.trim(),
          status: "todo",
          createdAt: Date.now(),
        },
      ]);
    }
    setFormOpen(false);
  }

  function cycleStatus(id: string) {
    setAssignments((list) =>
      list.map((a) => (a.id === id ? { ...a, status: NEXT_STATUS[a.status] } : a)),
    );
  }

  function remove(id: string) {
    setAssignments((list) => list.filter((a) => a.id !== id));
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "overdue", label: "Overdue" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="paper-texture min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:pt-16">
        {/* Header */}
        <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              StudyDesk
            </p>
            <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
              My assignments
            </h1>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Plus className="size-4" /> New assignment
          </button>
        </header>

        {/* Stats */}
        <div className="animate-rise mt-8 grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
          {[
            { label: "Active", value: activeCount },
            { label: "Due this week", value: dueThisWeek },
            { label: "Overdue", value: overdueCount, danger: overdueCount > 0 },
          ].map((s) => (
            <div key={s.label} className="card-shadow rounded-2xl bg-card p-4">
              <p
                className={`font-display text-3xl font-semibold ${s.danger ? "text-overdue" : ""}`}
              >
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="animate-rise mt-8 flex flex-wrap items-center gap-2"
          style={{ animationDelay: "120ms" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
          {courses.length > 1 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="ml-auto rounded-full border border-input bg-card px-3 py-1.5 text-sm font-medium outline-none"
              aria-label="Filter by course"
            >
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* List */}
        <ul className="mt-6 space-y-3">
          {visible.map((a, i) => {
            const StatusIcon = STATUS_ICON[a.status];
            const overdue = isOverdue(a);
            return (
              <li
                key={a.id}
                className="card-shadow animate-rise group rounded-2xl bg-card p-4 sm:p-5"
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => cycleStatus(a.id)}
                    aria-label={`Mark ${a.title} as ${NEXT_STATUS[a.status]}`}
                    className={`mt-0.5 shrink-0 transition-colors ${
                      a.status === "done"
                        ? "text-success-foreground"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <StatusIcon className="size-6" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2
                        className={`font-display text-lg font-semibold ${
                          a.status === "done" ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {a.title}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[a.priority]}`}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {a.course && (
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="size-3.5" /> {a.course}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          overdue ? "text-overdue" : ""
                        }`}
                      >
                        <CalendarDays className="size-3.5" />
                        {new Date(a.dueDate + "T00:00").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {dueLabel(a)}
                      </span>
                    </div>
                    {a.notes && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {a.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(a)}
                      aria-label={`Edit ${a.title}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      aria-label={`Delete ${a.title}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {visible.length === 0 && (
          <div className="animate-rise mt-16 text-center">
            <p className="font-display text-2xl font-semibold">Nothing here yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {assignments.length === 0
                ? "Add your first assignment to get started."
                : "No assignments match this filter."}
            </p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setFormOpen(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="card-shadow animate-rise w-full max-w-md rounded-3xl bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                {editingId ? "Edit assignment" : "New assignment"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  id="title"
                  required
                  autoFocus
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Chapter 4 problem set"
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="course" className="text-sm font-medium">
                    Course
                  </label>
                  <input
                    id="course"
                    value={draft.course}
                    onChange={(e) => setDraft({ ...draft, course: e.target.value })}
                    placeholder="e.g. Biology"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Due date
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    required
                    value={draft.dueDate}
                    onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Priority</span>
                <div className="mt-1.5 flex gap-2">
                  {(["low", "medium", "high"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDraft({ ...draft, priority: p })}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        draft.priority === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95"
            >
              {editingId ? "Save changes" : "Add assignment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
