import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TinyAdSlot from "@/components/tiny-ad-slot";
import {
  CareerjetJob,
  findJobBySlug,
  CareerjetSearchCriteria,
} from "@/lib/careerjet";
import { formatPostedDate, plainTextFromHtml } from "@/lib/utils";

type PageParams = {
  params: { slug: string };
  searchParams: {
    keywords?: string;
    location?: string;
  };
};

function buildFallbackCriteria({
  keywords,
  location,
}: {
  keywords?: string;
  location?: string;
}): CareerjetSearchCriteria {
  const criteria: CareerjetSearchCriteria = {};
  if (keywords) criteria.keywords = keywords;
  if (location) criteria.location = location;
  return criteria;
}

function createMetadata(job: CareerjetJob | undefined, slug: string): Metadata {
  if (!job) {
    return {
      title: "Job not found | JobHub",
      description:
        "The job you are looking for is no longer available. Explore more roles on JobHub.",
      alternates: {
        canonical: `/jobs/${slug}`,
      },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobhub.example.com";
  const canonical = `${siteUrl}/jobs/${slug}`;
  const cleanDescription = plainTextFromHtml(job.description).slice(0, 200);

  return {
    title: `${job.title} at ${job.company || "Unknown company"} | JobHub`,
    description: cleanDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${job.title} – ${job.company || "Hiring now"}`,
      description: cleanDescription,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} – ${job.company || "Hiring now"}`,
      description: cleanDescription,
    },
  };
}

function jobPostingStructuredData(job: CareerjetJob, slug: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobhub.example.com";
  const applyLink = job.apply_url ?? job.url;
  const isoDate = (() => {
    const parsed = new Date(job.date);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return parsed.toISOString();
  })();

  const baseSalary =
    job.salary_min && job.salary_max
      ? {
          "@type": "MonetaryAmount",
          currency: job.salary_currency_code ?? "USD",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salary_min,
            maxValue: job.salary_max,
            unitText:
              job.salary_type === "H"
                ? "HOUR"
                : job.salary_type === "D"
                  ? "DAY"
                  : job.salary_type === "W"
                    ? "WEEK"
                    : job.salary_type === "M"
                      ? "MONTH"
                      : "YEAR",
          },
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: isoDate,
    employmentType: "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "Confidential",
      sameAs: job.site ? `https://${job.site}` : undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.locations || "Remote",
        addressCountry: "US",
      },
    },
    jobLocationType: job.locations?.toLowerCase().includes("remote")
      ? "TELECOMMUTE"
      : "ONSITE",
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "JobHub",
      value: slug,
    },
    applicantLocationRequirements: job.locations,
    industry: job.site,
    url: `${siteUrl}/jobs/${slug}`,
    sameAs: job.url,
    baseSalary,
    applicationContact: {
      "@type": "ContactPoint",
      url: applyLink,
    },
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageParams): Promise<Metadata> {
  const fallback = buildFallbackCriteria(searchParams);
  const job = await findJobBySlug(params.slug, fallback);
  return createMetadata(job, params.slug);
}

export default async function JobDetail({ params, searchParams }: PageParams) {
  const fallbackCriteria = buildFallbackCriteria(searchParams);
  const job = await findJobBySlug(params.slug, fallbackCriteria);

  if (!job) {
    notFound();
  }

  const applyLink = job.apply_url ?? job.url;
  const structuredData = jobPostingStructuredData(job, params.slug);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <nav>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to listings
        </Link>
      </nav>

      <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-600">
              {job.company || "Hiring company"}
            </span>
            {job.locations ? (
              <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-700">
                {job.locations}
              </span>
            ) : null}
            {job.salary ? (
              <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-600">
                {job.salary}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-600">
            Posted {formatPostedDate(job.date)} · Source: {job.site}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Apply on original site
            </a>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              View source listing ↗
            </a>
          </div>
        </header>

        <section className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">About this role</h2>
          <p className="text-sm leading-6 text-slate-700 whitespace-pre-line">
            {job.description}
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          <h3 className="text-base font-semibold text-slate-800">Need-to-know</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Company
              </dt>
              <dd className="text-sm font-semibold text-slate-800">
                {job.company || "Confidential"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Location
              </dt>
              <dd className="text-sm font-semibold text-slate-800">
                {job.locations || "Remote / Flexible"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Posted
              </dt>
              <dd className="text-sm font-semibold text-slate-800">
                {formatPostedDate(job.date)}
              </dd>
            </div>
            {job.salary ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Compensation
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {job.salary}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      </article>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Sponsored</p>
        <p className="mt-2 text-xs text-slate-500">
          Ads are loaded on the client to keep job content blazing fast.
        </p>
        <div className="mt-4">
          <TinyAdSlot />
        </div>
      </aside>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}

