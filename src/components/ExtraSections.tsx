import { useEffect, useState, type FormEvent } from "react";

function useStored<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setVal(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(val));
  }, [key, val, ready]);
  return [val, setVal] as const;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn =
  "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90";
const card = "rounded-2xl border border-border bg-card p-5 card-shadow";
const del = "text-xs text-muted-foreground hover:text-destructive";

/* ---------------- Notes & links ---------------- */
type Note = { id: string; title: string; course: string; url: string; text: string };

export function NotesSection() {
  const [notes, setNotes] = useStored<Note[]>("study.notes", []);
  const [d, setD] = useState({ title: "", course: "", url: "", text: "" });
  const [q, setQ] = useState("");
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!d.title.trim()) return;
    let url = d.url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    setNotes([{ id: uid(), ...d, url }, ...notes]);
    setD({ title: "", course: "", url: "", text: "" });
  };
  const shown = notes.filter((n) =>
    (n.title + n.course + n.text).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={add} className={`${card} grid gap-3 sm:grid-cols-2`}>
        <input className={input} placeholder="Title (e.g. Lecture 4 slides)" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <input className={input} placeholder="Course" value={d.course} onChange={(e) => setD({ ...d, course: e.target.value })} />
        <input className={`${input} sm:col-span-2`} placeholder="Link to file or notes (Google Drive, OneDrive, Notion...)" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} />
        <textarea className={`${input} sm:col-span-2`} rows={3} placeholder="Your notes" value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} />
        <button className={`${btn} sm:col-span-2 justify-self-start`}>Save note</button>
      </form>
      <input className={input} placeholder="Search notes..." value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {shown.map((n) => (
          <div key={n.id} className={card}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                {n.course && <p className="text-xs text-muted-foreground">{n.course}</p>}
              </div>
              <button className={del} onClick={() => setNotes(notes.filter((x) => x.id !== n.id))}>Delete</button>
            </div>
            {n.url && (
              <a href={n.url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm text-primary underline">
                {n.url}
              </a>
            )}
            {n.text && <p className="mt-2 whitespace-pre-wrap text-sm">{n.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Important dates ---------------- */
type Event = { id: string; title: string; date: string; time: string; note: string };

export function DatesSection() {
  const [events, setEvents] = useStored<Event[]>("study.events", []);
  const [d, setD] = useState({ title: "", date: "", time: "", note: "" });
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!d.title.trim() || !d.date) return;
    setEvents([...events, { id: uid(), ...d }]);
    setD({ title: "", date: "", time: "", note: "" });
  };
  const sorted = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={add} className={`${card} grid gap-3 sm:grid-cols-3`}>
        <input className={`${input} sm:col-span-3`} placeholder="What's happening? (e.g. Midterm, Club meeting)" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <input type="date" className={input} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        <input type="time" className={input} value={d.time} onChange={(e) => setD({ ...d, time: e.target.value })} />
        <input className={input} placeholder="Location / note" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
        <button className={`${btn} justify-self-start`}>Add date</button>
      </form>
      {sorted.length === 0 && <p className="text-sm text-muted-foreground">No important dates yet.</p>}
      <div className="space-y-2">
        {sorted.map((ev) => {
          const past = ev.date < today;
          const when = new Date(`${ev.date}T${ev.time || "00:00"}`);
          return (
            <div key={ev.id} className={`${card} flex items-center gap-4 ${past ? "opacity-50" : ""}`}>
              <div className="w-14 text-center">
                <div className="text-xs uppercase text-muted-foreground">{when.toLocaleDateString(undefined, { month: "short" })}</div>
                <div className="text-2xl font-semibold">{when.getDate()}</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{ev.title}</div>
                <div className="text-xs text-muted-foreground">
                  {when.toLocaleDateString(undefined, { weekday: "long" })}
                  {ev.time && ` · ${when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
                  {ev.note && ` · ${ev.note}`}
                </div>
              </div>
              <button className={del} onClick={() => setEvents(events.filter((x) => x.id !== ev.id))}>Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Flashcards & study ---------------- */
type Card = { id: string; front: string; back: string; known: boolean };
type Deck = { id: string; name: string; cards: Card[] };

export function StudySection() {
  const [decks, setDecks] = useStored<Deck[]>("study.decks", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulk, setBulk] = useState("");
  const [studying, setStudying] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Pomodoro
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (secs === 0) setRunning(false);
  }, [secs]);

  const deck = decks.find((x) => x.id === activeId);
  const updateDeck = (fn: (d: Deck) => Deck) =>
    setDecks(decks.map((x) => (x.id === activeId ? fn(x) : x)));

  const addCards = (e: FormEvent) => {
    e.preventDefault();
    const fromBulk = bulk
      .split("\n")
      .map((l) => l.split(/\s+-\s+|\t|:\s/))
      .filter((p) => p.length >= 2 && p[0].trim())
      .map((p) => ({ id: uid(), front: p[0].trim(), back: p.slice(1).join(" - ").trim(), known: false }));
    const single = front.trim() && back.trim() ? [{ id: uid(), front, back, known: false }] : [];
    if (!fromBulk.length && !single.length) return;
    updateDeck((d) => ({ ...d, cards: [...d.cards, ...single, ...fromBulk] }));
    setFront(""); setBack(""); setBulk("");
  };

  const start = (onlyUnknown: boolean) => {
    if (!deck) return;
    const ids = deck.cards.filter((c) => !onlyUnknown || !c.known).map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    if (!ids.length) return;
    setOrder(ids); setIdx(0); setFlipped(false); setStudying(true);
  };

  const mark = (known: boolean) => {
    const id = order[idx];
    updateDeck((d) => ({ ...d, cards: d.cards.map((c) => (c.id === id ? { ...c, known } : c)) }));
    if (idx + 1 >= order.length) setStudying(false);
    else { setIdx(idx + 1); setFlipped(false); }
  };

  const timer = (
    <div className={`${card} flex flex-wrap items-center gap-3`}>
      <div>
        <div className="text-xs text-muted-foreground">Focus timer</div>
        <div className="text-3xl font-semibold tabular-nums">
          {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        {[25, 15, 5].map((m) => (
          <button key={m} className="rounded-full bg-secondary px-3 py-1.5 text-sm" onClick={() => { setSecs(m * 60); setRunning(false); }}>{m}m</button>
        ))}
        <button className={btn} onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</button>
      </div>
    </div>
  );

  if (deck && studying) {
    const c = deck.cards.find((x) => x.id === order[idx]);
    return (
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{deck.name} · card {idx + 1} of {order.length}</span>
          <button onClick={() => setStudying(false)}>Exit</button>
        </div>
        <button onClick={() => setFlipped(!flipped)} className={`${card} flex min-h-[220px] w-full items-center justify-center text-center text-xl font-medium`}>
          <div>
            <div className="mb-2 text-xs uppercase text-muted-foreground">{flipped ? "Answer" : "Question"} · tap to flip</div>
            <div className="whitespace-pre-wrap">{flipped ? c?.back : c?.front}</div>
          </div>
        </button>
        <div className="flex justify-center gap-3">
          <button className="rounded-full bg-secondary px-5 py-2 text-sm font-medium" onClick={() => mark(false)}>Still learning</button>
          <button className={btn} onClick={() => mark(true)}>I know it</button>
        </div>
        {timer}
      </div>
    );
  }

  if (deck) {
    const known = deck.cards.filter((c) => c.known).length;
    return (
      <div className="mt-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button className="text-sm text-muted-foreground" onClick={() => setActiveId(null)}>← All decks</button>
          <h2 className="text-xl font-semibold">{deck.name}</h2>
          <span className="text-sm text-muted-foreground">{known}/{deck.cards.length} known</span>
          <div className="ml-auto flex gap-2">
            <button className={btn} onClick={() => start(false)}>Study all</button>
            <button className="rounded-full bg-secondary px-4 py-2 text-sm font-medium" onClick={() => start(true)}>Study unknown</button>
          </div>
        </div>
        {deck.cards.length > 0 && (
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${(known / deck.cards.length) * 100}%` }} />
          </div>
        )}
        <form onSubmit={addCards} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <input className={input} placeholder="Front (question / term)" value={front} onChange={(e) => setFront(e.target.value)} />
          <input className={input} placeholder="Back (answer / definition)" value={back} onChange={(e) => setBack(e.target.value)} />
          <textarea className={`${input} sm:col-span-2`} rows={3} placeholder={"Or paste many at once, one per line:\nMitochondria - powerhouse of the cell\nPhotosynthesis: plants making food from light"} value={bulk} onChange={(e) => setBulk(e.target.value)} />
          <button className={`${btn} justify-self-start`}>Add cards</button>
        </form>
        <div className="grid gap-3 sm:grid-cols-2">
          {deck.cards.map((c) => (
            <div key={c.id} className={`${card} text-sm`}>
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{c.front}</span>
                <button className={del} onClick={() => updateDeck((d) => ({ ...d, cards: d.cards.filter((x) => x.id !== c.id) }))}>Delete</button>
              </div>
              <p className="mt-1 text-muted-foreground">{c.back}</p>
              {c.known && <span className="mt-2 inline-block text-xs text-primary">✓ Known</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {timer}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const nd = { id: uid(), name: name.trim(), cards: [] };
          setDecks([...decks, nd]); setName(""); setActiveId(nd.id);
        }}
        className={`${card} flex gap-3`}
      >
        <input className={input} placeholder="New flashcard deck (e.g. Bio 101 – Cells)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={btn}>Create</button>
      </form>
      {decks.length === 0 && <p className="text-sm text-muted-foreground">No decks yet — create one above.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {decks.map((d) => (
          <div key={d.id} className={`${card} cursor-pointer`} onClick={() => setActiveId(d.id)}>
            <div className="flex justify-between">
              <h3 className="font-semibold">{d.name}</h3>
              <button className={del} onClick={(e) => { e.stopPropagation(); setDecks(decks.filter((x) => x.id !== d.id)); }}>Delete</button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {d.cards.length} cards · {d.cards.filter((c) => c.known).length} known
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
