"use client";

import { capabilities } from "@/lib/data";
import MorphHeading from "./MorphHeading";
import Reveal from "./Reveal";
import Parallax from "./Parallax";

export default function Capabilities() {
  // Desaturated hard from the original amber. With a `color` blend the tint's
  // own saturation drives how strong the cast reads, so this dials it down
  // without touching the global opacity knob.
  return (
    <section id="capabilities" data-grade="#beb2a7" className="shell py-[12vh]">
      <div className="mb-[6vh] flex flex-wrap items-end justify-between gap-8">
        <div>
          <span className="t-eyebrow">What I do / 02</span>
          <MorphHeading className="t-lg mt-5 max-w-[16ch]">
            Four disciplines, one hand.
          </MorphHeading>
        </div>
        <p className="max-w-[36ch] text-sm text-muted">
          Design and engineering in the same loop — so nothing is lost in translation between
          the mockup and the shipped product.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
        {capabilities.map((c, i) => (
          <Reveal key={c.idx} delay={i * 0.06} className="group bg-ink p-8 lg:p-12">
            <Parallax speed={i % 2 === 0 ? 0.05 : -0.05} className="flex h-full flex-col justify-between gap-16">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-muted">{c.idx}</span>
                <span className="size-2 rounded-full bg-line transition-colors duration-500 group-hover:bg-accent" />
              </div>
              <div>
                <h3 className="t-display t-md mb-5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                  {c.title}
                </h3>
                <p className="max-w-[42ch] text-sm leading-relaxed text-muted">{c.body}</p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Parallax>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
