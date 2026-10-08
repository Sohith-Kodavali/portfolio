"use client";

import { useEffect, useRef, useState } from "react";
import { projects, profile } from "@/lib/data";
import { cn } from "@/lib/utils";

type Turn = { role: "you" | "site"; text: string; href?: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

const INTENTS: { keys: string[]; answer: () => Turn }[] = [
  {
    keys: ["contact", "email", "reach", "hire", "talk", "call", "whatsapp", "touch"],
    answer: () => ({
      role: "site",
      text: `Easiest route is email — ${profile.email}. ${profile.availability}.`
    })
  },
  {
    keys: ["stack", "tech", "technology", "tools", "framework", "built with", "languages"],
    answer: () => ({
      role: "site",
      text: `Across the work: ${Array.from(new Set(projects.flatMap((p) => p.stack))).join(", ")}.`
    })
  },
  {
    keys: ["available", "availability", "free", "slots", "start", "timeline", "when", "bandwidth"],
    answer: () => ({ role: "site", text: `${profile.availability}. Based in ${profile.location}.` })
  },
  {
    keys: ["who", "about", "yourself", "you", "background", "experience"],
    answer: () => ({
      role: "site",
      text: `${profile.name} — ${profile.role}. ${profile.discipline}. Five projects are live here; ask about any of them.`
    })
  }
];

/** Scores a project against the question's words. */
function scoreProject(q: string) {
  const words = norm(q).split(/\s+/).filter((w) => w.length > 2);
  let best = { i: -1, s: 0 };
  projects.forEach((p, i) => {
    const name = norm(p.name);
    const hay = norm(
      [p.name, p.category, p.summary, p.scope.join(" "), p.stack.join(" "), p.outcome].join(" ")
    );
    let s = 0;
    for (const w of words) {
      if (name.includes(w)) s += 4;
      else if (hay.includes(w)) s += 2;
    }
    if (s > best.s) best = { i, s };
  });
  return best;
}

function respond(q: string): Turn {
  for (const intent of INTENTS) {
    if (intent.keys.some((k) => norm(q).includes(k))) return intent.answer();
  }

  const { i, s } = scoreProject(q);
  if (i >= 0 && s > 0) {
    const p = projects[i];
    return {
      role: "site",
      text: `${p.name} — ${p.category}. ${p.summary}\n\nScope: ${p.scope.join(", ")}. Stack: ${p.stack.join(", ")}.`,
      href: p.url
    };
  }

  return {
    role: "site",
    text: `I can talk about ${projects.map((p) => p.name).join(", ")}, the stack, or how to get in touch.`
  };
}

/**
 * Ask about the work. Answers come from the project data on the page itself —
 * no network call, no API key, nothing to configure. (Wiring it to a hosted
 * model would need a server route and a key.)
 */
export default function WorkAssistant() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [turns, open]);

  const ask = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setValue("");
    setTurns((t) => [...t, { role: "you", text: clean }, respond(clean)]);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 left-6 z-[460] flex items-center gap-2 rounded-full border border-line bg-ink/80 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone backdrop-blur-xl transition-colors hover:border-bone"
        data-cursor={open ? "Close" : "Ask"}
        aria-expanded={open}
      >
        <span className="size-1.5 rounded-full bg-accent" />
        {open ? "Close" : "Ask about the work"}
      </button>

      <div
        className={cn(
          "fixed bottom-20 left-6 z-[460] flex w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-lg border border-line bg-ink/92 backdrop-blur-2xl transition-all duration-500",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        )}
        style={{ maxHeight: "min(460px, 60vh)" }}
      >
        <div ref={scroller} className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
          {turns.length === 0 && (
            <p className="text-muted">
              Ask me about any project, the stack behind them, or how to get in touch.
            </p>
          )}
          {turns.map((t, i) => (
            <div key={i} className={cn("mb-3", t.role === "you" ? "text-right" : "text-left")}>
              <p
                className={cn(
                  "inline-block max-w-[92%] whitespace-pre-line rounded-md px-3 py-2 text-left",
                  t.role === "you"
                    ? "bg-accent text-ink"
                    : "border border-line bg-ink-2 text-bone"
                )}
              >
                {t.text}
              </p>
              {t.href && (
                <div className="mt-2">
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="u-dot font-mono text-[10px] uppercase tracking-[0.14em] text-accent"
                  >
                    Visit live site ↗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
          className="flex items-center gap-2 border-t border-line p-3"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="What did you do for the restaurant?"
            className="min-w-0 flex-1 bg-transparent text-sm text-bone outline-none placeholder:text-muted"
            aria-label="Ask about the work"
          />
          <button
            type="submit"
            className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-bone hover:text-bone"
          >
            Ask
          </button>
        </form>
      </div>
    </>
  );
}
