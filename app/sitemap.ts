import type { MetadataRoute } from "next";

const base = "https://example.com";

// One page. The work cards link out to each project's own live site, so there
// are no case-study routes to list.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
