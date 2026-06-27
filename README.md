# GridCalc — Grid Trading Calculator

Free crypto grid trading calculator for Binance Futures traders.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS 4
- Upstash Redis (public visit counter)

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional — for counter & SEO locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Arithmetic & Geometric Grid
- Long, Short, Neutral strategies
- Profit per grid, margin, liquidation simulation
- Coin holdings simulation at Start / Upper / Lower / Current
- Public visit counter in footer

## Environment Variables

Copy [`.env.example`](.env.example) to `.env.local` for local dev.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for sitemap, OpenGraph, and SEO |
| `UPSTASH_REDIS_REST_URL` | For counter | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | For counter | Upstash Redis REST token |

The calculator works without env vars. The visit counter and production SEO metadata need them on Vercel.

## Deploy (Vercel)

Repo: [github.com/borbaibank/Girdcalculator](https://github.com/borbaibank/Girdcalculator)

### One-time setup

1. Go to [vercel.com](https://vercel.com) and sign in with **GitHub**
2. Click **Add New… → Project**
3. Import **borbaibank/Girdcalculator**
4. Keep default settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** (auto)
   - **Install Command:** `npm install`
5. Add environment variables (see below)
6. Click **Deploy**
7. Wait ~2 minutes — you get a URL like `https://girdcalculator.vercel.app`

### Auto-deploy on push

Once the repo is linked and **Production Branch = `main`**, every push to `main` deploys automatically:

```bash
git add .
git commit -m "Your message"
git push origin main
```

Check progress at **Vercel Dashboard → Deployments**.

### Vercel environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Example | Environments |
|------|---------|--------------|
| `NEXT_PUBLIC_SITE_URL` | `https://girdcalculator.vercel.app` | Production |
| `UPSTASH_REDIS_REST_URL` | from Upstash dashboard | Production, Preview |
| `UPSTASH_REDIS_REST_TOKEN` | from Upstash dashboard | Production, Preview |

Redeploy after adding env vars (or push a new commit).

### Visit counter setup (Upstash)

1. Create a free account at [upstash.com](https://upstash.com)
2. **Create Redis database** — region `ap-southeast-1` (matches Vercel `sin1`)
3. Copy **REST URL** and **REST Token** into Vercel env vars above
4. Redeploy — footer shows e.g. `1,234 visits`

### Google Search (SEO)

Google does not index new sites automatically. After deploy:

1. **Google Search Console** — [search.google.com/search-console](https://search.google.com/search-console)
   - Add property → URL prefix → your Vercel URL
   - Verify ownership (HTML tag, DNS, or Vercel integration)
2. **Submit sitemap** — `https://your-domain.com/sitemap.xml`
3. **Request indexing** — URL Inspection → enter homepage → Request indexing
4. **Wait** — first indexing usually takes 3–14 days for new sites

The app ships with `sitemap.xml`, `robots.txt`, and OpenGraph metadata when `NEXT_PUBLIC_SITE_URL` is set.

### Local production test

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/                    # Pages, API routes, sitemap, robots
├── components/             # Shared UI & layout
├── features/grid-calculator/
├── lib/calculators/grid.ts
└── types/
```
