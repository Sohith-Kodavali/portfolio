"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
};

/**
 * Turns every internal navigation into a view transition, so routes cross-fade
 * as one continuous space instead of cutting.
 *
 * Native listener on `document`, so it runs *after* React's handlers — a link
 * that manages its own transition is skipped, since it will already have
 * called preventDefault.
 *
 * Progressive: browsers without the API simply navigate as before.
 */
export default function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const doc = document as DocWithVT;
    if (typeof doc.startViewTransition !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const next = href.split("#")[0];
      if (!next || next === pathname) return;

      e.preventDefault();
      doc.startViewTransition!(() => {
        router.push(href);
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router, pathname]);

  return null;
}
