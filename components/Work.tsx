"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap, registerGsap } from "@/lib/gsap";
import { projects } from "@/lib/data";
import { setThemeFromProject, clearTheme } from "@/lib/theme";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";
import DistortImage from "./DistortImage";

export default function Work() {
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = list.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row) => {
        const media = row.querySelector("[data-media]");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: "top 82%", once: true }
        });
        tl.fromTo(row, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo" });
        if (media) {
          tl.fromTo(
            media,
            { clipPath: "inset(14% 8% 14% 8%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo" },
            0
          );
        }
      });
    }, scope);

    return () => ctx.revert();
  }, []);

  return (
    <section id="work" data-grade="none" className="shell pt-[16vh] pb-[8vh]">
      <header className="grid grid-cols-12 gap-x-4 gap-y-6 pb-[12vh]">
        <span className="col-span-12 t-eyebrow lg:col-span-3">Selected work / 01—05</span>
        <SplitHeading className="col-span-12 t-lg lg:col-span-8">
          Work built to make the right people stop.
        </SplitHeading>
      </header>

      <div ref={list} onMouseLeave={clearTheme} className="flex flex-col gap-[14vh]">
        {projects.map((p, i) => (
          <Link
            key={p.slug}
            href={`/work/${p.slug}`}
            data-row
            onMouseEnter={() => setThemeFromProject(p.colors)}
            data-cursor="View case"
            className={`group block ${i % 2 === 1 ? "lg:pl-[10%]" : ""}`}
          >
            <div
              data-media
              className="ph relative aspect-[16/9] w-full overflow-hidden"
              data-label={`${p.name} — image placeholder`}
            >
              <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(.66,0,.01,1)] group-hover:scale-[1.06]">
                <DistortImage src={p.image} alt={`${p.name} — ${p.category}`} />
              </div>
              <span className="absolute top-5 right-5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                View case ↗
              </span>
            </div>

            <div className="mt-5 grid grid-cols-12 items-baseline gap-x-4 gap-y-2">
              <span className="col-span-2 font-mono text-[10px] text-muted lg:col-span-1">
                {p.idx}
              </span>
              <h3 className="col-span-10 t-display t-md lg:col-span-5">{p.name}</h3>
              <span className="col-span-8 text-sm text-muted lg:col-span-4 lg:col-start-7">
                {p.category}
              </span>
              <span className="col-span-4 text-right font-mono text-[10px] text-muted lg:col-span-2">
                {p.year}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Reveal className="mt-[10vh] flex justify-end">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Full case studies — problem, craft, outcome
        </span>
      </Reveal>
    </section>
  );
}
