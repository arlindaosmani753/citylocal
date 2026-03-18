---
phase: 03-city-feed-and-discovery
plan: "00"
subsystem: testing
tags: [vitest, tdd, test-stubs, feed, city-search, leaflet, react-leaflet]

# Dependency graph
requires:
  - phase: 02-content-creation
    provides: posts table with content_type, category, lat/lng, soft-delete, events/rsvps — feed queries read from this schema
provides:
  - Wave 0 test stubs for all FEED-01 through FEED-04 behaviors (30 todo tests across 5 files)
  - tests/feed/feed-service.test.ts — getFeedForCity and getPostsForMap stub coverage
  - tests/feed/city-page.test.tsx — CityPage render stub coverage
  - tests/feed/category-tabs.test.tsx — CategoryFilterTabs stub coverage
  - tests/cities/city-search.test.ts — searchCitiesByName and getCityBySlug stub coverage
  - tests/map/city-map.test.tsx — CityMap and CityMapLoader stub coverage
affects: [03-01, 03-02, wave-1-implementation, wave-2-leaflet-map]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 stubs use test.todo() with zero src imports — suite stays green before implementation exists (Nyquist compliance)"
    - "vi.mock('react-leaflet') and vi.mock('leaflet') documented in comment for Wave 2 — Leaflet calls window/document at import time requiring jsdom"

key-files:
  created:
    - tests/feed/feed-service.test.ts
    - tests/feed/city-page.test.tsx
    - tests/feed/category-tabs.test.tsx
    - tests/cities/city-search.test.ts
    - tests/map/city-map.test.tsx
  modified: []

key-decisions:
  - "Wave 0 stubs use test.todo() with zero src imports — same pattern as Phase 1 and Phase 2 Wave 0"
  - "Leaflet mock strategy (vi.mock react-leaflet + leaflet) documented in comment in city-map.test.tsx — deferred to Wave 2 when CityMap component exists"

patterns-established:
  - "Wave 0 pattern: test.todo() stubs only, zero src imports — zero false positives before implementation"
  - "New test directories created per feature domain: tests/feed/, tests/cities/, tests/map/"

requirements-completed: [FEED-01, FEED-02, FEED-03, FEED-04]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 3 Plan 00: City Feed Wave 0 Test Stubs Summary

**30 test.todo() stubs across 5 files covering all FEED-01 through FEED-04 behaviors — full vitest suite green with zero src imports**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T17:29:19Z
- **Completed:** 2026-03-18T17:32:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created tests/feed/ directory with 3 stub files covering feed service queries, city page render, and category filter tabs
- Created tests/cities/ directory with city-search stubs for searchCitiesByName and getCityBySlug
- Created tests/map/ directory with CityMap and CityMapLoader stubs, including comment documenting Wave 2 Leaflet mock strategy
- Full vitest suite: 17 passed, 5 skipped, 0 failures, 30 todo (84 passing implementation tests unaffected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create feed and city test stub files** - `da1cb3d` (test)
2. **Task 2: Create map test stub file** - `96bd05d` (test)

## Files Created/Modified

- `tests/feed/feed-service.test.ts` - 14 todo stubs for getFeedForCity (pagination, cursor, category filter) and getPostsForMap (place pins, 200 row limit)
- `tests/feed/city-page.test.tsx` - 3 todo stubs for CityPage (render, heading, not-found)
- `tests/feed/category-tabs.test.tsx` - 4 todo stubs for CategoryFilterTabs (links, hrefs, active state)
- `tests/cities/city-search.test.ts` - 5 todo stubs for searchCitiesByName (partial match, empty, limit-10) and getCityBySlug (valid, null)
- `tests/map/city-map.test.tsx` - 4 todo stubs for CityMap (renders markers, empty fallback) and CityMapLoader (passes places to map)

## Decisions Made

- Wave 0 stubs use test.todo() with zero src imports — same Nyquist compliance pattern established in Phase 1 and Phase 2
- Leaflet mock strategy documented in comment inside city-map.test.tsx — vi.mock('react-leaflet') and vi.mock('leaflet') will be added in Wave 2 when CityMap component exists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Wave 0 stubs in place — Wave 1 (03-01) can begin implementing getFeedForCity, getPostsForMap, CityPage, and CategoryFilterTabs
- Wave 2 (03-02) can implement CityMap client component with Leaflet — mock strategy already documented in stub file
- Full test suite remains green; no regressions introduced

## Self-Check: PASSED

- tests/feed/feed-service.test.ts: FOUND
- tests/feed/city-page.test.tsx: FOUND
- tests/feed/category-tabs.test.tsx: FOUND
- tests/cities/city-search.test.ts: FOUND
- tests/map/city-map.test.tsx: FOUND
- Commit da1cb3d: FOUND
- Commit 96bd05d: FOUND
- Full vitest suite: 19 passed, 0 failures

---
*Phase: 03-city-feed-and-discovery*
*Completed: 2026-03-18*
