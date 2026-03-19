---
phase: 03-city-feed-and-discovery
plan: "03"
subsystem: ui
tags: [react, nextjs, server-component, search, tdd]

# Dependency graph
requires:
  - phase: 03-city-feed-and-discovery
    provides: searchCitiesByName query function in src/lib/db/queries/cities.ts

provides:
  - City search page at /cities/search?q= (Server Component)
  - CitySearchForm component with GET form submission
  - searchCitiesByName no longer orphaned — called from UI layer

affects:
  - 03-city-feed-and-discovery (FEED-03 gap closure)
  - Any future phase adding navigation links to city search

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component with Promise<SearchParams> (Next.js 16 pattern)
    - Plain HTML GET form for bookmarkable search (no JS required)
    - Separate test files for query-layer vs UI-layer to avoid vi.mock hoisting conflicts

key-files:
  created:
    - src/app/cities/search/page.tsx
    - src/components/city/CitySearchForm.tsx
    - tests/cities/city-search-page.test.tsx
  modified:
    - tests/cities/city-search.test.ts (reverted extra test block, kept 5 query tests)

key-decisions:
  - "UI tests for CitySearchPage placed in separate file (city-search-page.test.tsx) to prevent vi.mock hoisting conflict with query unit tests that mock @/lib/db directly"
  - "CitySearchForm uses plain HTML GET form — bookmarkable, no JS dependency, aria-label for accessibility"
  - "No single-match redirect on search page — user must click result link (simpler, less surprising)"

patterns-established:
  - "Pattern: Keep query-layer tests and UI-layer tests in separate files when each requires different module mocks"

requirements-completed: [FEED-03]

# Metrics
duration: 6min
completed: 2026-03-18
---

# Phase 3 Plan 03: City Search Page Summary

**City search UI at /cities/search closing the FEED-03 gap — CitySearchForm GET form + Server Component calling the previously-orphaned searchCitiesByName query**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-18T18:07:07Z
- **Completed:** 2026-03-18T18:12:58Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments

- Created `/cities/search` Server Component page that reads `searchParams.q` and renders city results
- Created `CitySearchForm` as a plain GET form — bookmarkable, no JavaScript required
- `searchCitiesByName` is no longer an orphaned function — called from the search page
- All 9 city-search tests pass (5 existing query tests + 4 new UI tests)
- Full suite: 119 tests passing, zero regressions

## Task Commits

1. **Task 1 (RED): Add failing tests for CitySearchPage** - `0805f24` (test)
2. **Task 2 (GREEN): Create CitySearchForm and CitySearchPage** - `5542fc7` (feat)

## Files Created/Modified

- `src/app/cities/search/page.tsx` - Async Server Component, awaits searchParams, calls searchCitiesByName, renders form + results/no-match
- `src/components/city/CitySearchForm.tsx` - Plain HTML GET form with aria-label="Search for a city", no client JS
- `tests/cities/city-search-page.test.tsx` - 4 RTL tests for CitySearchPage render behaviors (mocks cities queries module)
- `tests/cities/city-search.test.ts` - Unchanged (5 existing query tests kept intact)

## Decisions Made

- **Separate test file for UI tests:** `vi.mock('@/lib/db/queries/cities')` is hoisted globally, which conflicts with the existing query tests that mock `@/lib/db` and test real function implementations. Placing UI tests in `city-search-page.test.tsx` isolates the mock scopes.
- **No single-match redirect:** The plan noted this as optional. Kept simple — user sees results and clicks. Avoids unexpected navigation.
- **Plain GET form, no `use client`:** Simpler, bookmarkable URLs, works without JavaScript.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Separated CitySearchPage UI tests into own file**
- **Found during:** Task 1 (RED phase)
- **Issue:** Adding `vi.mock('@/lib/db/queries/cities', ...)` to `city-search.test.ts` is hoisted by Vitest and overrides the real query implementations, causing the 5 existing query tests to fail (they rely on the real `getCityBySlug`/`searchCitiesByName` functions calling through to the mocked `db.select`)
- **Fix:** Placed the 4 new CitySearchPage UI tests in `tests/cities/city-search-page.test.tsx` (TSX for React.createElement support). Original `city-search.test.ts` reverted to clean state with 5 query tests only.
- **Files modified:** tests/cities/city-search-page.test.tsx (created), tests/cities/city-search.test.ts (cleaned)
- **Verification:** Both test files pass (9/9 total); full suite 119/119 green
- **Committed in:** `5542fc7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - test isolation bug)
**Impact on plan:** Necessary for test correctness. Test file naming differs from plan spec but test count (9) and behaviors match exactly.

## Issues Encountered

- JSX in `.ts` file caused Vite parse error — resolved by using `React.createElement` in mock and placing tests in `.tsx` file

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FEED-03 gap closed — city search UI complete
- Phase 3 gap analysis will need re-verification: FEED-03 should now pass
- `src/components/city/` directory established as home for city-scoped components

---
*Phase: 03-city-feed-and-discovery*
*Completed: 2026-03-18*
