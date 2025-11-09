import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { makeJobSlug, extractHashFromSlug } from "./utils";

export interface CareerjetJob {
  title: string;
  company: string;
  date: string;
  description: string;
  locations: string;
  salary?: string;
  salary_currency_code?: string;
  salary_max?: number;
  salary_min?: number;
  salary_type?: "Y" | "M" | "W" | "D" | "H";
  site: string;
  url: string;
  apply_url?: string;
  slug: string;
}

export interface CareerjetSearchResponse {
  type: "JOBS" | "LOCATIONS" | string;
  hits?: number;
  message?: string;
  pages?: number;
  response_time?: number;
  jobs?: CareerjetJob[];
  locations?: string[];
}

export interface CareerjetSearchCriteria {
  keywords?: string;
  location?: string;
  contractType?: "p" | "c" | "t" | "i" | "v";
  workHours?: "f" | "p";
  page?: number;
  pageSize?: number;
  radius?: number;
}

interface CareerjetRawJob {
  title?: string;
  company?: string;
  date?: string;
  description?: string;
  locations?: string;
  salary?: string;
  salary_currency_code?: string;
  salary_max?: number;
  salary_min?: number;
  salary_type?: "Y" | "M" | "W" | "D" | "H";
  site?: string;
  url?: string;
}

const API_ENDPOINT = "https://search.api.careerjet.net/v4/query";
const DEFAULT_LOCALE = "en_US";
const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL_SECONDS = 600;
const JOB_CACHE_TTL_MS = 1000 * 60 * 15;

const jobCache = new Map<
  string,
  { job: CareerjetJob; expiresAt: number }
>();

function emptyResponse(message?: string): CareerjetSearchResponse {
  return {
    type: "ERROR",
    message,
    hits: 0,
    pages: 1,
    jobs: [],
  };
}

function ensureApiKey() {
  const apiKey = process.env.CAREERJET_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing CAREERJET_API_KEY environment variable. Please set it in your environment."
    );
  }
  return apiKey;
}

function buildAuthHeader() {
  const apiKey = ensureApiKey();
  const credentials = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${credentials}`;
}

function getReferer() {
  return (
    process.env.CAREERJET_REFERER ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://jobhub.example.com"
  );
}

async function getRequestMetadata() {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for") ?? "";
    const ip =
      forwardedFor.split(",").map((segment) => segment.trim())[0] ||
      process.env.CAREERJET_FALLBACK_IP ||
      "8.8.8.8";
    const userAgent =
      headerList.get("user-agent") ||
      process.env.CAREERJET_FALLBACK_UA ||
      "JobHubBot/1.0";
    return { ip, userAgent };
  } catch {
    return {
      ip: process.env.CAREERJET_FALLBACK_IP || "8.8.8.8",
      userAgent: process.env.CAREERJET_FALLBACK_UA || "JobHubBot/1.0",
    };
  }
}

function buildQueryString(
  criteria: CareerjetSearchCriteria,
  requestMeta: { ip: string; userAgent: string }
) {
  const params = new URLSearchParams();
  params.set("locale_code", DEFAULT_LOCALE);
  params.set("page_size", String(criteria.pageSize ?? DEFAULT_PAGE_SIZE));
  params.set("page", String(criteria.page ?? 1));
  params.set("user_ip", requestMeta.ip);
  params.set("user_agent", requestMeta.userAgent);

  if (criteria.radius) {
    params.set("radius", String(criteria.radius));
  }
  if (criteria.keywords) {
    params.set("keywords", criteria.keywords);
  }
  if (criteria.location) {
    params.set("location", criteria.location);
  }
  if (criteria.contractType) {
    params.set("contract_type", criteria.contractType);
  }
  if (criteria.workHours) {
    params.set("work_hours", criteria.workHours);
  }

  return params.toString();
}

function rememberJobs(jobs: CareerjetJob[] = []) {
  const now = Date.now();
  const expiresAt = now + JOB_CACHE_TTL_MS;
  for (const job of jobs) {
    const hash = extractHashFromSlug(job.slug);
    jobCache.set(hash, { job, expiresAt });
  }
}

function normalizeJob(raw: CareerjetRawJob): CareerjetJob {
  const slug = makeJobSlug(raw.title ?? "Job Opening", raw.url ?? "");
  return {
    title: raw.title ?? "Job Opening",
    company: raw.company ?? "",
    date: raw.date ?? "",
    description: raw.description ?? "",
    locations: raw.locations ?? "",
    salary: raw.salary,
    salary_currency_code: raw.salary_currency_code,
    salary_max: raw.salary_max,
    salary_min: raw.salary_min,
    salary_type: raw.salary_type,
    site: raw.site ?? "",
    url: raw.url ?? "",
    apply_url: raw.url ?? "",
    slug,
  };
}

const cachedSearch = unstable_cache(
  async (queryString: string) => {
    const response = await fetch(`${API_ENDPOINT}?${queryString}`, {
      headers: {
        Authorization: buildAuthHeader(),
        Referer: getReferer(),
      },
      // Always fetch on the server
      next: {
        revalidate: CACHE_TTL_SECONDS,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `Careerjet API error (${response.status}): ${message || response.statusText}`
      );
    }

    const data = (await response.json()) as CareerjetSearchResponse;

    if (Array.isArray(data.jobs)) {
      data.jobs = data.jobs.map(normalizeJob);
      rememberJobs(data.jobs);
    }

    return data;
  },
  ["careerjet-search"],
  { revalidate: CACHE_TTL_SECONDS }
);

export async function searchJobs(criteria: CareerjetSearchCriteria = {}) {
  const requestMeta = await getRequestMetadata();
  const queryString = buildQueryString(criteria, requestMeta);
  try {
    return await cachedSearch(queryString);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Careerjet search failed:", error);
    }
    return emptyResponse(
      error instanceof Error ? error.message : "Careerjet API unavailable"
    );
  }
}

export function getJobFromCache(hash: string) {
  const cached = jobCache.get(hash);
  if (!cached) return undefined;
  if (cached.expiresAt < Date.now()) {
    jobCache.delete(hash);
    return undefined;
  }
  return cached.job;
}

export async function findJobBySlug(
  slug: string,
  fallbackCriteria: CareerjetSearchCriteria = {}
) {
  const hash = extractHashFromSlug(slug);
  const cached = getJobFromCache(hash);
  if (cached) {
    return cached;
  }

  const criteria = { ...fallbackCriteria };
  if (!criteria.keywords) {
    criteria.keywords = slug
      .split("-")
      .slice(0, -1)
      .join(" ")
      .replace(/\s+/g, " ");
  }

  const response = await searchJobs(criteria);
  const job = response.jobs?.find(
    (item) => extractHashFromSlug(item.slug) === hash
  );
  return job;
}

export function getCachedJobsSnapshot() {
  const result: CareerjetJob[] = [];
  const now = Date.now();
  for (const [hash, { job, expiresAt }] of jobCache.entries()) {
    if (expiresAt >= now) {
      result.push(job);
    } else {
      jobCache.delete(hash);
    }
  }
  return result;
}

