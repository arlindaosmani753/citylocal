---
phase: 01-foundation
plan: "04"
subsystem: ui
tags: [next-js, react, drizzle-orm, tailwind, vitest, testing-library, date-fns, lucide-react]

# Dependency graph
requires:
  - phase: 01-foundation plan 01-01
    provides: Drizzle schema (profiles, cities tables), DB singleton
  - phase: 01-foundation plan 01-02
    provides: Auth layout (auth route group), Supabase server client
  - phase: 01-foundation plan 01-03
    provides: requireAuth guard, Paris seed data
provides:
  - "/profile/[username] page — public profile with username, display name, home city, member since, 0 contributions"
  - "ProfileHeader component — avatar initials fallback, display name h1, @username, city with MapPin icon, member since date"
  - "ContributionsList component — zero-state (Phase 2 will add real posts)"
  - "AuthLayout — centered card layout for (auth) route group"
  - "/auth/error page — fallback for failed token exchanges"
affects: [02-city-feed, 03-discovery, 04-trust]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async Server Components must not be rendered with react-dom/client in tests — use synchronous components for Phase 1 zero-state UI"
    - "Profile page uses leftJoin to cities — homeCityName is null when no home city set"
    - "ContributionsList is synchronous in Phase 1 — Phase 2 will convert to Server Component with actual post query"
    - "ProfilePage tests use act(async () => render(jsx)) to handle async Server Component parent"

key-files:
  created:
    - src/app/profile/[username]/page.tsx
    - src/components/profile/ProfileHeader.tsx
    - src/components/profile/ContributionsList.tsx
    - src/app/auth/error/page.tsx
  modified:
    - src/app/(auth)/layout.tsx
    - tests/profile/profile-page.test.tsx

key-decisions:
  - "ContributionsList is synchronous in Phase 1 — async RSC not supported by react-dom/client in tests; Phase 2 will refactor with real post query"
  - "ProfileHeader uses CSS initials fallback (div with initials) instead of shadcn Avatar — Avatar component not installed; avoids interactive shadcn CLI"
  - "AuthLayout updated to match plan spec (neutral-50 background, centered content, CityLocal heading)"

patterns-established:
  - "Pattern: Async Next.js Server Component pages can be tested by awaiting the page function then rendering result with act(async () => render(jsx))"
  - "Pattern: Child components that are async must be split from parent page for testability — or kept synchronous in Phase 1"

requirements-completed: [ROLE-04]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 1 Plan 04: Profile Page and Auth Layout Summary

**Public profile page at /profile/[username] with Drizzle JOIN query, ProfileHeader with initials avatar, zero-state ContributionsList, centered auth layout, and /auth/error page — 38 total tests passing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T15:15:18Z
- **Completed:** 2026-03-16T15:18:10Z
- **Tasks:** 1 completed (1 pending checkpoint verification)
- **Files modified:** 6

## Accomplishments
- ProfilePage Server Component queries profiles LEFT JOIN cities by username param, calls notFound() when no row found
- ProfileHeader renders display name as h1, @username, home city with MapPin icon, "Member since" date via date-fns format
- ContributionsList shows zero-state with "0 contributions" — Phase 2 will add the actual post query
- AuthLayout updated to centered full-height card on neutral-50 background with CityLocal brand header
- /auth/error page created for failed OAuth callback redirects

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for profile page** - `d9ab212` (test)
2. **Task 1 GREEN: Public profile page, auth layout, error page** - `60c7892` (feat)

## Files Created/Modified
- `src/app/profile/[username]/page.tsx` - Server Component; queries profiles+cities by username; notFound() on miss; generateMetadata export
- `src/components/profile/ProfileHeader.tsx` - Avatar initials, display name h1, @username, home city with MapPin, member since date
- `src/components/profile/ContributionsList.tsx` - Zero-state "0 contributions" — Phase 2 adds real post query
- `src/app/(auth)/layout.tsx` - Updated to centered layout with neutral-50 background, CityLocal heading
- `src/app/auth/error/page.tsx` - Auth error fallback page with "Back to login" link
- `tests/profile/profile-page.test.tsx` - 4 tests: username renders, city renders, 0 contributions, notFound for unknown user

## Decisions Made
- ContributionsList is synchronous in Phase 1 because React's `react-dom/client` (used in jsdom tests) does not support async client components. The plan spec suggested `async function ContributionsList` but this causes test failures. Phase 2 can keep it synchronous and pass posts from the parent page, or use React cache/Suspense.
- ProfileHeader uses an initials div fallback instead of shadcn Avatar because the Avatar component was not installed. Installing via shadcn CLI requires interactive input in this environment. The CSS implementation provides the same visual outcome.
- AuthLayout was updated from the plan 01-02 version (used shadcn Card) to match the plan 01-04 spec (plain centered div with neutral-50 background).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ContributionsList made synchronous to fix async RSC in jsdom**
- **Found during:** Task 1 GREEN (running tests)
- **Issue:** `async function ContributionsList` causes "async Client Component" error in React DOM — react-dom/client does not support async components in tests
- **Fix:** Removed `async` keyword from ContributionsList. Phase 1 always returns empty array anyway, so there is no data-fetching to defer.
- **Files modified:** `src/components/profile/ContributionsList.tsx`
- **Verification:** All 4 profile tests pass; `npx tsc --noEmit` clean
- **Committed in:** 60c7892

**2. [Rule 2 - Missing Critical] Avatar initials fallback instead of shadcn Avatar**
- **Found during:** Task 1 (ProfileHeader implementation)
- **Issue:** shadcn Avatar component not installed (only button, card, input, label in /ui/); adding via `shadcn add avatar` requires interactive CLI
- **Fix:** Implemented CSS initials fallback div — visually equivalent, zero dependencies
- **Files modified:** `src/components/profile/ProfileHeader.tsx`
- **Verification:** Tests pass; visual output on checkpoint
- **Committed in:** 60c7892

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- React 19 async Server Components cannot be rendered in jsdom via react-dom/client — the vitest environment uses the client renderer, not the RSC renderer. Resolved by making ContributionsList synchronous (Phase 1 always has 0 posts).

## User Setup Required

**Supabase project required to verify the full Phase 1 auth flow.** Before the checkpoint:

1. Create a Supabase project at https://supabase.com
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `DATABASE_URL` (from Supabase project settings > Database > Connection string > URI)
3. Run `npx drizzle-kit push` to apply schema
4. Run `npm run db:seed` to insert Paris city data
5. Run `npm run dev` — server starts at http://localhost:3000

Then verify the 6 flows listed in the checkpoint.

## Next Phase Readiness
- Profile page infrastructure complete — Phase 2 can add real post queries to ContributionsList
- Auth layout ready for all 5 auth pages
- All Phase 1 automated tests passing (38 tests, 7 test files)
- Awaiting: user Supabase setup and manual flow verification (checkpoint Task 2)

---
*Phase: 01-foundation*
*Completed: 2026-03-16*
