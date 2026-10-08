"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { gsap, registerGsap } from "@/lib/gsap";
import { type Project } from "@/lib/data";
import Nav from "./Nav";
import Footer from "./Footer";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";

const ProjectCanvas = dynamic(() => import("./ProjectCanvas"), { ssr: false });

export default function CaseStudy({ project, next }: { project: Project; next: Project }) {
  const media = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    window.scrollTo(0, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      if (media.current) {
        gsap.fromTo(
          media.current.querySelector("img"),
          { yPercent: -8, scale: 1.12 },
          {
            yPercent: 8,
            scale: 1.12,
            ease: "none",
            scrollTrigger: { trigger: media.current, start: "top bottom", end: "bottom top", scrub: true }
          }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <ProjectCanvas colors={project.colors} />
      <Nav />
      <main className="shell pt-[calc(var(--gutter)*5)]">
        <div className="flex items-center justify-between" data-fade>
          <Link
            href="/"
            className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-bone"
            data-cursor="Index"
          >
            <span className="transition-transform duration-500 group-hover:-translate-x-1">←</span>
            Index
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {project.category} · {project.year}
          </span>
        </div>

        <header className="py-[8vh]">
          <h1 className="t-display t-huge max-w-[14ch]">{project.name}</h1>
          <p className="t-lead mt-8 max-w-[52ch] text-muted">{project.summary}</p>
        </header>

        <div className="grid grid-cols-12 gap-8 border-t border-line pt-10">
          <div className="col-span-12 lg:col-span-6">
            <span className="t-eyebrow">Scope</span>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.scope.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-6 lg:col-span-3">
            <span className="t-eyebrow">Stack</span>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm text-muted">
              {project.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="col-span-6 lg:col-span-3">
            <span className="t-eyebrow">Outcome</span>
            <p className="mt-4 text-sm text-muted">{project.outcome}</p>
          </div>
        </div>

        <Reveal className="my-[10vh]">
          <div
            ref={media}
            className="ph relative aspect-[16/9] w-full overflow-hidden"
            data-label={`${project.name} — hero image placeholder`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.image} alt="" className="h-full w-full object-cover" />
          </div>
        </Reveal>

        <div className="grid grid-cols-12 gap-8 pb-[8vh]">
          <div className="col-span-12 lg:col-span-5">
            <SplitHeading className="t-md">The brief.</SplitHeading>
          </div>
          <div className="col-span-12 flex flex-col gap-5 text-sm leading-relaxed text-muted lg:col-span-6 lg:col-start-7">
            <p>
              {`The starting point was a familiar problem: a product doing serious work, presented
              through an interface that made it feel ordinary. The goal was not novelty for its own
              sake — it was clarity, given enough craft to be felt.`}
            </p>
            <p>
              {`Everything below is placeholder copy. The real case study will carry the actual
              brief, the decisions taken, and the measurable result — problem, craft, outcome.`}
            </p>
          </div>
        </div>

        <Reveal className="border-t border-line pt-10">
          <div className="grid grid-cols-12 items-center gap-8 pb-[10vh]">
            <div className="col-span-12 lg:col-span-8">
              <p className="t-display t-md max-w-[24ch]">{project.outcome}</p>
            </div>
            <div className="col-span-12 lg:col-span-4 lg:text-right">
              <span className="t-eyebrow">Result</span>
            </div>
          </div>
        </Reveal>

        <Link
          href={`/work/${next.slug}`}
          className="group block border-t border-line py-[8vh]"
          data-cursor="Next"
        >
          <span className="t-eyebrow">Next project</span>
          <div className="mt-4 flex items-center justify-between gap-8">
            <span className="t-display text-[clamp(40px,7vw,120px)] leading-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-4">
              {next.name}
            </span>
            <span className="text-3xl text-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              →
            </span>
          </div>
        </Link>

        <div className="pb-[6vh]">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-bone"
          >
            ↑ Back to top
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
