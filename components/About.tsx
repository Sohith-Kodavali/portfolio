"use client";

import { profile } from "@/lib/data";
import { useClock } from "@/lib/useClock";
import MorphHeading from "./MorphHeading";
import ClipReveal from "./ClipReveal";
import ScrollRevealText from "./ScrollRevealText";

export default function About() {
  const time = useClock(true);

  return (
    <section id="about" data-grade="#8fb8ff" className="shell py-[12vh]">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5">
          <ClipReveal className="ph aspect-[4/5] w-full" >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/portrait.svg"
              alt="Portrait placeholder"
              className="h-full w-full object-cover"
            />
          </ClipReveal>
          <div className="mt-5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span>{profile.location} · {profile.timezone.split(" ")[0]}</span>
            <span className="tabular-nums">{time}</span>
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-between lg:col-span-7 lg:pl-[4vw]">
          <div>
            <span className="t-eyebrow">About / 04</span>
            <MorphHeading className="t-lg mt-5 max-w-[16ch]">
              Design is the quiet part of the argument.
            </MorphHeading>

            <div className="mt-9 flex flex-col gap-6 text-[clamp(16px,1.15vw,20px)] leading-relaxed text-bone/85">
              <ScrollRevealText as="p" className="max-w-[52ch]" dim={0.18}>
                I work across design and engineering — building interfaces, systems and the
                motion that makes them legible. Understand the problem precisely, then obsess
                over the details until the product feels inevitable.
              </ScrollRevealText>
              <ScrollRevealText as="p" className="max-w-[52ch]" dim={0.18} start="top 88%" end="bottom 60%">
                Most of what I do lives between the two disciplines — close enough to the code
                to know what is expensive, close enough to the design to know what matters.
              </ScrollRevealText>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-line pt-8">
            <div>
              <span className="t-eyebrow">Currently</span>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {profile.availability}
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <span className="size-1.5 rounded-full bg-line" />
                  Based in {profile.location} · {profile.timezone}
                </li>
              </ul>
            </div>
            <div>
              <span className="t-eyebrow">Focus</span>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                <li>Interface design & systems</li>
                <li>Creative front-end engineering</li>
                <li>Motion & real-time graphics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
