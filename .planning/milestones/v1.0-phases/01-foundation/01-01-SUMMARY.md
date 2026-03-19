---
phase: 01-foundation
plan: "01"
subsystem: database
tags: [nextjs, drizzle-orm, postgres, supabase, tailwind, shadcn, vitest, typescript, zod]

# Dependency graph
requires: []
provides:
  - Next.js 16 app scaffold with TypeScript, Tailwind v4, ESLint, App Router, Turbopack
  - shadcn/ui (base-nova style, CSS variables in globals.css, tw-animate-css)
  - Drizzle ORM schema: cities, profiles, userCityRoles, posts, reports tables with soft-delete, enums, indexes
  - Drizzle DB singleton (postgres-js driver, prepare:false for Supabase transaction pooler)
  - Supabase browser client (createBrowserClient wrapper)
  - Supabase server client (async createServerClient with cookie getAll/setAll)
  - @t3-oss/env-nextjs env validation for DATABASE_URL, SUPABASE_URL, PUBLISHABLE_KEY, SITE_URL
  - drizzle.config.ts pointing to schema.ts, output to supabase/migrations
  - .env.local.example documenting all required environment variables
  - Vitest test suite with 4 passing schema assertions
affects: [01-02, 01-03, 01-04, 02-foundation]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - drizzle-orm@0.45.1
    - postgres@3.4.8
    - "@supabase/supabase-js@2.99.2"
    - "@supabase/ssr@0.9.0"
    - zod@4.3.6
    - react-hook-form@7.71.2
    - "@hookform/resolvers@5.2.2"
    - lucide-react@0.577.0
    - date-fns@4.1.0
    - "@t3-oss/env-nextjs@0.13.10"
    - drizzle-kit@0.31.9
    - vitest@4.1.0
    - "@vitejs/plugin-react@6.0.1"
    - jsdom@29.0.0
    - "@testing-library/react@16.3.2"
    - vite-tsconfig-paths@6.1.1
    - tw-animate-css@1.4.0
    - shadcn@4.0.8
    - tailwindcss@4.x
  patterns:
    - "Drizzle singleton with postgres-js, prepare:false for Supabase transaction pooler"
    - "Three-client Supabase architecture: browser client, server client (async cookies), middleware (future)"
    - "Shared timestamps helper spread across all content tables (createdAt, updatedAt, deletedAt)"
    - "Soft-delete: deletedAt nullable timestamp, never hard DELETE"
    - "pgEnum for contentStatus, reportReason, contentType — enforced at DB level"
    - "Compound indexes for feed performance: posts_city_created_idx on (cityId, createdAt)"
    - "uniqueIndex on userCityRoles(userId, cityId) — enforces one role record per user per city"
    - "@t3-oss/env-nextjs for build-time env validation"

key-files:
  created:
    - src/lib/db/schema.ts
    - src/lib/db/index.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/env.ts
    - drizzle.config.ts
    - .env.local.example
    - tests/db/schema.test.ts
    - package.json
    - tsconfig.json
    - next.config.ts
    - components.json
  modified:
    - src/app/globals.css

key-decisions:
  - "shadcn/ui v4 API uses --defaults flag; --style flag removed; base-nova preset is the new-york equivalent"
  - "Drizzle table index builder uses array syntax (v0.45+): (table) => [index(...), uniqueIndex(...)]"
  - "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY used (not ANON_KEY) matching current Supabase dashboard naming"

patterns-established:
  - "Pattern: Drizzle postgres-js client with prepare:false for Supabase transaction pooler"
  - "Pattern: Supabase server client must be async due to Next.js 15+/16 async cookies()"
  - "Pattern: All content tables spread ...timestamps for consistent soft-delete support"
  - "Pattern: TDD — write failing test, implement, verify green, commit"

requirements-completed: [AUTH-04]

# Metrics
duration: 7min
completed: 2026-03-16
---

# Phase 1 Plan 01: Bootstrap Summary

**Next.js 16 app scaffolded with Drizzle ORM schema (5 tables: cities, profiles, userCityRoles, posts, reports), Supabase SSR clients, and @t3-oss/env-nextjs validation — all schema tests passing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-16T14:54:58Z
- **Completed:** 2026-03-16T16:01:35Z
- **Tasks:** 2 completed
- **Files modified:** 15

## Accomplishments
- Next.js 16 app scaffolded from scratch with TypeScript, Tailwind v4, ESLint, App Router, Turbopack in root directory
- All Phase 1 runtime and dev dependencies installed (drizzle-orm, @supabase/ssr, zod, vitest, etc.)
- shadcn/ui initialized with base-nova style (new-york equivalent), CSS variables, tw-animate-css
- Complete Drizzle schema for all 5 Phase 1 tables with soft-delete, compound indexes, enums
- Both Supabase client utilities implemented (browser + async server)
- @t3-oss/env-nextjs env validation with build-time catching
- 4 schema tests passing (TDD flow: RED → GREEN)
- TypeScript type check passes with zero errors
- Next.js build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 app and install all Phase 1 dependencies** - `2f0e866` (feat)
2. **Task 2 RED: Failing schema tests** - `5a1f246` (test)
3. **Task 2 GREEN: Schema, DB client, Supabase clients, env validation** - `49bda61` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - All 5 Drizzle tables with soft-delete, enums, compound indexes
- `src/lib/db/index.ts` - Drizzle singleton with postgres-js, prepare:false
- `src/lib/supabase/client.ts` - createBrowserClient wrapper
- `src/lib/supabase/server.ts` - async createServerClient with cookie handlers
- `src/lib/env.ts` - @t3-oss/env-nextjs validated env vars
- `drizzle.config.ts` - Points to schema.ts, output to supabase/migrations
- `.env.local.example` - Documents all required env vars
- `tests/db/schema.test.ts` - 4 schema assertions (all passing)
- `package.json` - All dependencies + test/test:watch scripts
- `src/app/globals.css` - shadcn CSS variables, tw-animate-css import

## Decisions Made
- **shadcn/ui v4 API change**: The `--style` flag was removed in shadcn v4. Used `--defaults` flag instead. The `base-nova` preset is the new equivalent of `new-york` style.
- **Drizzle array index syntax**: v0.45+ uses array syntax for table indexes: `(table) => [index(...)]` instead of object syntax `(table) => ({...})`. Used array syntax throughout.
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: Used current Supabase naming convention (not legacy ANON_KEY).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn/ui `--style` flag removed in v4 API**
- **Found during:** Task 1 (shadcn/ui initialization)
- **Issue:** `npx shadcn@latest init --style new-york` failed with "unknown option '--style'" — the API changed in shadcn v4
- **Fix:** Used `--defaults` flag which selects the recommended preset (base-nova = new-york equivalent in v4)
- **Files modified:** components.json, src/app/globals.css, src/components/ui/button.tsx, src/lib/utils.ts
- **Verification:** globals.css has CSS variables, tw-animate-css import, shadcn CSS variables — correct
- **Committed in:** 2f0e866 (Task 1 commit)

**2. [Rule 3 - Blocking] create-next-app refused to scaffold in non-empty directory**
- **Found during:** Task 1 (Next.js scaffolding)
- **Issue:** `/root` already had CLAUDE.md, tests/, vitest.config.ts — create-next-app refuses non-empty dirs
- **Fix:** Scaffolded in /tmp/citylocal, then copied config files, src/app, and node_modules to /root
- **Files modified:** All scaffold files (package.json, tsconfig.json, next.config.ts, etc.)
- **Verification:** npm run build completes successfully
- **Committed in:** 2f0e866 (Task 1 commit)

**3. [Rule 3 - Blocking] Drizzle index builder API changed from object to array syntax**
- **Found during:** Task 2 (schema creation)
- **Issue:** Drizzle v0.45+ uses array syntax for indexes: `(table) => [...]` not `(table) => ({...})`
- **Fix:** Used array syntax for all index definitions in posts, userCityRoles, reports tables
- **Files modified:** src/lib/db/schema.ts
- **Verification:** TypeScript type check passes, schema tests pass
- **Committed in:** 49bda61 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking API changes)
**Impact on plan:** All auto-fixes necessary due to library version API changes. Functionally equivalent to plan spec. No scope creep.

## Issues Encountered
None beyond the API changes documented above.

## User Setup Required
**External services require manual configuration.** See `.env.local.example` for required variables:
- Copy `.env.local.example` to `.env.local`
- Fill in Supabase project URL, publishable key, and database connection URL from your Supabase dashboard
- Run `npx drizzle-kit push` to apply the schema to your Supabase database (requires DATABASE_URL)

## Next Phase Readiness
- Next.js 16 app scaffold complete — ready for auth pages (01-02)
- Drizzle schema ready to push to Supabase once DATABASE_URL is provided
- Supabase client utilities ready for use in Server Components and Client Components
- Env validation will catch missing variables at build time
- vitest infrastructure in place for subsequent TDD tasks

---
*Phase: 01-foundation*
*Completed: 2026-03-16*
