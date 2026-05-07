# verity-social

The agnostic studio UI for Verity. Built per [ADR-0046](https://github.com/sandhipveera/verity/blob/main/docs/decisions/0046-industry-agnostic-platform-and-verity-social.md) (in the verity-core repo).

## What this is

One React+TS+Vite codebase that serves multiple verticals via subdomain routing:

| Subdomain | Brand | Vertical |
|---|---|---|
| `cyber.verity.accessquint.com` | Verity (cyber) | Cybersecurity |
| `wellness.verity.accessquint.com` | Verity Wellness | Wellness (DSHEA + FTC) |
| `app.verity.accessquint.com` | Platform default | — |

On first paint the studio fetches `GET /api/brand/current?host=<host>` from
verity-core and themes itself entirely from the response — palette,
typography, copy, logos, channel handle. **No vertical-specific code in
this repo.** Adding a new vertical is a verity-core change (new
`server/domains/<slug>.ts` + `server/brands/<slug>.ts`) plus a Vercel
domain rule.

See `docs/research/openswarm-strategic-analysis.md` (in the verity-core
repo) for the multi-quarter roadmap context: Composio integration,
multi-agent decomposition, multi-format export.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Framer Motion
- Sonner (toasts)
- (shadcn components added on demand via `npx shadcn add ...`)

## Local dev

```bash
cp .env.example .env.development.local
# edit VITE_API_BASE if you want to point at a local verity-core
npm install
npm run dev
# → http://localhost:5174
```

`/api/*` is proxied to `VITE_API_BASE` (defaults to
`https://api.verity.accessquint.com`).

To preview the wellness theme locally, the simplest path is to pass a
host override in the URL — verity-core's `/api/brand/current?host=` query
param wins over the Host header. Add this to BrandThemeProvider during
testing if needed:

```ts
const HOST_OVERRIDE = new URLSearchParams(window.location.search).get("brand-host");
const host = HOST_OVERRIDE ?? window.location.host;
```

Then load `?brand-host=wellness.verity.accessquint.com` to preview the
wellness theme from any local hostname.

## Build + deploy

```bash
npm run build
```

Outputs `dist/`. Deploy to Vercel; configure three domain aliases
pointing at the same project: `app.verity.accessquint.com`,
`cyber.verity.accessquint.com`, `wellness.verity.accessquint.com`.

## Architecture

```
src/
  api/
    types.ts              ← wire-types mirroring verity-core's BrandPublic / DomainPublic
    client.ts             ← fetch helpers (no shared imports across repo boundary)
  theme/
    BrandThemeProvider.tsx ← fetches brand+domain on mount, applies as CSS custom props
  components/
    Header.tsx            ← brand-themed (no vertical-specific copy)
    Hero.tsx              ← uses brand.copy.heroHeadline + heroSub
    BriefInput.tsx        ← brand-themed input + CTA
    CopyEm.tsx            ← inline emphasis renderer for [em-primary]/[em-secondary] tokens in copy
  App.tsx                 ← shell composition
  main.tsx                ← React mount
  index.css               ← Tailwind v4 + @theme block + brand custom-prop fallbacks
```

## The agnostic contract (what's enforced)

> No vertical-specific knowledge anywhere in this repo. Every visible
> string + every brand color comes from `brand.copy.*` and
> `brand.uiPalette.*`. Adding a new vertical = create
> `server/domains/<slug>.ts` + `server/brands/<slug>.ts` in verity-core +
> point a Vercel domain at this codebase. **Zero changes here.**

A grep audit (CI later) catches drift: any non-trivial hardcoded string in
`src/components/**` is suspect. Component review: `useBrand()` and
`brand.copy.<key>`, never literals.

## Status

- ✅ Scaffold + Tailwind v4 + Framer Motion + Sonner installed
- ✅ Brand-config fetch + CSS-custom-property theming
- ✅ Hero + Header + BriefInput surfaces (brand-themed)
- ⏳ Episode list + storyboard surfaces (next)
- ⏳ Insights / feedback closed loop (ADR-0047 in verity-core)
- ⏳ Subdomain-tied Vercel deployment

## License

MIT
