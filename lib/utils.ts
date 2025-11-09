import crypto from "crypto";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeJobSlug(title: string, url: string) {
  const base = slugify(title) || "job-opening";
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 10);
  return `${base}-${hash}`;
}

export function extractHashFromSlug(slug: string) {
  const parts = slug.split("-");
  if (parts.length === 0) return "";
  return parts[parts.length - 1];
}

export function formatPostedDate(date: string | undefined) {
  if (!date) return "Recently posted";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently posted";
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function plainTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, "");
}

