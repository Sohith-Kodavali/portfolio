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
```

## Where things live

| What | File |
| --- | --- |
| All content (text, projects, links) | `lib/data.ts` |
| Design tokens, palette, type scale | `app/globals.css` (`@theme`) |
| Fonts | `app/fonts.ts` |
| Global systems (cursor, loader, smooth scroll, progress) | `components/*.tsx` |
| WebGL background + adaptive quality | `components/HeroCanvas.tsx`, `lib/quality.ts` |
| Home sections | `components/Hero.tsx`, `Work.tsx`, `Capabilities.tsx`, `Process.tsx`, `About.tsx`, `Testimonials.tsx`, `Contact.tsx` |
| Case study page | `app/work/[slug]/page.tsx`, `components/CaseStudy.tsx` |
| Placeholder images | `public/**` (SVG) |

## Swapping in real content

1. **Text & projects** — edit `lib/data.ts`. Project `colors` (c1/c2/freq/warp) drive the WebGL
   palette change on hover; the case studies auto-generate from the same array.
2. **Images** — replace the SVGs in `public/work/*.svg` and `public/portrait.svg`. Keep the same
   filenames and you don't have to touch any code. `public/og.svg` is the social share image.
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
