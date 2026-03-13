# Project Research Summary

**Project:** CityLocal — Community-Powered City Guide
**Domain:** Community city guide / UGC local discovery platform (dual-role: Locals post, Tourists rate)
**Researched:** 2026-03-13
**Confidence:** MEDIUM

## Executive Summary

CityLocal is a two-sided community platform where GPS-verified locals post place and event recommendations, and tourists validate that content through ratings and reviews. Platforms of this type live or die on their trust model: if the local/tourist distinction collapses, or if early city pages are empty, the platform fails before network effects can take hold. Research across Yelp, TripAdvisor, Foursquare, and Meetup confirms that the defining failures of community city guides are cold starts, fake local accounts, GPS verification theater, and deferred moderation — all of which must be addressed architecturally before users arrive, not after.

The recommended approach centers on a Next.js 16 (App Router) + Supabase (PostgreSQL + PostGIS + Auth + Realtime) stack. A unified posts table with a `content_type` discriminator handles both places and events, avoiding the "events bolted on later" anti-pattern that breaks feed pagination. GPS verification must run server-side using PostGIS `ST_DWithin`, with client-side capture treated as UX only. The trust model should be behavior-based — local status earned through GPS-verified posting history, not a signup checkbox — to prevent the most common exploit: tourists self-declaring as locals to gain posting rights.

The most important risk is the cold start problem. A technically correct platform with zero content on launch day will fail. The launch strategy must front-load seeding one city to density (50+ posts) before any tourist-facing marketing. Architecturally, the critical path is: Auth + per-city roles → GPS verification + post creation → city feed → reviews. Events can be layered on the same posts table after the core loop is proven. The map view should be explicitly deferred to Phase 3 or later — feed-first is the correct default.

---

## Key Findings

### Recommended Stack

The stack is a tightly integrated set of modern tools where Supabase serves as the central platform for all three backend concerns: PostgreSQL with PostGIS for geospatial queries, Auth for user management and role storage, and Realtime for city feed updates. Drizzle ORM provides type-safe query access to PostGIS functions (using SQL escape hatches for `ST_DWithin`, `ST_Distance`) while keeping the escape hatch to swap database hosts without rewriting application code. React 19 + Next.js 16 App Router Server Actions eliminate the need for a separate API layer and handle form submissions (post creation, rating) with native form state management.

See `.planning/research/STACK.md` for full details, version compatibility table, and installation commands.

**Core technologies:**
- **Next.js 16 (App Router)**: Full-stack framework — Server Actions handle post/rating forms; PPR delivers static city page shells with streaming dynamic feeds; dynamic routes (`/cities/[slug]`) enable multi-city with zero per-city config.
- **React 19**: UI layer — `useOptimistic` and `useActionState` power the posting flow without client state management libraries.
- **PostgreSQL + PostGIS (via Supabase)**: Primary database with geospatial indexing — `ST_DWithin` for GPS proximity checks, `GEOGRAPHY` type for accurate global distance calculations.
- **Supabase**: Hosted Postgres + Auth + Realtime — single platform eliminates Neon + Clerk + Pusher integration complexity for v1; open-source escape hatch if outgrown.
- **Drizzle ORM**: Type-safe query layer with raw SQL escape hatch for PostGIS functions — lighter than Prisma with no query engine binary; avoids Prisma's complete lack of PostGIS support.
- **Tailwind CSS v4 + shadcn/ui (canary)**: Utility-first styling with accessible component primitives — CSS-first config, automatic content detection; use `npx shadcn@canary init` for v4 compatibility.
- **Zod + react-hook-form**: End-to-end validated forms — coordinate validation, post content, rating submission.

**Critical version note:** shadcn/ui stable targets Tailwind v3. Use the canary branch for Tailwind v4 compatibility. Monitor shadcn releases.

### Expected Features

Research against TripAdvisor, Yelp, Google Maps, Foursquare, and Meetup establishes a clear feature hierarchy. The single biggest differentiator is GPS-verified local authorship — no major competitor requires this. The second differentiator is unified places + events in one city feed; Meetup does events but not places, Yelp does places but events are secondary. Neither does both equally.

See `.planning/research/FEATURES.md` for full prioritization matrix, anti-feature analysis, and competitor table.

**Must have (table stakes):**
- User registration with role assignment (Local / Tourist) — users expect identity and role separation
- City pages with recency-first feed — entry point to discovery; feed-first per PROJECT.md
- Place listings with Local-posted GPS-verified content — core content unit
- Place detail pages aggregating ratings + photos — canonical page per place
- Tourist ratings and reviews (1-5 stars + text) — trust signal; mandatory per competitor baseline
- Photo uploads on places (1-3 photos minimum) — visual trust signal; non-negotiable
- Community event listings with GPS verification — PROJECT.md requirement; equal first-class citizen
- Mobile-responsive web UI — most posting happens on mobile
- HTTPS enforcement — required for Web Geolocation API; not optional

**Should have (competitive differentiators):**
- GPS verification at post time — the defining trust mechanism; mandatory for authenticity
- Behavior-based local role (earned, not declared) — prevents fake locals
- Content category filtering on city feed — navigability once content density grows
- Tourist visit confirmation before rating — reduces review fraud
- Local reputation / post count on public profiles — credibility signal
- City "heartbeat" activity metrics — helps tourists choose which city to trust

**Defer to v2+:**
- Interactive map browse view — feed-first is sufficient; map requires significant infrastructure
- Comment threads on places/events — adds moderation complexity before core loop validated
- Native mobile app — web-first, validate before doubling build cost
- PWA / offline support — adds service worker complexity without validated demand
- Algorithmic recommendations — contradicts core value; cold start impossible

### Architecture Approach

The architecture is a Next.js monolith with a clear service layer: Auth → Role enforcement → GPS/Geo services → Content services → Feed services. All content (places and events) lives in a single `posts` table with a `content_type` discriminator (`place | event`), avoiding the cross-content-type join complexity that breaks city feed pagination. City is a first-class entity with its own table; every piece of content is scoped by `city_id` foreign key. Rating summaries are denormalized into a `rating_summary` table updated on review writes, keeping the hot feed read path aggregate-free. Start with 60-second polling for feed updates rather than WebSockets — real-time is premature until cities have >10 posts/minute.

See `.planning/research/ARCHITECTURE.md` for schema, GPS verification flow, data flow diagrams, and anti-patterns.

**Major components:**
1. **GeoService** — server-side haversine distance check (user coordinates vs. post coordinates); rejects if >200m; sets `verified_at` timestamp on pass
2. **CityResolver** — maps GPS coordinates to a `cities` table record via PostGIS radius query; v1 requires pre-seeded cities (no auto-creation)
3. **ContentService** — post/review CRUD + feed assembly; owns all DB access for content domain; API routes never query DB directly
4. **FeedService** — cursor-based paginated feed query scoped by `city_id`; compound index `(city_id, created_at DESC)` is the hot path from day one
5. **AuthService + RoleGuard** — two-layer role enforcement: route-level middleware (fast reject) + business logic check (data integrity); role is per-city, not global
6. **useGeolocation hook** — browser Geolocation API wrapper; request location only at post submission, not page load; log `coords.accuracy` and reject if >200m

### Critical Pitfalls

Research from well-documented community platform post-mortems identifies the following as the highest-risk failure modes for this specific product:

1. **Cold start death spiral** — launching with empty city pages kills both sides of the two-sided market before network effects form. Prevention: supply-first launch; seed one city to 50+ posts with founder content and recruited local contributors before any tourist-facing marketing. Never launch multi-city simultaneously.

2. **GPS verification theater** — the Web Geolocation API cannot cryptographically prove physical presence. Any browser extension trivially spoofs coordinates. Prevention: tighten the geofence to 100-200m maximum; enforce a 5-minute expiry between location capture and post submission; add velocity checks (rate limit posts per user per day); accept GPS as a friction barrier, not a security guarantee — tourist validation is the primary trust signal.

3. **Self-declared fake locals** — if role is a signup checkbox, users choose "local" for posting rights regardless of where they actually live. Prevention: make local status earned from GPS-verified posting history (3+ posts from a city's area), not a declared attribute. No "local or tourist" dropdown at registration.

4. **Content moderation debt** — every community platform that defers moderation tooling to "after we have users" spends engineering time on reactive cleanup instead of features. Prevention: soft-delete data model (never hard-delete), report button on every post, and a basic admin queue are a 2-3 day investment in Phase 1 that prevents weeks of firefighting.

5. **Per-city role model omission** — storing role as a global flag means a user from Berlin can't be a tourist in Paris and a local in Berlin simultaneously. Prevention: role is per-city (`user_city_roles` table or behavior inferred per city from post history), not a single column on the users table.

---

## Implications for Roadmap

Architecture research identifies a hard dependency chain: Auth + city scope must exist before GPS verification can run; GPS verification must exist before posts can be created; posts must exist before the feed has anything to display; posts must exist before reviews can be written. Events are posts with extra fields — they can be layered on after the core loop works. This dictates 6 phases.

### Phase 1: Foundation (Auth, Roles, Cities)

**Rationale:** Nothing else works without identity, per-city role enforcement, and a city record for every piece of content to belong to. This is the prerequisite for every subsequent phase.
**Delivers:** User registration and login, per-city role model (behavior-based, not declared), cities table with seed data for launch city, role-gating middleware (requireAuth + requireRole), soft-delete data model with status field, basic report mechanism.
**Addresses features:** User registration, city pages (shell), HTTPS enforcement, mobile-responsive layout foundation.
**Avoids pitfalls:** Self-declared fake locals (behavior-based role from the start), per-city role omission (schema must be correct before any users exist), content moderation debt (soft-delete and report button required at data model level), GPS coordinate privacy (API responses must never expose raw lat/lng — enforce from the first route).

### Phase 2: GPS Verification and Post Creation

**Rationale:** The core trust mechanism and content supply. Without GPS-verified posts by locals, the platform has nothing to show tourists and the differentiator doesn't exist.
**Delivers:** GeoService (server-side haversine + accuracy validation), CityResolver (coordinate-to-city mapping), post creation API (role-gated + GPS-gated), useGeolocation hook (browser GPS capture with permission handling), post submission form (max 4 fields), place detail page (basic), photo upload with EXIF stripping.
**Addresses features:** GPS verification at post time, place listings, photo uploads on places, place detail pages.
**Avoids pitfalls:** GPS verification theater (accuracy check, 5-minute expiry, velocity rate limiting built in from day one), GPS coordinate privacy (EXIF stripped at upload, coordinates never in public API payloads), client-side GPS verification anti-pattern (server runs the check, client is UX only).

### Phase 3: City Feed

**Rationale:** The feed is the product surface tourists see. It requires posts to exist (Phase 2 prerequisite). Cursor-based pagination and the `(city_id, created_at DESC)` compound index must be built correctly at creation; retrofitting pagination onto an offset-based query is painful.
**Delivers:** FeedService with cursor-based pagination, city feed page (public, recency-first), category filter on feed, feed polling (60-second interval), city page with seed content visible for launch.
**Addresses features:** City pages with recency feed, content category filtering, mobile-responsive feed UI.
**Avoids pitfalls:** Performance trap of offset pagination (cursor-based from day one), N+1 queries (eager-load author + rating summary in one query), map-first scope creep (feed is the default; no map in this phase).

### Phase 4: Tourist Reviews

**Rationale:** Reviews require places to exist (Phase 2) and place detail pages to exist (Phase 3). The tourist review loop closes the two-sided market: locals supply content, tourists validate it.
**Delivers:** Review model + rating_summary denormalized table, tourist review form (role-gated), star rating display on place detail pages, review aggregation on feed cards.
**Addresses features:** Tourist ratings and reviews, place detail pages (full), local reputation / post history display.
**Avoids pitfalls:** Business owner self-promotion infiltration (tourist review gating: places gain full feed visibility only after 2+ tourist reviews), N+1 queries on rating aggregation (rating_summary denormalization keeps read path clean).

### Phase 5: Community Events

**Rationale:** Events share the posts table infrastructure (Phase 2 prerequisite). Adding `content_type = 'event'` and `starts_at / ends_at` fields is a bounded change. This phase must also address event lifecycle: expiry, auto-archive, and the ghost event problem.
**Delivers:** Event creation (local-only, GPS-verified), event display in city feed with visual distinction from place posts, event filtering tab on city feed, event expiry / auto-hide for past dates (scheduled job or query filter), 60-day future horizon limit on event posting.
**Addresses features:** Community event listings, event expiry / auto-archive, unified place+event content model.
**Avoids pitfalls:** Event spam and ghost events (expiry field and status in data model from Phase 1; cleanup logic delivered here), anti-pattern of bolted-on events (posts table already has `content_type`; this phase adds the event-specific behavior cleanly).

### Phase 6: Discovery and Polish

**Rationale:** Search and map view are valuable once content density makes them necessary. Research confirms these are premature before a city has 50+ listings. This phase is contingent on content volume.
**Delivers:** Full-text search within a city (PostgreSQL `tsvector` or Supabase full-text), static map embed on place detail pages (Leaflet + OpenStreetMap tiles), city "heartbeat" activity metrics, tourist visit confirmation before rating, local reputation on public profiles.
**Addresses features:** Search within city, map view (detail page embed only), city heartbeat, local reputation.
**Avoids pitfalls:** Map-first trap (interactive map browse is still deferred; only a static embed on individual detail pages), Mapbox billing surprise (use Leaflet + free OSM tiles).

### Phase Ordering Rationale

- Auth must precede everything because GPS verification requires knowing who the user is and what role they have.
- GPS verification must precede the feed because the feed has nothing to display until GPS-verified posts exist.
- Reviews must follow posts because reviews require a `post_id` foreign key and place detail pages to exist.
- Events leverage the same post infrastructure built in Phase 2, so they can be added late without architectural risk.
- Search and map are deliberately last because they require content density to provide value, and their absence does not break any other feature.
- The cold start problem is addressed in Phases 1-3: seed content workflow and founding local onboarding must be built alongside the technical foundation, not after it.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2 (GPS Verification):** Web Geolocation API accuracy thresholds and browser behavior vary across devices. Needs hands-on testing with actual mobile hardware before finalizing the accuracy rejection threshold. Also: Supabase PostGIS extension configuration specifics should be verified against current Supabase docs.
- **Phase 5 (Events):** Recurring event model design has no established pattern in the codebase; research needed on the simplest data model that avoids calendar-stuffing without overcomplicating the schema.
- **Phase 6 (Search):** PostgreSQL full-text search vs. Supabase's built-in full-text capabilities — need to verify which is appropriate before implementation. If the platform grows quickly, external search (Typesense, Meilisearch) may be warranted.

Phases with standard patterns (research-phase optional):

- **Phase 1 (Auth + Roles):** Supabase Auth with custom user metadata is a well-documented pattern; Next.js + `@supabase/ssr` integration is documented in official guides.
- **Phase 3 (City Feed):** Cursor-based pagination is a well-established pattern; the compound index strategy is standard PostgreSQL.
- **Phase 4 (Reviews):** Standard review + aggregate pattern; denormalized rating_summary is common in community platforms.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Next.js 16, React 19, Tailwind v4 verified against official docs. Supabase PostGIS support, drizzle-orm PostGIS integration, and shadcn/ui v4 canary compatibility are based on training data — validate before implementation. Key risk: shadcn/ui v4 canary may have breaking changes. |
| Features | MEDIUM | Competitor feature set based on training knowledge through Aug 2025; no live web search. Core table stakes and differentiators are well-established patterns unlikely to have changed. Spotted by Locals (closest concept match) has low coverage — validate their feature set independently. |
| Architecture | MEDIUM | GPS verification flow, cursor pagination, denormalized ratings, and per-city role patterns are HIGH confidence (standard industry patterns). Specific PostGIS query syntax and Supabase Realtime subscription API details are MEDIUM confidence — verify against current docs before implementation. |
| Pitfalls | HIGH | Cold start, GPS spoofing, fake local accounts, and moderation debt are extensively documented failures across Yelp, TripAdvisor, Foursquare, and Meetup. EXIF privacy risk is documented in multiple security disclosures. Performance thresholds (when queries break) are MEDIUM confidence — based on general PostgreSQL knowledge. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **shadcn/ui + Tailwind v4 compatibility:** The shadcn canary branch is the current solution but may have instability. Before Phase 1 scaffolding, run `npx shadcn@canary init` in a test project and verify component output. If canary is too unstable, fall back to Tailwind v3 + stable shadcn.
- **Supabase PostGIS configuration:** Verify PostGIS extension is enabled by default on Supabase free/pro tiers (expected yes, but confirm). Validate `ST_DWithin` with `GEOGRAPHY` type produces correct ellipsoidal distance on a real Supabase instance before the GPS verification phase.
- **Per-city role model — exact schema:** The recommended approach is behavior-inferred local status (3+ GPS-verified posts from a city area = local in that city). The exact schema to track this (`user_city_roles` table vs. computed from `posts` table) needs a design decision at Phase 1 planning. Both are viable; pick one and commit.
- **Geofence radius calibration:** 200m is the recommended default, but the right value depends on the target city's urban density. A GPS accuracy threshold of 200m (reject if `coords.accuracy > 200`) is separate from the geofence radius. Clarify these two values during Phase 2 planning.
- **City seeding strategy:** The cold start strategy requires a plan for who seeds the first city and how. This is a product/go-to-market decision that must be resolved before Phase 3 completes, but is outside the technical scope.

---

## Sources

### Primary (HIGH confidence)
- `https://nextjs.org/docs/app/getting-started/installation` — Next.js 16.1.6 confirmed, Turbopack default, TypeScript 5.1 minimum
- `https://nextjs.org/docs/app/getting-started/cache-components` — PPR / `cacheComponents` / `use cache` directive in Next.js 16
- `https://react.dev/blog/2024/12/05/react-19` — React 19 stable, `useActionState`, `useOptimistic`, Server Actions
- `https://tailwindcss.com/blog/tailwindcss-v4` — Tailwind CSS v4.0 released January 22, 2025, CSS-first config
- W3C Web Geolocation API specification — `coords.accuracy` semantics, HTTPS requirement
- Haversine formula for spherical distance calculation — standard spherical geometry
- Cursor-based pagination — widely documented best practice

### Secondary (MEDIUM confidence)
- Supabase PostGIS support, drizzle-orm 0.39+ PostGIS integration — training data
- shadcn/ui canary Tailwind v4 compatibility — training data (ecosystem gap as of early 2026)
- Community platform architecture patterns (Yelp, Foursquare, Meetup, Nextdoor) — training knowledge
- PostGIS/spatial indexing patterns for radius queries — training knowledge
- Competitor feature sets (TripAdvisor, Yelp, Google Maps, Foursquare, Meetup) — training knowledge through Aug 2025

### Tertiary (LOW confidence)
- Spotted by Locals feature set — smaller platform, limited training coverage; validate independently
- Specific scale thresholds in performance traps — general PostgreSQL knowledge, not platform-specific benchmarks

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
