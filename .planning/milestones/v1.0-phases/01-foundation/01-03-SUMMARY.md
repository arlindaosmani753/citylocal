---
phase: 01-foundation
plan: "03"
subsystem: database
tags: [drizzle-orm, postgres, supabase, vitest, typescript, roles, guards, seed]

# Dependency graph
requires:
  - phase: 01-foundation plan 01-01
    provides: Drizzle schema (userCityRoles, cities tables), DB singleton, Supabase server client
provides:
  - isUserLocalInCity(userId, cityId): Promise<boolean> — queries user_city_roles.isLocal via Drizzle
  - getUserCityRole(userId, cityId): Promise<UserCityRole | null> — full role record for Phase 2 GPS verification
  - requireAuth() — server-side auth guard using getUser() (not getSession()), redirects to /login
  - requireLocalInCity(cityId) — composes requireAuth + isUserLocalInCity, redirects to / if not local
  - Paris seed data script (idempotent, onConflictDoNothing) with correct slug/coords/timezone
affects: [01-02, 01-04, 02-foundation, 03-city-feed]

# Tech tracking
tech-stack:
  added:
    - tsx@4.21.0
  patterns:
    - "isUserLocalInCity is the ONLY correct way to check local status — no global role column on profiles"
    - "requireAuth uses getUser() not getSession() — validates JWT against Supabase servers each call"
    - "requireLocalInCity composes requireAuth + isUserLocalInCity for two-layer guard"
    - "Seed scripts use onConflictDoNothing for idempotency — safe to run in CI or on fresh DB"
    - "TDD: vi.mock('@/lib/db') to stub drizzle select chain without a real DB connection"

key-files:
  created:
    - src/lib/db/queries/roles.ts
    - src/lib/guards.ts
    - src/lib/db/seed.ts
  modified:
    - tests/roles/city-role.test.ts
    - package.json

key-decisions:
  - "isUserLocalInCity reads isLocal boolean from user_city_roles — never derives local status from verifiedPostCount directly"
  - "requireAuth uses getUser() not getSession() to validate JWT server-side per Supabase best practice"
  - "Paris seed slug is paris-france matching Phase 3 URL pattern /cities/paris-france"

patterns-established:
  - "Pattern: Mock drizzle select chain with vi.mock('@/lib/db') — chain is from().where().limit() resolving to array"
  - "Pattern: Guard functions (requireAuth, requireLocalInCity) redirect via next/navigation redirect() — never return null"

requirements-completed: [ROLE-02, ROLE-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 1 Plan 03: Role Queries and Guards Summary

**Per-city local role query (isUserLocalInCity), server-side auth guards (requireAuth/requireLocalInCity), and idempotent Paris seed script — 6 tests passing via mocked Drizzle chain**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T15:05:23Z
- **Completed:** 2026-03-16T15:08:09Z
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments
- isUserLocalInCity() queries user_city_roles.isLocal — returns false if no row or isLocal=false, true only when row exists and isLocal=true
- getUserCityRole() returns full record (isLocal, verifiedPostCount, localSince) for Phase 2 GPS verification to consume
- requireAuth() uses getUser() (never getSession()), redirects to /login for null/error users — ready for Server Components and Actions
- requireLocalInCity() two-layer guard: auth check then city-local check
- Paris seed script idempotent with onConflictDoNothing, correct coordinates (48.8566, 2.3522), radiusKm 25, slug paris-france
- 6 city-role tests passing via vi.mock drizzle select chain (TDD RED → GREEN)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for isUserLocalInCity and getUserCityRole** - `f5654ed` (test)
2. **Task 1 GREEN: Implement role queries and server-side auth guards** - `a9e5702` (feat)
3. **Task 2: Paris seed data script and db:seed command** - `e7419b6` (feat)

## Files Created/Modified
- `src/lib/db/queries/roles.ts` - isUserLocalInCity() and getUserCityRole() using Drizzle select from userCityRoles
- `src/lib/guards.ts` - requireAuth() and requireLocalInCity() server-side guards
- `src/lib/db/seed.ts` - Idempotent Paris city seed (onConflictDoNothing on slug column)
- `tests/roles/city-role.test.ts` - 6 tests using vi.mock('@/lib/db') to stub drizzle select chain
- `package.json` - Added db:seed script, tsx dev dependency

## Decisions Made
- isUserLocalInCity reads the isLocal column directly — it does not derive local status from verifiedPostCount. The threshold logic (3 posts = local) will be in Phase 2 GPS verification, which sets isLocal=true.
- requireAuth uses getUser() per Supabase docs — getSession() only reads from cookie without network validation, which is insecure for server-side guards.
- Paris slug is paris-france matching the planned Phase 3 URL pattern /cities/paris-france.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
Pre-existing TypeScript errors in tests/middleware.test.ts (imports `@/middleware` which is created by plan 01-02, running in parallel). These errors exist before and after this plan — not caused by 01-03 changes. Verified by checking `npx tsc --noEmit` output: zero errors in roles.ts or guards.ts.

## User Setup Required
None - no external service configuration required for this plan. Paris seed data requires a live DATABASE_URL to run (`npm run db:seed`), documented in existing .env.local.example.

## Next Phase Readiness
- Role query infrastructure complete — Phase 2 GPS verification can call getUserCityRole() to increment verifiedPostCount and set isLocal=true
- requireAuth() and requireLocalInCity() ready for use in all Phase 2+ Server Components and Actions
- Paris city row will be present in DB once user runs `npm run db:seed` against Supabase

---
*Phase: 01-foundation*
*Completed: 2026-03-16*
