---
phase: 03-city-feed-and-discovery
plan: "04"
subsystem: ui
tags: [react-leaflet, leaflet, map, next-dynamic, ssr, client-component, server-component]

# Dependency graph
requires:
  - phase: 03-city-feed-and-discovery
    provides: getPostsForMap query returning MapPin[] from posts with lat/lng

provides:
  - CityMap client component rendering react-leaflet MapContainer with place markers
  - CityMapLoader server component fetching MapPin[] and dynamically importing CityMap (ssr:false)
  - Interactive map on city page replacing map-placeholder div

affects:
  - 03-city-feed-and-discovery
  - any future phase adding map interaction (clustering, filters on map)

# Tech tracking
tech-stack:
  added: [leaflet@1.9.4, react-leaflet@5.0.0, "@types/leaflet@1.9.21"]
  patterns:
    - "Server Component calls data, passes via next/dynamic to Client Component — isolates Leaflet from SSR"
    - "Marker icon fix: copy PNG from node_modules/leaflet/dist/images to public/, use L.Icon constructor"
    - "Test strategy: vi.mock react-leaflet with div stubs, vi.mock leaflet with constructor function (not arrow fn)"

key-files:
  created:
    - src/components/map/CityMap.tsx
    - src/components/map/CityMapLoader.tsx
    - public/marker-icon.png
    - public/marker-shadow.png
  modified:
    - src/app/cities/[slug]/page.tsx
    - tests/map/city-map.test.tsx
    - tests/feed/city-page.test.tsx

key-decisions:
  - "L.Icon mock must use constructor function (function Icon() {}) not arrow fn — vi.fn().mockImplementation(() => ({})) is not a constructor"
  - "city-page.test.tsx must mock getPostsForMap alongside getFeedForCity — CityMapLoader renders inside Suspense and calls getPostsForMap"
  - "react-leaflet v5 + React 19.2.3 compatible — no version pinning needed"

patterns-established:
  - "Pattern: When mocking classes/constructors with vi.mock, use `function Ctor() {}` syntax not arrow functions"
  - "Pattern: When a Server Component is added to a page, add all its data queries to existing page-level test mocks"

requirements-completed: [FEED-04]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 3 Plan 04: Interactive City Map Summary

**react-leaflet map component stack with SSR isolation — CityMap + CityMapLoader close FEED-04 gap, place markers render on city page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T19:07:59Z
- **Completed:** 2026-03-18T18:10:54Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 7

## Accomplishments

- Created CityMap.tsx: react-leaflet client component with L.Icon markers for each MapPin, Paris fallback center
- Created CityMapLoader.tsx: async server component calling getPostsForMap, dynamically importing CityMap with ssr:false
- Replaced map-placeholder div in CityPage with Suspense + CityMapLoader — FEED-04 gap closed
- All 4 map tests pass, full suite 119/119 green (23 test files)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Install leaflet, copy marker assets, write failing map tests** - `59a2942` (test)
2. **Task 2: GREEN — Create CityMap, CityMapLoader, wire into CityPage** - `08b435c` (feat)

_Note: TDD tasks have two commits (test RED → feat GREEN)_

## Files Created/Modified

- `src/components/map/CityMap.tsx` - react-leaflet client component with MapContainer, TileLayer, Marker/Popup per place
- `src/components/map/CityMapLoader.tsx` - async server component fetching MapPin[], dynamic import CityMap ssr:false
- `src/app/cities/[slug]/page.tsx` - replaced map-placeholder div with Suspense + CityMapLoader
- `public/marker-icon.png` - Leaflet default marker icon (copied from node_modules)
- `public/marker-shadow.png` - Leaflet default marker shadow (copied from node_modules)
- `tests/map/city-map.test.tsx` - replaced 4 test.todo() stubs with real assertions
- `tests/feed/city-page.test.tsx` - added getPostsForMap mock to prevent timeout

## Decisions Made

- L.Icon constructor mock must use `function Icon() {}` not arrow function — Vitest reports arrow fns as not constructors
- city-page.test.tsx mock for `@/lib/db/queries/feed` needed `getPostsForMap` added alongside `getFeedForCity`; without it the Suspense-wrapped CityMapLoader hangs on the real DB call

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed L.Icon mock — arrow function is not a constructor**
- **Found during:** Task 2 (GREEN — running map tests)
- **Issue:** Plan specified `vi.fn().mockImplementation(() => ({}))` for L.Icon mock, but `new L.Icon(...)` requires a constructable function; arrow functions cannot be called with `new`
- **Fix:** Changed mock to `function Icon() { return {} }` — a regular function that can be used as constructor
- **Files modified:** tests/map/city-map.test.tsx
- **Verification:** All 4 map tests pass after fix
- **Committed in:** 08b435c (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added getPostsForMap to city-page mock**
- **Found during:** Task 2 (full suite run revealed 2 timeout failures in city-page.test.tsx)
- **Issue:** CityPage now renders CityMapLoader inside Suspense; CityMapLoader calls getPostsForMap; city-page test only mocked getFeedForCity, causing the async component to hang (5s timeout)
- **Fix:** Added `getPostsForMap: vi.fn().mockResolvedValue([])` to the feed module mock in city-page.test.tsx
- **Files modified:** tests/feed/city-page.test.tsx
- **Verification:** All 3 city-page tests pass, no timeout
- **Committed in:** 08b435c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug in mock, 1 missing mock)
**Impact on plan:** Both fixes necessary for test correctness. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FEED-04 gap fully closed — interactive map renders on city pages with place pins
- Phase 3 verification should now pass all 5 items (FEED-01 through FEED-04 + search)
- Phase 4 (if any) can build on the CityMap/CityMapLoader pattern for map interactions

---
*Phase: 03-city-feed-and-discovery*
*Completed: 2026-03-18*
