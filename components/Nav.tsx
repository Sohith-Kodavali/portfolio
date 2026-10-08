"use client";

import { useEffect, useState } from "react";
import { scrollToId } from "@/lib/scroll";
import { useClock } from "@/lib/useClock";
import { profile } from "@/lib/data";
import ThemeToggle from "./ThemeToggle";

const links = [
  { label: "WORK", href: "#work" },
  { label: "STUDIO", href: "#capabilities" },
  { label: "PROCESS", href: "#process" },
  { label: "CONTACT", href: "#contact" }
];

export default function Nav() {
  const time = useClock();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollToId(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 z-[440] w-full transition-colors duration-500 ${
        solid ? "border-b border-line bg-ink/70 backdrop-blur-xl" : ""
      }`}
    >
      <div className="grid grid-cols-12 items-center gap-4 shell py-4">
        <a
          href="#top"
          onClick={(e) => go(e, "#top")}
          className="col-span-6 font-mono text-[10px] uppercase tracking-[0.18em] lg:col-span-3"
          data-cursor="Top"
        >
          {profile.name.split(" ")[0]}.design
        </a>

        <nav className="col-span-6 hidden items-center justify-start gap-7 lg:col-span-5 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => go(e, l.href)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:text-bone"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="col-span-6 flex items-center justify-end gap-5 lg:col-span-4">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:inline">
            {time}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
