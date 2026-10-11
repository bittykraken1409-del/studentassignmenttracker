import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { COLORS, type Assignment } from "@/lib/assignments";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function MonthCalendar({
  assignments,
  onSelect,
  onAddOnDate,
}: {
  assignments: Assignment[];
  onSelect: (a: Assignment) => void;
  onAddOnDate: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const start = new Date(month);
  start.setDate(1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = iso(new Date());
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="card-shadow animate-rise mt-6 rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-2 hover:bg-secondary">
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="font-display text-xl font-semibold">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-2 hover:bg-secondary">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = iso(d);
          const items = assignments.filter((a) => a.dueDate === key);
          const inMonth = d.getMonth() === month.getMonth();
          return (
            <div
              key={key}
              className={`group min-h-24 rounded-xl border p-1.5 ${inMonth ? "border-border bg-background" : "border-transparent opacity-40"}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${key === today ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {d.getDate()}
                </span>
                <button
                  onClick={() => onAddOnDate(key)}
                  aria-label={`Add on ${key}`}
                  className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-secondary group-hover:opacity-100"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="mt-1 space-y-1">
                {items.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    title={a.title}
                    className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-foreground ${a.status === "done" ? "line-through opacity-60" : ""}`}
                    style={{ backgroundColor: `${a.color ?? COLORS[4]}33`, borderLeft: `3px solid ${a.color ?? COLORS[4]}` }}
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
