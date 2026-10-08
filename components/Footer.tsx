"use client";

import { profile } from "@/lib/data";
import { scrollToId } from "@/lib/scroll";
import Parallax from "./Parallax";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="shell pb-[var(--gutter)]">
      <div className="rule" />
      <div className="flex flex-col gap-8 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Parallax speed={-0.06}>
            <h2 className="t-display text-[clamp(40px,7vw,120px)] leading-none">
              {profile.name}
            </h2>
          </Parallax>
          <button
            onClick={() => scrollToId("#top")}
            className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-bone"
            data-cursor="Top"
          >
            Back to top
            <span className="transition-transform duration-500 group-hover:-translate-y-1">↑</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>© {year} — All rights reserved</span>
          <span>Designed & built in-house</span>
          <span>{profile.location} · {profile.timezone}</span>
        </div>
      </div>
    </footer>
  );
}
