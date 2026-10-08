"use client";

import { useState } from "react";
import { profile } from "@/lib/data";
import Magnetic from "./Magnetic";
import Reveal from "./Reveal";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" data-grade="#7f8cff" className="shell py-[14vh]">
      <div className="flex flex-col items-center text-center">
        <span className="t-eyebrow">Contact / 06</span>

        <h2 className="t-display t-huge mt-6 max-w-[16ch]">
          Let’s build something worth remembering.
        </h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Magnetic strength={0.35}>
            <a
              href={`mailto:${profile.email}`}
              className="group flex items-center gap-4 rounded-full bg-accent px-8 py-5 text-ink"
              data-cursor="Email"
            >
              <span className="text-base font-medium">{profile.email}</span>
              <span className="transition-transform duration-500 group-hover:translate-x-1">↗</span>
            </a>
          </Magnetic>

          <button
            onClick={copy}
            className="rounded-full border border-line px-6 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-bone hover:text-bone"
            data-cursor="Copy"
          >
            {copied ? "Copied ✓" : "Copy address"}
          </button>
        </div>

        <Reveal className="mt-16 w-full">
          <div className="rule" />
          <div className="flex flex-wrap items-center justify-between gap-6 pt-8">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              {profile.availability}
            </span>

            <nav className="flex flex-wrap items-center gap-6">
              {profile.socials.map((s) => (
                <Magnetic key={s.label} strength={0.25}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative text-sm text-muted transition-colors hover:text-bone"
                  >
                    {s.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                  </a>
                </Magnetic>
              ))}
            </nav>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
