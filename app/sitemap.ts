import type { MetadataRoute } from "next";
import { getCachedJobsSnapshot, searchJobs } from "@/lib/careerjet";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobhub.example.com";
  const origin = siteUrl.replace(/\/$/, "");

  let jobs = getCachedJobsSnapshot();
  if (jobs.length === 0) {
    try {
      const response = await searchJobs({ pageSize: 20 });
      jobs = response.jobs ?? [];
    } catch (error) {
      console.error("Failed to fetch jobs for sitemap:", error);
    }
  }

  const jobEntries = jobs.map((job) => {
    const parsed = new Date(job.date);
    const lastModified = Number.isNaN(parsed.getTime())
      ? new Date()
      : parsed;
    return {
      url: `${origin}/jobs/${job.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.6,
    };
  });

  return [
    {
      url: `${origin}/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...jobEntries,
  ];
}

