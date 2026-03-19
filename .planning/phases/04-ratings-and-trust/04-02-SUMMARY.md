---
phase: 04-ratings-and-trust
plan: "02"
subsystem: ui
tags: [react, lucide-react, rtl, vitest, tailwind, server-actions]

# Dependency graph
requires:
  - phase: 04-01
    provides: getRatingSummary, getReviewsForPost queries; createReview, reportContent server actions; reviews and ratingSummary schema
provides:
  - StarRating component — read-only filled/empty star display via lucide Star icon
  - RatingBadge component — inline avg badge, returns null when no reviews
  - ReviewForm client component — star picker + textarea + createReview action integration
  - ReportButton client component — inline report form calling reportContent action
  - Place detail page with full ratings section (badge, form, review list, report buttons)
  - Event detail page with full ratings section (badge, form, review list, report buttons)
affects:
  - 04-03: FeedCard will extend FeedPost type with avgRating/reviewCount to show RatingBadge in feed

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RatingBadge returns null when reviewCount is falsy — zero-review state invisible in UI"
    - "StarRating uses Array.from + lucide Star icon with className toggling for filled vs empty"
    - "ReviewForm uses useState + async call (same pattern as RsvpButton) not useActionState"
    - "ReportButton toggles inline form; posts success state replaces the button entirely"
    - "Detail pages call getRatingSummary + getReviewsForPost in Promise.all for parallel fetch"
    - "Detail page tests mock @/lib/db/queries/ratings to avoid real DB calls"

key-files:
  created:
    - src/components/ratings/StarRating.tsx
    - src/components/ratings/RatingBadge.tsx
    - src/components/ratings/ReviewForm.tsx
    - src/components/ratings/ReportButton.tsx
  modified:
    - src/app/places/[id]/page.tsx
    - src/app/events/[id]/page.tsx
    - tests/ratings/rating-badge.test.tsx
    - tests/posts/place-detail.test.tsx
    - tests/posts/event-detail.test.tsx

key-decisions:
  - "ReviewForm uses useState + manual async call matching RsvpButton pattern — not useActionState — for consistency"
  - "FeedCard rating tests kept as test.todo() because FeedPost type does not include avgRating yet (plan 04-03)"
  - "Detail page tests mock @/lib/db/queries/ratings — getRatingSummary and getReviewsForPost returning empty defaults"

patterns-established:
  - "Ratings section pattern: RatingBadge + ReportButton (post) → ReviewForm → review list (StarRating per review + ReportButton per review)"

requirements-completed: [RATE-01, RATE-02, RATE-03, RATE-04]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 4 Plan 02: Rating UI Components Summary

**Four rating UI components (StarRating, RatingBadge, ReviewForm, ReportButton) wired into place and event detail pages with RTL tests passing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-19T14:50:00Z
- **Completed:** 2026-03-19T14:55:44Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- StarRating and RatingBadge components with 8 RTL tests passing (TDD)
- ReviewForm client component with star picker, textarea, and createReview integration
- ReportButton client component with inline reason select and reportContent integration
- Both place and event detail pages fully wired with ratings section

## Task Commits

Each task was committed atomically:

1. **Task 1: Rating display components — StarRating and RatingBadge** - `4482927` (feat)
2. **Task 2: ReviewForm, ReportButton, and detail page wiring** - `2befd55` (feat)

**Plan metadata:** (docs commit below)

_Note: Task 1 was TDD (RED → GREEN). Task 2 included auto-fix for breaking tests._

## Files Created/Modified
- `src/components/ratings/StarRating.tsx` - Read-only star display using lucide Star icon
- `src/components/ratings/RatingBadge.tsx` - Inline avg badge, null when no reviews
- `src/components/ratings/ReviewForm.tsx` - Client component: star picker + textarea + createReview action
- `src/components/ratings/ReportButton.tsx` - Client component: toggleable inline report form
- `src/app/places/[id]/page.tsx` - Extended with full ratings section
- `src/app/events/[id]/page.tsx` - Extended with full ratings section
- `tests/ratings/rating-badge.test.tsx` - Real RTL assertions replacing test.todo() stubs
- `tests/posts/place-detail.test.tsx` - Added ratings mock
- `tests/posts/event-detail.test.tsx` - Added ratings mock

## Decisions Made
- ReviewForm uses `useState` + manual async call (matching RsvpButton pattern) rather than `useActionState` for consistency across client components
- FeedCard rating stubs remain as `test.todo()` since FeedPost type does not yet include avgRating/reviewCount fields — these are added in plan 04-03
- Detail page tests mock `@/lib/db/queries/ratings` to return empty defaults so they do not require a database connection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added ratings mock to place-detail and event-detail tests**
- **Found during:** Task 2 (detail page wiring)
- **Issue:** After PlacePage and EventPage began calling getRatingSummary/getReviewsForPost, existing tests failed with ECONNREFUSED because the DB queries were not mocked
- **Fix:** Added `vi.mock('@/lib/db/queries/ratings', ...)` returning empty defaults to both test files
- **Files modified:** tests/posts/place-detail.test.tsx, tests/posts/event-detail.test.tsx
- **Verification:** Both test files now pass (8 tests total); full suite 149 passing
- **Committed in:** 2befd55 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug: missing test mock)
**Impact on plan:** Essential for test correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed test mocks above.

## Next Phase Readiness
- All four rating components exist and are tested
- Detail pages fully wire the trust surface
- Plan 04-03 can extend FeedPost with avgRating/reviewCount and remove the two test.todo() stubs in rating-badge.test.tsx

---
*Phase: 04-ratings-and-trust*
*Completed: 2026-03-19*
