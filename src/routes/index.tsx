import { createFileRoute } from "@tanstack/react-router";
import { MonthCalendar } from "@/components/MonthCalendar";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
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
  COLORS,
  STATUS_LABEL,
  TASK_TYPES,
  formatDuration,
  timeLeftLabel,
  type TaskType,
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
const THEME_KEY = "studydesk-theme-v1";

const THEMES: { id: string; label: string; swatch: string }[] = [
  { id: "paper", label: "Paper", swatch: "#b5875a" },
  { id: "ocean", label: "Ocean", swatch: "#3b6fd4" },
  { id: "forest", label: "Forest", swatch: "#3d7a52" },
  { id: "berry", label: "Berry", swatch: "#c2497a" },
  { id: "grape", label: "Grape", swatch: "#8a5cc9" },
  { id: "sunset", label: "Sunset", swatch: "#e0693a" },
  { id: "rose", label: "Rose", swatch: "#d9536a" },
  { id: "teal", label: "Teal", swatch: "#2a9d9d" },
  { id: "midnight", label: "Midnight", swatch: "#5b6ee1" },
  { id: "charcoal", label: "Charcoal", swatch: "#e8c15a" },
  { id: "lavender", label: "Lavender", swatch: "#9a7bd8" },
  { id: "mint", label: "Mint", swatch: "#3aa87c" },
  { id: "slate", label: "Slate", swatch: "#64748b" },
];

function loadTheme(): string {
  try {
    return localStorage.getItem(THEME_KEY) ?? "paper";
  } catch {
    return "paper";
  }
}

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
  type: TaskType;
  estimatedMinutes: number;
  color: string;
  dueTime: string;
  status: Status;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  course: "",
  dueDate: "",
  priority: "medium",
  notes: "",
  type: "assignment",
  estimatedMinutes: 60,
  color: COLORS[4]!,
  dueTime: "23:59",
  status: "todo",
};

function Index() {
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [filter, setFilter] = useState<Filter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [theme, setTheme] = useState<string>(loadTheme);
  useEffect(() => {
    if (theme === "paper") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  function setStatus(id: string, status: Status) {
    setAssignments((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  }

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

  const totalCount = assignments.length;
  const doneCount = assignments.filter((a) => a.status === "done").length;
  const activeCount = totalCount - doneCount;
  const overdueCount = assignments.filter((a) => isOverdue(a)).length;
  const dueThisWeek = assignments.filter((a) => {
    const d = daysUntilDue(a.dueDate);
    return a.status !== "done" && d >= 0 && d <= 7;
  }).length;

  function openNew(date?: string) {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT, dueDate: date ?? "" });
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
      type: a.type ?? "assignment",
      estimatedMinutes: a.estimatedMinutes ?? 0,
      color: a.color ?? COLORS[4]!,
      dueTime: a.dueTime ?? "23:59",
      status: a.status,
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
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:pt-16">
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
            onClick={() => openNew()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Plus className="size-4" /> New assignment
          </button>
        </header>

        {/* Stats */}
        <div className="animate-rise mt-8 grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
          {[
            { label: "Total assignments", value: totalCount },
            { label: "Incomplete", value: activeCount },
            { label: "Complete", value: doneCount },
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

        {/* App colour theme picker */}
        <div
          className="animate-rise card-shadow mt-8 rounded-2xl bg-card p-4"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            App colour
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-label={`${t.label} theme`}
                title={t.label}
                className={`size-9 rounded-full transition-transform hover:scale-110 ${
                  theme === t.id ? "ring-2 ring-ring ring-offset-2 ring-offset-card" : ""
                }`}
                style={{ backgroundColor: t.swatch }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {THEMES.find((t) => t.id === theme)?.label} theme
          </p>
        </div>

        <div className="mt-8 inline-flex rounded-full bg-secondary p-1">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? "bg-card text-foreground card-shadow" : "text-muted-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {view === "calendar" && (
          <MonthCalendar
            assignments={assignments}
            onSelect={openEdit}
            onAddOnDate={(d) => openNew(d)}
          />
        )}

        {view === "list" && (<>
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
                className="card-shadow animate-rise group rounded-2xl border-l-[6px] bg-card p-4 sm:p-5"
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms`, borderLeftColor: a.color ?? COLORS[4] }}
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
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {TASK_TYPES.find((t) => t.value === (a.type ?? "assignment"))?.label}
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
                        {a.dueTime && a.dueTime !== "23:59" ? `${a.dueTime} · ` : ""}
                        {a.status === "done" ? dueLabel(a) : timeLeftLabel(a)}
                      </span>
                      {!!a.estimatedMinutes && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" /> ~{formatDuration(a.estimatedMinutes)}
                        </span>
                      )}
                      <select
                        value={a.status}
                        onChange={(e) => setStatus(a.id, e.target.value as Status)}
                        aria-label="Status"
                        className="rounded-full border border-input bg-background px-2 py-0.5 text-xs font-medium text-foreground outline-none"
                      >
                        {(Object.keys(STATUS_LABEL) as Status[]).map((st) => (
                          <option key={st} value={st}>{STATUS_LABEL[st]}</option>
                        ))}
                      </select>
                    </div>
                    {a.notes && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {a.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
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
        </>)}
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
            className="card-shadow animate-rise w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-card p-6"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dueTime" className="text-sm font-medium">Due time</label>
                  <input id="dueTime" type="time" value={draft.dueTime}
                    onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label htmlFor="type" className="text-sm font-medium">Type of task</label>
                  <select id="type" value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as TaskType })}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                    {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Estimated time</label>
                  <div className="mt-1.5 flex gap-2">
                    <input aria-label="Hours" type="number" min={0} value={Math.floor(draft.estimatedMinutes / 60)}
                      onChange={(e) => setDraft({ ...draft, estimatedMinutes: Math.max(0, Number(e.target.value) || 0) * 60 + (draft.estimatedMinutes % 60) })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none" />
                    <span className="self-center text-xs text-muted-foreground">h</span>
                    <input aria-label="Minutes" type="number" min={0} max={59} step={5} value={draft.estimatedMinutes % 60}
                      onChange={(e) => setDraft({ ...draft, estimatedMinutes: Math.floor(draft.estimatedMinutes / 60) * 60 + Math.min(59, Math.max(0, Number(e.target.value) || 0)) })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none" />
                    <span className="self-center text-xs text-muted-foreground">m</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <select id="status" value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                    {(Object.keys(STATUS_LABEL) as Status[]).map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Colour</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" aria-label={`Colour ${c}`}
                      onClick={() => setDraft({ ...draft, color: c })}
                      className={`size-8 rounded-full transition-transform ${draft.color === c ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-card" : ""}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" aria-label="Custom colour" value={draft.color}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    className="size-8 cursor-pointer rounded-full border border-input bg-transparent" />
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
