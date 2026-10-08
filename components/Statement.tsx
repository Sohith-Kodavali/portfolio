"use client";

import { manifesto } from "@/lib/data";
import ScrollRevealText from "./ScrollRevealText";
import Parallax from "./Parallax";

export default function Statement() {
  return (
    <section aria-label="Statement" data-grade="#7fb0ff" className="shell py-[20vh]">
      <div className="flex items-start justify-between gap-10">
        <span className="t-eyebrow shrink-0 pt-3">Statement</span>
        <ScrollRevealText
          as="h2"
          className="t-display t-lg max-w-[24ch]"
          dim={0.1}
          start="top 82%"
          end="bottom 58%"
        >
          {manifesto}
        </ScrollRevealText>
      </div>
      <Parallax speed={0.06} className="mt-16">
        <div className="rule" />
      </Parallax>
    </section>
  );
}
