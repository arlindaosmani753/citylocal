# Stack Research

**Domain:** Community city guide / local discovery web platform
**Researched:** 2026-03-13
**Confidence:** MEDIUM-HIGH (Next.js/React/Tailwind verified via official docs; database/auth/ORM based on training data with known ecosystem standing)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (App Router) | Full-stack React framework | Official docs confirm v16.1.6 stable. App Router + Partial Prerendering (PPR via `cacheComponents`) is the right model for a community feed: static shell with streaming dynamic content. Server Actions handle form submissions (post creation, ratings) without a separate API layer. Turbopack is now the default bundler. |
| React | 19.x | UI component library | Stable since December 5, 2024. useActionState, useOptimistic, and Server Actions are exactly what post creation + rating flows need. Native form actions remove custom form state boilerplate. |
| TypeScript | 5.x | Type safety | Next.js 16 requires TypeScript 5.1+. next.config.ts is now natively supported. Non-negotiable for a geospatial app with coordinate validation. |
| Tailwind CSS | 4.x | Utility-first styling | Released January 22, 2025. CSS-first config (no tailwind.config.js), automatic content detection, zero-config setup. 8.8x faster incremental builds. Use `@import "tailwindcss"` in CSS. |
| PostgreSQL + PostGIS | PostgreSQL 16, PostGIS 3.x | Primary database with geospatial queries | GPS verification requires radius-based proximity checks (ST_DWithin). PostGIS is the standard extension for this. No alternative comes close for geospatial SQL on relational data. GEOGRAPHY type handles ellipsoidal distance calculations correctly worldwide (critical for multi-city). |
| Supabase | 2.x JS client | Hosted Postgres + Auth + Realtime | Provides PostgreSQL with PostGIS extension enabled, built-in Auth with user metadata (where user roles live), and Realtime subscriptions over WebSockets for the city feed. Single platform eliminates infrastructure complexity for v1. Auth supports custom user metadata for local/tourist role storage. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | 0.39+ | Type-safe ORM for PostgreSQL | Use for all database queries. Supports raw SQL escape hatches for PostGIS functions (ST_DWithin, ST_Distance, ST_AsGeoJSON) that no ORM models natively. Lighter than Prisma, no query engine binary. The standard choice in 2025 Next.js projects. |
| drizzle-kit | 0.30+ | Schema migrations | Pair with drizzle-orm. `drizzle-kit push` for dev, `drizzle-kit migrate` for production. |
| @supabase/ssr | latest | Supabase SSR auth helpers for Next.js | Required for correct cookie-based session handling in Next.js App Router Server Components. Replaces the deprecated @supabase/auth-helpers-nextjs. |
| zod | 3.x | Schema validation | Validate GPS coordinates, post content, and ratings server-side in Server Actions before touching the database. Use with react-hook-form on the client. |
| react-hook-form | 7.x | Form state management | Handle post creation and review submission forms. Pairs with zod via @hookform/resolvers for end-to-end type-safe validation. |
| @hookform/resolvers | 3.x | Zod adapter for react-hook-form | Bridge between react-hook-form and zod schemas. |
| shadcn/ui | latest (canary supports Tailwind v4) | Accessible UI component primitives | Unstyled-by-default components (Dialog, Sheet, Card, Badge, Tabs) that integrate with Tailwind v4. Not a dependency — components are copied into your project. Use for city page layout, post cards, rating stars, modals. |
| lucide-react | latest | Icon library | shadcn/ui's default icon set. Covers map pins, stars, calendar, user badges needed for this domain. |
| date-fns | 4.x | Date manipulation | Event scheduling (start/end dates), "posted X ago" timestamps, event expiry logic. Smaller than moment.js, tree-shakeable. |
| @t3-oss/env-nextjs | latest | Environment variable validation | Validate all env vars (Supabase URL, anon key, service role key) at build time. Prevents runtime crashes from missing config. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Dev bundler (default in Next.js 16) | Ships by default with `next dev`. Up to 76.7% faster local startup than Webpack. No config needed. |
| ESLint 9 | Linting | Next.js 16 uses flat config format. Configure with `eslint.config.mjs`. Note: `next build` no longer runs linter automatically in v16 — add lint step to CI explicitly. |
| Prettier | Code formatting | Standard; add tailwind prettier plugin for class sorting. |
| drizzle-kit | Database migrations and studio | `drizzle-kit studio` gives a local database browser. `drizzle-kit generate` creates migration files. |

## Installation

```bash
# Core framework
npx create-next-app@latest citylocal --typescript --tailwind --eslint --app --turbopack
cd citylocal

# Database ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Validation
npm install zod react-hook-form @hookform/resolvers

# UI and utilities
npm install lucide-react date-fns @t3-oss/env-nextjs

# shadcn/ui (copies components, not a dependency)
npx shadcn@latest init
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Supabase (PostgreSQL + PostGIS + Auth + Realtime) | Neon + Clerk + Pusher | If you want best-in-class specialized services and are comfortable managing 3 integrations. Neon has branching for PRs; Clerk has richer role management UI; Pusher is battle-tested for WebSockets. But 3 vendors vs 1 is real v1 overhead. |
| Supabase Realtime | Server-Sent Events (SSE) | If you don't need Supabase's other features. SSE is simpler for one-way push but requires your own server setup. |
| drizzle-orm | Prisma | Prisma 5.x has better DX for complex relations and a visual schema editor. Choose Prisma if the team is unfamiliar with SQL — but Prisma has no PostGIS support so geospatial queries require raw SQL anyway, eliminating the DX advantage. |
| drizzle-orm | Kysely | Kysely is a good alternative — fully type-safe SQL builder. Choose if you want more explicit SQL control than drizzle but less than raw pg. |
| Tailwind CSS v4 | Tailwind CSS v3 | v3 if your team's existing tooling (shadcn/ui stable, existing plugins) hasn't migrated to v4 yet. Note: shadcn/ui's canary branch supports v4; the stable branch targets v3. This is the main v4 risk. |
| shadcn/ui | Radix UI directly | If you want more control over styling without the shadcn layer. shadcn/ui IS Radix UI + Tailwind — they're equivalent in underlying accessibility. |
| Next.js App Router | Remix | Remix is excellent for form-heavy apps with progressive enhancement. But Next.js App Router with React 19 Server Actions closes the gap, and the ecosystem (Vercel, Supabase, shadcn) is more Next.js-first. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| MongoDB / document databases | GPS proximity queries (find places within 500m) require geospatial indexes and distance calculations that PostgreSQL + PostGIS does better. MongoDB's geospatial is limited to 2D sphere indexes, not ellipsoidal, which causes accuracy issues at scale globally. | PostgreSQL + PostGIS |
| Firebase Realtime Database / Firestore | No SQL joins — you'll denormalize city + place + user + rating data into a maintenance nightmare. No PostGIS equivalent. Query limitations hurt multi-city aggregations. | Supabase (PostgreSQL) |
| tRPC | Adds a type-safe RPC layer that duplicates what Next.js Server Actions already provide natively in App Router. Extra complexity with no benefit for this architecture. | Next.js Server Actions |
| Next.js Pages Router | Pages Router is in maintenance mode. For a greenfield app in 2026, App Router is the only choice. No PPR, no Server Components, no native Server Actions. | Next.js App Router |
| Mapbox GL JS (paid) | Mapbox requires a paid API key for production traffic. For v1 map views (place locations), the cost is unnecessary. | Leaflet.js (free, OSM tiles) or Google Maps Embed API (free tier generous) |
| moment.js | 300KB+ bundle, not tree-shakeable, in maintenance mode. | date-fns (tree-shakeable, 2KB per import) |
| express.js / separate API server | You don't need a separate Node server. Next.js Route Handlers and Server Actions handle all backend needs. A separate Express service doubles your infrastructure for no benefit in v1. | Next.js Server Actions + Route Handlers |
| Zustand / Redux for global state | Community feed data lives server-side. React 19 Server Components + Server Actions + Supabase Realtime handle state without client-side global stores for this use case. Only add if you have demonstrably complex client state. | React Server Components + useOptimistic for optimistic updates |

## Stack Patterns by Variant

**For GPS verification (locals posting):**
- Use Web Geolocation API (`navigator.geolocation.getCurrentPosition`) in a Client Component
- Send coordinates to a Server Action
- Verify with PostGIS: `ST_DWithin(place_location, ST_MakePoint($lon, $lat)::geography, 500)` (500m radius)
- Requires HTTPS (already enforced by Supabase + Vercel/any modern host)

**For city feed (real-time updates):**
- Use Supabase Realtime with `postgres_changes` subscription for INSERT events on the posts table
- Client subscribes to `channel('city-{cityId}').on('postgres_changes', ...)`
- Pair with Next.js PPR: static city page shell + dynamic feed section wrapped in Suspense
- On new post: client receives Realtime event → optimistic UI update via useOptimistic

**For multi-city routing:**
- Use Next.js dynamic routes: `app/cities/[slug]/page.tsx`
- City slug derived from normalized city name (e.g., `paris-france`, `new-york-us`)
- City metadata (name, country, timezone, coordinates) stored in cities table
- ISR with `revalidate` or `use cache` + `cacheLife('hours')` for city metadata pages

**For user roles (locals vs tourists):**
- Store role in Supabase user metadata: `{ role: 'local' | 'tourist', home_city_id: string }`
- Role set at registration, immutable in v1 (no role switching)
- Enforce in Server Actions: check `user.user_metadata.role` before allowing post creation
- GPS verification is an additional check on top of role (not a substitute)

**For ratings and reviews (tourists):**
- Tourist can only rate a place they've visited (no GPS check needed — honor system for v1)
- Rating stored in reviews table with user_id + place_id + rating (1-5) + text
- Aggregate rating computed via PostgreSQL: `AVG(rating)` with `COUNT` displayed on place cards
- Use `revalidateTag` after review submission to bust cached place pages

**If self-hosting (not Vercel):**
- Next.js ISR and `use cache` require a Node.js server — use `next start` with Docker
- Cache `NEXT_CACHE_HANDLER_PATH` can point to Redis for distributed caching across instances
- Supabase can be self-hosted (Supabase CLI) or use their cloud (recommended for v1)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.x | react@19.x, react-dom@19.x | App Router uses React 19 canary builds built-in. Always install react@19 alongside next@16. |
| next@16.x | typescript@5.1+ | Minimum TypeScript version enforced. next.config.ts natively supported. |
| tailwindcss@4.x | shadcn/ui canary | Stable shadcn/ui targets Tailwind v3. Use `npx shadcn@canary init` for v4 support. This is a known ecosystem gap as of early 2026 — watch shadcn releases. |
| drizzle-orm@0.39+ | postgres@3.x (node-postgres) | Use the `postgres` driver (not `pg`) — drizzle-orm's preferred PostgreSQL driver. |
| @supabase/ssr | next@13+ | Required for App Router. Never use @supabase/auth-helpers-nextjs (deprecated). |
| drizzle-orm | supabase | Use drizzle with the direct PostgreSQL connection string (not the Supabase JS client) for schema management and typed queries. Use Supabase JS client only for Auth and Realtime. |

## Key Architecture Decision: Supabase as the Integration Layer

The recommended stack uses Supabase for three things: **PostgreSQL + PostGIS** (database), **Auth** (user management + roles), and **Realtime** (city feed live updates). This is intentional.

The tradeoff: Supabase ties you to their platform. The mitigation: Supabase is open-source and self-hostable. The benefit for v1: one dashboard, one connection string, one auth flow, one Realtime subscription API — vs configuring Neon + Clerk + Pusher independently.

If Supabase outgrows your needs (pricing, compliance), the escape hatch is drizzle-orm: because all queries go through drizzle against standard PostgreSQL, swapping Supabase for any PostgreSQL host requires only changing the connection string.

## Sources

- `https://nextjs.org/docs/app/getting-started/installation` — Next.js 16.1.6 confirmed, Turbopack default bundler, TypeScript 5.1 minimum (HIGH confidence)
- `https://nextjs.org/blog/next-15` — Next.js 15 feature set: async Request APIs, caching semantics, React 19, Server Actions security (HIGH confidence)
- `https://nextjs.org/docs/app/getting-started/cache-components` — PPR / `cacheComponents` / `use cache` directive confirmed in Next.js 16 docs (HIGH confidence)
- `https://react.dev/blog/2024/12/05/react-19` — React 19 stable December 2024, useActionState, useOptimistic, Server Actions (HIGH confidence)
- `https://tailwindcss.com/blog/tailwindcss-v4` — Tailwind CSS v4.0 released January 22, 2025, CSS-first config, Vite plugin (HIGH confidence)
- Supabase PostGIS support, drizzle-orm versions, shadcn/ui v4 compatibility — training data (MEDIUM confidence, flag for validation before implementation)

---
*Stack research for: Community city guide web platform (CityLocal)*
*Researched: 2026-03-13*
