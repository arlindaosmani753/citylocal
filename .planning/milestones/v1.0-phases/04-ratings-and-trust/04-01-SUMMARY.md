---
phase: 04-ratings-and-trust
plan: "01"
subsystem: database
tags: [drizzle, postgres, server-actions, vitest, tdd, ratings, reviews, reports]

# Dependency graph
requires:
  - phase: 04-00
    provides: Wave 0 test stubs for ratings/reports, research decisions
  - phase: 02-content-creation
    provides: posts, reports, profiles tables in schema.ts
  - phase: 01-foundation
    provides: requireAuth, db connection, base schema

provides:
  - reviews table with uniqueIndex enforcing one review per user per post
  - ratingSummary table as transactional write-through cache
  - createReview Server Action with Zod validation and transactional upsert
  - deleteReview Server Action with soft-delete and recalculation
  - reportContent Server Action with status guard and flagCount increment
  - getReviewsForPost query returning ReviewRow[] with author join
  - getRatingSummary query returning nullable avgRating and reviewCount

affects:
  - 04-02 (RatingBadge component reads from ratingSummary via getRatingSummary)
  - 04-03 (ReportButton uses reportContent action)
  - Any future phase that displays reviews or trust signals

# Tech tracking
tech-stack:
  added: []
  patterns:
    - transactional write-through: createReview and deleteReview both call recalculateSummary inside db.transaction to keep ratingSummary in sync
    - onConflictDoUpdate upsert pattern for rating_summary keyed on postId
    - PgTransaction type import from drizzle-orm/pg-core for typed helper functions
    - vi mock chaining: mockTx.where.mockReturnValue(mockTx) for select chains, mockTx.where.mockResolvedValue for final awaited calls
    - Soft-delete pattern: deletedAt=now + status='hidden' in same tx as recalculation

key-files:
  created:
    - src/actions/reviews.ts
    - src/lib/db/queries/ratings.ts
    - tests/ratings/create-review.test.ts
    - tests/ratings/report.test.ts
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "PgTransaction type from drizzle-orm/pg-core used for typed tx helper — PostgresJsTransaction alias does not satisfy constraint"
  - "recalculateSummary helper is private (not exported) — called only inside transactions by createReview and deleteReview"
  - "Test mock pattern: where returns mockTx for chaining select/where/limit; where resolves directly for update/where end-of-chain"
  - "Test (vi.mocked(db.transaction).mockImplementation as any) cast avoids PgTransaction type mismatch in test files"

patterns-established:
  - "recalculateSummary(tx, postId): reusable transactional helper that aggregates and upserts ratingSummary"
  - "Error sentinel pattern: throw Error('SENTINEL') inside transaction, catch by message string outside"

requirements-completed: [RATE-01, RATE-02, RATE-03, RATE-04]

# Metrics
duration: 9min
completed: 2026-03-18
---

# Phase 4 Plan 01: Ratings Data Layer Summary

**Drizzle reviews + ratingSummary schema tables, createReview/deleteReview/reportContent Server Actions with transactional write-through, getRatingSummary/getReviewsForPost queries — 22 new tests green**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-18T19:00:52Z
- **Completed:** 2026-03-18T19:09:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added reviews table (uniqueIndex reviews_post_author_unique, contentStatusEnum, flagCount) and ratingSummary table (write-through cache, decimal avgRating) to schema.ts
- Implemented createReview with Zod validation (stars 1-5, body max 2000), transactional insert + ratingSummary upsert via recalculateSummary helper
- Implemented deleteReview with ownership check, soft-delete (deletedAt + status=hidden), recalculation in same transaction
- Implemented reportContent with status guard (returns error if not active), reports insert, flagCount increment on post or review target
- getReviewsForPost with leftJoin on profiles for authorUsername, filtered and sorted
- getRatingSummary returning null-safe {avgRating, reviewCount}
- 22 tests pass (create-review.test.ts + report.test.ts), full suite 141 passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema additions — reviews and ratingSummary tables** - `5b3e6ca` (feat)
2. **Task 2 RED: Failing tests for createReview, deleteReview, reportContent** - `1ec2c94` (test)
3. **Task 2 GREEN: createReview, deleteReview, reportContent actions + ratings queries** - `33761fa` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD tasks have multiple commits (test → feat)_

## Files Created/Modified
- `src/lib/db/schema.ts` - Added reviews table (uniqueIndex, contentStatusEnum, flagCount, timestamps) and ratingSummary table (decimal avgRating, reviewCount, updatedAt)
- `src/actions/reviews.ts` - createReview, deleteReview, reportContent Server Actions with 'use server' directive
- `src/lib/db/queries/ratings.ts` - getReviewsForPost, getRatingSummary with ReviewRow and RatingSummary types
- `tests/ratings/create-review.test.ts` - 19 tests for createReview and deleteReview
- `tests/ratings/report.test.ts` - 7 tests for reportContent

## Decisions Made
- PgTransaction type from `drizzle-orm/pg-core` used for the `recalculateSummary` helper parameter — `PostgresJsTransaction` alias does not satisfy `Record<string, unknown>` constraint
- `recalculateSummary` is private (not exported) — only called inside transactions, never standalone
- Test mock chaining: `mockTx.where` returns `mockTx` for `.limit()` chain on select queries, but `mockTx.where` resolves directly for update end-of-chain awaits — both patterns coexist in mockTx via `beforeEach` resets
- Error sentinel pattern used inside transactions: `throw new Error('REVIEW_NOT_FOUND')`, caught outside by `e.message` comparison — avoids exposing DB errors to callers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript PgTransaction type mismatch in recalculateSummary**
- **Found during:** Task 2 (GREEN phase — TypeScript check)
- **Issue:** `recalculateSummary(tx: typeof db, postId)` caused TS2345 — `PgTransaction` is not assignable to `PostgresJsDatabase`
- **Fix:** Added `PgTransaction` type import from `drizzle-orm/pg-core`, defined `Tx` alias with correct generics
- **Files modified:** `src/actions/reviews.ts`
- **Verification:** `npx tsc --noEmit` passes clean (excluding pre-existing city-page.test.tsx errors)
- **Committed in:** 33761fa (Task 2 commit)

**2. [Rule 1 - Bug] Fixed test mock chain for deleteReview's select/where/limit pattern**
- **Found during:** Task 2 (test run after initial GREEN implementation)
- **Issue:** `mockTx.where.mockResolvedValue(...)` caused `tx.select(...).from(...).where(...).limit is not a function` — where needed to return `mockTx` for chaining, not resolve
- **Fix:** Restructured test mocks to use `mockTx.where.mockReturnValue(mockTx)` for chaining tests, with separate `mockImplementationOnce` overrides for specific scenarios
- **Files modified:** `tests/ratings/create-review.test.ts`
- **Verification:** All 22 tests pass
- **Committed in:** 33761fa (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 - bugs)
**Impact on plan:** Both fixes were correctness issues — TypeScript types and test mock wiring. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `tests/feed/city-page.test.tsx` (missing required fields on city mock object) — these pre-date this plan and are out of scope. Not fixed.

## Next Phase Readiness
- reviews and ratingSummary tables ready for migration
- All Server Actions exported and typed for use by Phase 4 UI components
- getRatingSummary ready for RatingBadge component (Plan 04-02)
- reportContent ready for ReportButton component (Plan 04-03)
- 8 remaining todo stubs in tests/ratings/rating-badge.test.tsx — addressed in next plan

---
*Phase: 04-ratings-and-trust*
*Completed: 2026-03-18*
