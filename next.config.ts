import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // OneDrive returns EINVAL for readlink on the .next tree, which breaks dev and
  // build. Setting NEXT_DIST_DIR lets the build output live somewhere else
  // (e.g. a temp folder) without touching the normal flow.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // With the output outside the project, generated route types cannot resolve
  // `next`; that is only the redirected case, and types are checked separately.
  typescript: process.env.NEXT_DIST_DIR ? { ignoreBuildErrors: true } : undefined
};

export default nextConfig;
