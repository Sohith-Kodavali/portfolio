# Portfolio

Award-oriented personal portfolio. Laptop/desktop-first, built for motion and real-time graphics.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first tokens in `app/globals.css`)
- **Three.js** + **React Three Fiber** — WebGL field/particle background
- **GSAP** + **ScrollTrigger** — scroll reveals, pinned horizontal section, parallax
- **Lenis** — smooth scroll, synced to the GSAP ticker

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm start      # serve the production build
pnpm typecheck  # tsc --noEmit
pnpm images     # compress public/work images + emit .webp siblings
pnpm clean      # remove .next (needed when switching between build and dev)
```

## Where things live

| What | File |
| --- | --- |
| All content (text, projects, links) | `lib/data.ts` |
| Design tokens, palette, type scale | `app/globals.css` (`@theme`) |
| Fonts | `app/fonts.ts` |
| Global systems (cursor, loader, smooth scroll, progress) | `components/*.tsx` |
| WebGL shell (wordmark, pointer, particles) + adaptive quality | `components/ShellCanvas.tsx`, `components/WordText.tsx`, `lib/quality.ts` |
| Home sections | `components/Hero.tsx`, `Work.tsx`, `Capabilities.tsx`, `About.tsx`, `Testimonials.tsx`, `Contact.tsx` |
| Case study page | `app/work/[slug]/page.tsx`, `components/CaseStudy.tsx` |
| Project images | `public/work/*` |

## Swapping in real content

1. **Text & projects** — edit `lib/data.ts`. Project `colors` (c1/c2/freq/warp) drive the WebGL
   palette change on hover; the case studies auto-generate from the same array.
2. **Images** — drop them in `public/work/`. **Use `.webp`**: run `pnpm images` and it compresses
   everything in that folder and writes a `.webp` next to each file, then point `image` in
   `lib/data.ts` at the `.webp`. (The first real image, `vexon`, went from 1.9 MB as a PNG to
   53 KB as WebP.) `public/portrait.svg` and `public/og.svg` are still placeholders.
3. **Metadata** — update `metadataBase`, title and description in `app/layout.tsx`, plus
   `app/robots.ts` and `app/sitemap.ts` (currently `https://example.com`).
4. **Contact** — `profile.email` and `profile.socials` in `lib/data.ts`.

## Notes

- The `dev` script forces `NODE_ENV=development` via `cross-env`; a stray `NODE_ENV=production`
  in the shell otherwise breaks `next dev`.
- The WebGL canvases load with `ssr: false` (R3F is not server-renderable here) and are mounted
  behind a lazy wrapper.
- `lib/quality.ts` detects GPU capability and scales particle counts / DPR; it also respects
  `prefers-reduced-motion`.
