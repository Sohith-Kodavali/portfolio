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
  colors: { c1: [number, number, number]; c2: [number, number, number]; freq: number; warp: number };
};

// Placeholder portfolio — swap names, copy, imagery and metrics for real work.
export const projects: Project[] = [
  {
    idx: "01",
    slug: "meridian",
    name: "Meridian",
    category: "Fintech · Product",
    year: "2025",
    summary:
      "A trading surface rebuilt around clarity — live data made calm, legible and fast under pressure.",
    scope: ["Product design", "Design system", "Front-end engineering", "Motion"],
    stack: ["Next.js", "TypeScript", "WebGL", "GSAP"],
    outcome: "Time-to-insight down by a third in usability testing.",
    image: "/work/meridian.svg",
    colors: { c1: [0.78, 1.0, 0.24], c2: [0.04, 0.09, 0.06], freq: 2.6, warp: 1.8 }
  },
  {
    idx: "02",
    slug: "halcyon",
    name: "Halcyon",
    category: "Hospitality · Brand",
    year: "2025",
    summary:
      "An identity and booking experience for a coastal retreat — atmosphere you can almost feel through the screen.",
    scope: ["Art direction", "Brand identity", "Website", "Photography direction"],
    stack: ["Next.js", "Three.js", "Lenis", "Sanity"],
    outcome: "Direct bookings up sharply against the previous season.",
    image: "/work/halcyon.svg",
    colors: { c1: [1.0, 0.36, 0.18], c2: [0.09, 0.05, 0.04], freq: 1.9, warp: 1.5 }
  },
  {
    idx: "03",
    slug: "northwind",
    name: "Northwind",
    category: "SaaS · Analytics",
    year: "2024",
    summary:
      "A data platform that makes dense numbers feel approachable — a system for charts, states and self-serve setup.",
    scope: ["Design system", "Dashboard UX", "Front-end", "Data viz"],
    stack: ["React", "TypeScript", "D3", "GSAP"],
    outcome: "Onboarding completion up meaningfully after the rebuild.",
    image: "/work/northwind.svg",
    colors: { c1: [0.35, 0.62, 1.0], c2: [0.03, 0.06, 0.11], freq: 3.1, warp: 1.4 }
  },
  {
    idx: "04",
    slug: "lumen",
    name: "Lumen",
    category: "Consumer · Mobile web",
    year: "2024",
    summary:
      "A premium product story told in scroll — hardware rendered in real time, no video, no smoke and mirrors.",
    scope: ["Creative direction", "WebGL", "Interaction design"],
    stack: ["Next.js", "React Three Fiber", "GLSL", "GSAP"],
    outcome: "Average session depth nearly doubled.",
    image: "/work/lumen.svg",
    colors: { c1: [0.86, 0.86, 0.9], c2: [0.06, 0.06, 0.08], freq: 2.2, warp: 1.7 }
  },
  {
    idx: "05",
    slug: "cobalt",
    name: "Cobalt",
    category: "B2B · Infrastructure",
    year: "2023",
    summary:
      "A developer-first marketing site that treats documentation as a first-class design surface.",
    scope: ["Brand", "Marketing site", "Docs system", "Motion"],
    stack: ["Next.js", "MDX", "GSAP", "Radix"],
    outcome: "Sign-up conversion improved after launch.",
    image: "/work/cobalt.svg",
    colors: { c1: [0.2, 0.5, 0.95], c2: [0.02, 0.04, 0.1], freq: 2.9, warp: 2.0 }
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
