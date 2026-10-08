// ---------------------------------------------------------------------------
// Site content.
// NOTE: all copy, contact details and imagery are PLACEHOLDERS pending final
// content from the client. Nothing here references the studio or education.
// ---------------------------------------------------------------------------

export const profile = {
  name: "Sohith Kodavali",
  role: "Design Engineer",
  discipline: "Interfaces · Motion · WebGL",
  location: "India",
  timezone: "IST (UTC+5:30)",
  availability: "Two slots · next quarter",
  email: "hello@placeholder.com",
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com/in/placeholder" },
    { label: "GitHub", href: "https://github.com/placeholder" },
    { label: "X", href: "https://x.com/placeholder" },
    { label: "Instagram", href: "https://instagram.com/placeholder" }
  ]
} as const;

export const heroWords = ["Interfaces", "that", "feel", "alive"] as const;

export const manifesto =
  "I design and engineer interfaces where motion is the material. Not decoration — structure. The part that tells you where you are, what matters, and what happens next.";

export const tickerWords = [
  "Interface design",
  "Creative engineering",
  "Motion systems",
  "Real-time graphics",
  "Design systems",
  "Performance",
  "Art direction",
  "Interaction"
] as const;

export const stats = [
  { value: "40+", label: "Projects shipped" },
  { value: "12", label: "Industries" },
  { value: "6", label: "Countries served" }
] as const;

export type Project = {
  idx: string;
  slug: string;
  name: string;
  category: string;
  year: string;
  summary: string;
  scope: readonly string[];
  stack: readonly string[];
  outcome: string;
  image: string;
  url?: string;
  colors: { c1: [number, number, number]; c2: [number, number, number]; freq: number; warp: number };
};

// Project names are final. Copy, imagery and results are still placeholders —
// swap them once the real case-study material lands. Each card links out to the
// live site, so no case-study page is generated. `url` is optional: a project
// without one renders as a plain card rather than a dead link.
export const projects: Project[] = [
  {
    idx: "01",
    slug: "rrkfoods",
    name: "RRK Foods",
    category: "Restaurant · Brand + Site",
    year: "2025",
    summary:
      "A food court with a following, given a site that sells the food before you taste it — menu, ordering and a voice that carries the brand.",
    scope: ["Art direction", "Website", "Ordering flow", "Copy"],
    stack: ["HTML5", "CSS3", "JavaScript"],
    outcome: "Case study to be written.",
    image: "/work/rrkfoods.svg",
    url: "https://rrkfoods.in",
    colors: { c1: [0.96, 0.26, 0.15], c2: [0.1, 0.04, 0.03], freq: 2.2, warp: 1.6 }
  },
  {
    idx: "02",
    slug: "techyuva",
    name: "TechYuva",
    category: "Community · Events",
    year: "2025",
    summary:
      "A community hub built to fill rooms — events, workshops and a home for the people who actually show up.",
    scope: ["Website", "Event pages", "Motion"],
    stack: ["HTML5", "CSS3", "JavaScript"],
    outcome: "Case study to be written.",
    image: "/work/techyuva.svg",
    url: "https://techyuva.in",
    colors: { c1: [0.16, 0.8, 0.66], c2: [0.02, 0.1, 0.09], freq: 2.8, warp: 2.0 }
  },
  {
    idx: "03",
    slug: "vexon",
    name: "Vexon",
    category: "Technology · Corporate",
    year: "2025",
    summary:
      "A corporate platform for a technology and digital engineering firm — built to hold up with senior buyers, not just to look modern.",
    scope: ["Art direction", "Design system", "Front-end", "Motion"],
    stack: ["Next.js", "React", "Three.js", "Framer Motion"],
    outcome: "Case study to be written.",
    image: "/work/vexon.webp",
    url: "https://vexonsol.com",
    colors: { c1: [0.26, 0.54, 0.98], c2: [0.02, 0.04, 0.11], freq: 3.0, warp: 1.5 }
  },
  {
    idx: "04",
    slug: "zyppyn",
    name: "Zyppyn",
    category: "Product · Consumer",
    year: "2024",
    summary:
      "A pre-launch product story: premium display hardware introduced before anyone can buy it, with restraint instead of hype.",
    scope: ["Creative direction", "Website", "Product narrative"],
    stack: ["HTML5", "CSS3", "JavaScript"],
    outcome: "Case study to be written.",
    image: "/work/zyppyn.svg",
    url: "https://zyppyn.com",
    colors: { c1: [0.48, 0.7, 0.96], c2: [0.03, 0.06, 0.11], freq: 2.4, warp: 1.6 }
  },
  {
    idx: "05",
    slug: "envirosys",
    name: "Envirosys",
    category: "Environment · Services",
    year: "2024",
    summary:
      "An environmental services company given a clearer, more credible front door — the work explained properly, for the people who commission it.",
    scope: ["Website", "Information architecture", "Copy"],
    stack: ["HTML5", "CSS3", "JavaScript"],
    outcome: "Case study to be written.",
    image: "/work/envirosys.svg",
    colors: { c1: [0.4, 0.8, 0.36], c2: [0.03, 0.09, 0.05], freq: 2.1, warp: 1.7 }
  }
];

export const capabilities = [
  {
    idx: "01",
    title: "Interface Design",
    body: "Systems, not screens — typography, spacing and colour that hold together across every state.",
    tags: ["UI/UX", "Design systems", "Prototyping"]
  },
  {
    idx: "02",
    title: "Creative Engineering",
    body: "Production front-end where the details are the product — performance budgets and pixel discipline.",
    tags: ["Next.js", "TypeScript", "Accessibility"]
  },
  {
    idx: "03",
    title: "Motion & WebGL",
    body: "Shaders, simulations and choreography that give an interface weight, rhythm and memory.",
    tags: ["Three.js", "GLSL", "GSAP"]
  },
  {
    idx: "04",
    title: "Art Direction",
    body: "The point of view — what a brand looks like, sounds like and refuses to be.",
    tags: ["Identity", "Type", "Creative direction"]
  }
] as const;

export const processSteps = [
  { idx: "01", title: "Frame", body: "Understand the objective, the audience and what success actually measures." },
  { idx: "02", title: "Direction", body: "Establish a point of view — visual language, motion principles, structure." },
  { idx: "03", title: "Craft", body: "Design and engineer in the same loop. Details decide the outcome." },
  { idx: "04", title: "Ship", body: "Performance, accessibility, QA — then release with confidence and support." }
] as const;

export const testimonials = [
  { quote: "The kind of detail you only notice when it's missing. The work simply felt premium.", cite: "Client Partner", org: "Placeholder" },
  { quote: "Fast, considered, and genuinely inventive. Our site stopped looking like everyone else's.", cite: "Founder", org: "Placeholder" },
  { quote: "Motion, performance and clarity — all three, at once. Rare.", cite: "Head of Product", org: "Placeholder" }
] as const;

export const recognition = [
  "Awwwards — Site of the Day (placeholder)",
  "FWA — Site of the Day (placeholder)",
  "CSS Design Awards (placeholder)",
  "Webby Nominee (placeholder)"
] as const;

// "Process" is intentionally absent: the process now plays inside the pinned
// warp transition rather than living in its own section.
export const navLinks = [
  { label: "Work", href: "#work" },
  { label: "Studio", href: "#capabilities" },
  { label: "Contact", href: "#contact" }
] as const;
