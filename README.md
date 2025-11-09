## JobHub – Server-rendered CareerJet job board

JobHub is a fully server-side rendered Next.js 16 application that surfaces real-time openings from the CareerJet API with SEO-first defaults and monetisation via TinyAds.

### Features

- Server-rendered listing page with filters for keyword, location, category, contract type, and working hours
- Dynamic job detail pages with canonical URLs, rich metadata, and JobPosting structured data
- Response caching via `unstable_cache` plus an in-memory job store to minimise API usage
- Pagination, SEO-friendly slugs, sitemap/robots endpoints, and configurable defaults
- TinyAds integration that loads only on the client to preserve SSR performance

### Prerequisites

Create an `.env.local` file with the following variables:

```bash
CAREERJET_API_KEY=your_api_key_here
CAREERJET_FALLBACK_IP=1.1.1.1          # optional – default IP for build-time fetches
CAREERJET_FALLBACK_UA=JobHubBot/1.0    # optional – default UA for build-time fetches
CAREERJET_REFERER=https://jobhub.example.com  # required if Careerjet enforces Referer checks
NEXT_PUBLIC_SITE_URL=https://jobhub.example.com
NEXT_PUBLIC_TINYADS_SLOT_ID=your_tinyads_slot
```

> The CareerJet API requires Basic auth with the API key as the username and an empty password. The app handles the header for you once the key is supplied. The fallback IP/UA values are used for build-time requests (sitemap generation, etc.); be sure to provide a valid routable IP (for example, your build server’s egress IP) to avoid `403 Invalid user_ip` responses.

### Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to browse the job board. Filters submit through the URL so you can share/search friendly links, and job pages hydrate entirely on the server.

### Production build

```bash
npm run build
npm run start
```

### Notes

- `app/sitemap.ts` and `app/robots.ts` emit dynamic SEO assets using cached job data.
- TinyAds loads via `components/tiny-ad-slot.tsx`; if no slot ID is configured, a placeholder renders instead of throwing.
- The application never stores credentials client-side; all data fetching happens on the server with caching to limit API quotas.
