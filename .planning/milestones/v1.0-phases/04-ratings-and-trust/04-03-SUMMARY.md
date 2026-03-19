---
phase: 04-ratings-and-trust
plan: "03"
subsystem: ui
tags: [ratings, feed, drizzle, react, vitest]

# Dependency graph
requires:
  - phase: 04-ratings-and-trust/04-02
    provides: RatingBadge component, ratingSummary table in schema
  - phase: 03-city-feed-and-discovery
    provides: getFeedForCity query, FeedPost type, FeedCard component
provides:
  - FeedPost type with avgRating and reviewCount fields
  - getFeedForCity leftJoins ratingSummary so every post carries rating data
  - FeedCard renders RatingBadge — ratings visible on feed cards city-wide
affects:
  - Any component consuming FeedPost (must include avgRating/reviewCount)
  - City feed page (feed cards now show ratings)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - leftJoin ratingSummary in feed query — always read pre-aggregated rating_summary, never AVG() inline
    - FeedPost type extended with nullable rating fields — null when no rating_summary row exists (leftJoin semantics)

key-files:
  created: []
  modified:
    - src/lib/db/queries/feed.ts
    - src/components/feed/FeedCard.tsx
    - tests/ratings/rating-badge.test.tsx
    - tests/feed/feed-service.test.ts
    - tests/feed/city-page.test.tsx

key-decisions:
  - "avgRating is string | null in FeedPost — decimal columns return string in Drizzle ORM"
  - "getFeedForCity reads from ratingSummary via leftJoin, never AVG() inline — pre-aggregated table is single source of truth"

patterns-established:
  - "FeedPost consumers must include avgRating/reviewCount in mock fixtures"

requirements-completed: [RATE-04]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 4 Plan 03: Feed Integration Summary

**FeedPost type extended with avgRating/reviewCount via ratingSummary leftJoin; FeedCard renders RatingBadge — ratings now visible on all city feed cards**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T15:58:39Z
- **Completed:** 2026-03-19T16:02:00Z
- **Tasks:** 2 of 2 (Task 1 auto TDD + Task 2 human-verify checkpoint, approved)
- **Files modified:** 5

## Accomplishments
- Extended `FeedPost` type with `avgRating: string | null` and `reviewCount: number | null`
- Added `ratingSummary` leftJoin in `getFeedForCity` — every feed post now carries rating fields
- Updated `FeedCard` to import and render `RatingBadge` after author/time line
- Activated FeedCard integration tests (replacing test.todo stubs) — 151 tests total, all passing
- Auto-fixed `mockPosts` in `city-page.test.tsx` to include new FeedPost fields (Rule 1 — caused by type change)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: FeedCard rating tests** - `d706cef` (test)
2. **Task 1 GREEN: Feed query + FeedCard implementation** - `26acb9e` (feat)

3. **Task 2: Human verification checkpoint — end-to-end ratings flow** — approved (no code commit)

**Plan metadata:** `70a2c84` (docs: complete feed integration plan)

_Note: TDD task had two commits (test → feat)_

## Files Created/Modified
- `src/lib/db/queries/feed.ts` — imports ratingSummary; FeedPost gains avgRating/reviewCount; getFeedForCity select + leftJoin extended
- `src/components/feed/FeedCard.tsx` — imports RatingBadge; renders `<RatingBadge avgRating={post.avgRating} reviewCount={post.reviewCount} />` after time element
- `tests/ratings/rating-badge.test.tsx` — replaced 2 test.todo stubs with real FeedCard render assertions
- `tests/feed/feed-service.test.ts` — added avgRating/reviewCount defaults to makeFeedPost helper
- `tests/feed/city-page.test.tsx` — added avgRating/reviewCount to mockPosts fixtures (Rule 1 auto-fix)

## Decisions Made
- `avgRating` stored as `string | null` in FeedPost — Drizzle returns decimal columns as strings; passing directly to RatingBadge which expects `string | null`
- `getFeedForCity` reads from `ratingSummary` via leftJoin, never computes AVG() inline — ratingSummary is the pre-aggregated source of truth (established in 04-RESEARCH.md)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mockPosts in city-page.test.tsx missing new FeedPost fields**
- **Found during:** Task 1 (implementation / TypeScript compile check)
- **Issue:** `city-page.test.tsx` mock posts lacked `avgRating` and `reviewCount`; TypeScript error introduced by adding those fields to FeedPost type
- **Fix:** Added `avgRating: null, reviewCount: null` to both mock post objects
- **Files modified:** tests/feed/city-page.test.tsx
- **Verification:** 151 tests pass; TS errors for mockPosts resolved
- **Committed in:** `26acb9e` (Task 1 implementation commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type regression in test fixture)
**Impact on plan:** Necessary correctness fix caused by extending FeedPost type. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `city-page.test.tsx` for `mockCity` fixture (missing `updatedAt`, `deletedAt`, `radiusKm`, `timezone`) — confirmed pre-existing before this plan's changes via `git stash` check. Out of scope per deviation rule scope boundary. Not fixed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full Phase 4 ratings system implemented and verified: schema, server actions, UI components, feed integration
- Human checkpoint (Task 2) approved — end-to-end visual flow confirmed in browser
- RATE-01 through RATE-04 all addressed; 151 tests passing
- Ready to proceed to the next phase

---
*Phase: 04-ratings-and-trust*
*Completed: 2026-03-19*
