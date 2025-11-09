import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobhub.example.com";
  const sitemapUrl = `${siteUrl.replace(/\/$/, "")}/sitemap.xml`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: sitemapUrl,
  };
}

