import type { Metadata, Viewport } from "next";
import { display, serif, sans, mono } from "./fonts";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import ScrollProgress from "@/components/ScrollProgress";
import GridOverlay from "@/components/GridOverlay";
import { ThemeProvider } from "@/lib/useTheme";

export const metadata: Metadata = {
  title: {
    default: "Sohith Kodavali — Design Engineer",
    template: "%s · Sohith Kodavali"
  },
  description:
    "Design engineer building interfaces where motion is the material — interface design, creative front-end and real-time graphics.",
  metadataBase: new URL("https://example.com"),
  authors: [{ name: "Sohith Kodavali" }],
  creator: "Sohith Kodavali",
  keywords: [
    "design engineer",
    "creative developer",
    "webgl portfolio",
    "interface design",
    "interaction design",
    "front-end engineering",
    "three.js",
    "next.js"
  ],
  openGraph: {
    title: "Sohith Kodavali — Design Engineer",
    description:
      "Interfaces where motion is the material — design, creative front-end and real-time graphics.",
    type: "website",
    locale: "en_IN",
    siteName: "Sohith Kodavali",
    images: ["/og.svg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sohith Kodavali — Design Engineer",
    description: "Interfaces where motion is the material.",
    images: ["/og.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0d" }
  ],
  colorScheme: "light dark"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}"
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <GridOverlay />
          <div className="grain" aria-hidden />
          <Loader />
          <ScrollProgress />
          <Cursor />
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
