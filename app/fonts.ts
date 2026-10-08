import { Archivo, Fraunces, Inter, JetBrains_Mono } from "next/font/google";

// Display — heavy geometric grotesk for the big all-caps statements.
export const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["wdth"],
  display: "swap"
});

// Editorial accent — used sparingly for a single emphasised word.
export const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap"
});

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});
