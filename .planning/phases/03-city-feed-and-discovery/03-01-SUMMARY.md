---
phase: 03-city-feed-and-discovery
plan: "01"
subsystem: database
tags: [drizzle-orm, postgres, pagination, cursor, feed, cities, tdd, vitest]

requires:
  - phase: 03-00
    provides: test stubs for feed-service and city-search, schema facts for posts/cities/profiles tables

provides:
  - getFeedForCity: compound cursor pagination with category filter and past-event exclusion
  - getPostsForMap: place posts with non-null coordinates, capped at 200
  - getCityBySlug: city row lookup by slug or null
  - searchCitiesByName: case-insensitive ilike match returning up to 10 cities
  - FeedPost, FeedCursor, MapPin exported types from feed.ts
affects:
  - 03-02 (city feed page uses getFeedForCity)
  - 03-03 (map view uses getPostsForMap)
  - 03-04 (city search uses searchCitiesByName and getCityBySlug)

tech-stack:
  added: []
  patterns:
    - Compound cursor pagination (createdAt DESC, id DESC) using lt/eq/or Drizzle operators
    - Category branch: category='event' uses contentType column; place category uses category column
    - Past-event exclusion via or(eq(contentType,'place'), isNull(endsAt), gt(endsAt, sql`NOW()`))
    - Chainable db.select() mock builder pattern (from Phase 2) for unit testing query files

key-files:
  created:
    - src/lib/db/queries/feed.ts
    - src/lib/db/queries/cities.ts
  modified:
    - tests/feed/feed-service.test.ts
    - tests/cities/city-search.test.ts

key-decisions:
  - "getPostsForMap selects only contentType='place' rows with isNotNull(lat) AND isNotNull(lng), capped at 200"
  - "category='event' filter branches on contentType column NOT the category column (category is null for events)"
  - "Compound cursor uses last row of current page — (createdAt < cursor.createdAt) OR (createdAt = cursor.createdAt AND id < cursor.id)"
  - "getFeedForCity fetches limit+1 rows; if len > limit, slices to limit and returns last row as nextCursor"
  - "Past-event exclusion uses or(isPlaceType, endsAt IS NULL, endsAt > NOW()) so places are never excluded"

patterns-established:
  - "Feed pagination: fetch limit+1, slice, last item becomes nextCursor; null when no more rows"
  - "Mock chainable builder: chain each Drizzle method to return self; terminal method (limit) returns resolved value"

requirements-completed: [FEED-01, FEED-02, FEED-03, FEED-04]

duration: 4min
completed: 2026-03-18
---

# Phase 3 Plan 01: FeedService and CityQueries Summary

**Drizzle ORM query layer for city feed pagination (compound cursor), map pins, city slug lookup, and ilike city search — TDD RED/GREEN**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T18:29:47Z
- **Completed:** 2026-03-18T18:33:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Implemented `getFeedForCity` with compound cursor pagination, category filter branching (event vs place), and past-event exclusion via `endsAt > NOW()`
- Implemented `getPostsForMap` returning MapPin[] limited to 200 active place posts with non-null coordinates
- Implemented `getCityBySlug` and `searchCitiesByName` in a new `cities.ts` query file
- Replaced test.todo() stubs with 19 real assertions; all pass after GREEN implementation

## Task Commits

1. **Task 1: RED — Write failing tests** - `38c06b0` (test)
2. **Task 2: GREEN — Implement feed.ts and cities.ts** - `812a131` (feat)

**Plan metadata:** (docs commit — see final commit hash)

_Note: TDD tasks have two commits (test RED → feat GREEN)_

## Files Created/Modified

- `src/lib/db/queries/feed.ts` - FeedPost/FeedCursor/MapPin types; getFeedForCity, getPostsForMap exports
- `src/lib/db/queries/cities.ts` - getCityBySlug, searchCitiesByName exports
- `tests/feed/feed-service.test.ts` - 14 real assertions replacing test.todo() stubs
- `tests/cities/city-search.test.ts` - 5 real assertions replacing test.todo() stubs

## Decisions Made

- `category='event'` filter uses `eq(posts.contentType, 'event')` — the `category` column is null for events; matching on `category` would return nothing
- Past-event exclusion wraps with `or(isPlace, endsAt IS NULL, endsAt > NOW())` so places are never filtered out by the event exclusion
- Compound cursor ordered descending: `lt(createdAt)` means older posts, matching DESC order
- `getPostsForMap` omits the leftJoin to profiles since map pins only need id/title/lat/lng

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- VSCode server file watcher was reverting committed test stub files between Write tool calls and git operations. Resolved by writing files via Bash heredoc and staging immediately in the same command.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `getFeedForCity`, `getPostsForMap`, `getCityBySlug`, `searchCitiesByName` are ready for Phase 3 UI consumption
- FeedPost, FeedCursor, MapPin types exported and stable for 03-02/03-03/03-04 consumers
- Full test suite green (103 passed, 0 failures)

---
*Phase: 03-city-feed-and-discovery*
*Completed: 2026-03-18*
