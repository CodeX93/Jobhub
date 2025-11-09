import Link from "next/link";
import { searchJobs } from "@/lib/careerjet";
import { formatPostedDate } from "@/lib/utils";
import TinyAdSlot from "@/components/tiny-ad-slot";

type SearchParams = Record<string, string | string[] | undefined>;

const categories = [
  { id: "", label: "All categories", keyword: "" },
  { id: "software-engineering", label: "Software Engineering", keyword: "software engineer" },
  { id: "product", label: "Product Management", keyword: "product manager" },
  { id: "design", label: "Design & UX", keyword: "product designer" },
  { id: "data", label: "Data & Analytics", keyword: "data analyst" },
  { id: "marketing", label: "Marketing", keyword: "marketing specialist" },
];

const contractOptions: { value: CareerjetContractType | ""; label: string }[] = [
  { value: "", label: "All contracts" },
  { value: "p", label: "Permanent" },
  { value: "c", label: "Contract" },
  { value: "t", label: "Temporary" },
  { value: "i", label: "Internship" },
  { value: "v", label: "Volunteering" },
];

const hoursOptions: { value: CareerjetWorkHours | ""; label: string }[] = [
  { value: "", label: "Any hours" },
  { value: "f", label: "Full-time" },
  { value: "p", label: "Part-time" },
];

type CareerjetContractType = "p" | "c" | "t" | "i" | "v";
type CareerjetWorkHours = "f" | "p";

function getParamValue(params: SearchParams, key: string) {
  const value = params[key];
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const keywordsParam = getParamValue(searchParams, "q");
  const locationParam = getParamValue(searchParams, "location");
  const categoryParam = getParamValue(searchParams, "category");
  const contractTypeParam = getParamValue(searchParams, "type");
  const hoursParam = getParamValue(searchParams, "hours");
  const pageParam = Number.parseInt(getParamValue(searchParams, "page") || "1", 10);

  const selectedCategory =
    categories.find((category) => category.id === categoryParam) ?? categories[0];
  const combinedKeywords = [keywordsParam, selectedCategory.keyword]
    .filter(Boolean)
    .join(" ")
    .trim();

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const response = await searchJobs({
    keywords: combinedKeywords || undefined,
    location: locationParam || undefined,
    contractType: (contractTypeParam as CareerjetContractType) || undefined,
    workHours: (hoursParam as CareerjetWorkHours) || undefined,
    page,
    pageSize: 20,
  });

  const jobs = response.jobs ?? [];
  const totalPages = response.pages ?? 1;

  const baseParams = new URLSearchParams();
  if (keywordsParam) baseParams.set("q", keywordsParam);
  if (locationParam) baseParams.set("location", locationParam);
  if (categoryParam) baseParams.set("category", categoryParam);
  if (contractTypeParam) baseParams.set("type", contractTypeParam);
  if (hoursParam) baseParams.set("hours", hoursParam);

  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams(baseParams);
    params.set("page", targetPage.toString());
    const query = params.toString();
    return query ? `/?${query}` : "/";
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Welcome to JobHub
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Discover your next role with fresh listings powered by Careerjet
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Filter hundreds of live job postings by keywords, location, contract type,
              and working hours. Apply directly on the employer’s site.
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" action="/">
            <input type="hidden" name="page" value="1" />
            <label className="flex flex-col gap-2 xl:col-span-2">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Keywords
              </span>
              <input
                name="q"
                defaultValue={keywordsParam}
                placeholder="Role, skill, or company"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2 xl:col-span-1">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Location
              </span>
              <input
                name="location"
                defaultValue={locationParam}
                placeholder="City, region, or remote"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Category
              </span>
              <select
                name="category"
                defaultValue={categoryParam}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {categories.map((category) => (
                  <option key={category.id || "all"} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-end xl:gap-4">
              <label className="flex flex-1 flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Contract
                </span>
                <select
                  name="type"
                  defaultValue={contractTypeParam}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {contractOptions.map((option) => (
                    <option key={option.value || "any"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-1 flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Hours
                </span>
                <select
                  name="hours"
                  defaultValue={hoursParam}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {hoursOptions.map((option) => (
                    <option key={option.value || "any"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-end xl:col-span-5">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                Search jobs
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Latest openings
          </h2>

          {response.type === "LOCATIONS" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              <p className="font-semibold">We found several matching locations.</p>
              <p className="mt-2">
                Try refining your search by selecting one of the suggested locations below:
              </p>
              <ul className="mt-3 list-disc pl-6">
                {(response.locations ?? []).map((location) => (
                  <li key={location}>{location}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {jobs.length === 0 && response.type !== "LOCATIONS" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                No results just yet
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Try a different keyword or broaden your filters to see more roles.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {jobs.map((job) => {
              const detailParams = new URLSearchParams();
              if (combinedKeywords) detailParams.set("keywords", combinedKeywords);
              if (locationParam) detailParams.set("location", locationParam);
              const detailHref = detailParams.toString()
                ? `/jobs/${job.slug}?${detailParams.toString()}`
                : `/jobs/${job.slug}`;

              return (
                <article
                  key={job.slug}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between md:gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                          {job.company || "Hiring company"}
                        </span>
                        {job.salary ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                            {job.salary}
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={detailHref}
                        className="mt-3 block text-lg font-semibold text-slate-900 transition group-hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-2 text-sm text-slate-600">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-4 text-sm text-slate-600 md:items-end">
                      <div className="text-right">
                        <p>{job.locations || "Flexible / Remote"}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                          Posted {formatPostedDate(job.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={detailHref}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View details
                          <span aria-hidden>→</span>
                        </Link>
                        <a
                          href={job.apply_url ?? job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Apply
                          <span aria-hidden>↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <nav className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <Link
                className={`rounded-lg px-3 py-2 font-semibold ${
                  page > 1
                    ? "text-blue-600 hover:bg-blue-50"
                    : "cursor-not-allowed text-slate-300"
                }`}
                aria-disabled={page <= 1}
                href={page > 1 ? createPageHref(page - 1) : "#"}
              >
                Previous
              </Link>
              <p>
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </p>
              <Link
                className={`rounded-lg px-3 py-2 font-semibold ${
                  page < totalPages
                    ? "text-blue-600 hover:bg-blue-50"
                    : "cursor-not-allowed text-slate-300"
                }`}
                aria-disabled={page >= totalPages}
                href={page < totalPages ? createPageHref(page + 1) : "#"}
              >
                Next
              </Link>
            </nav>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">Sponsored</p>
            <p className="mt-2 text-xs text-slate-500">
              Ads are loaded client-side to keep page speed blazing fast.
            </p>
            <div className="mt-4">
              <TinyAdSlot />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-800">
            <h3 className="text-base font-semibold">Tips for better matches</h3>
            <ul className="mt-3 space-y-2">
              <li>Use specific job titles or core skills in your search.</li>
              <li>Combine city and “remote” to widen the location radius.</li>
              <li>Bookmark roles to revisit after applying.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
