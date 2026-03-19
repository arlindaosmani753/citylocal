---
phase: 02-content-creation
plan: "04"
subsystem: api
tags: [drizzle, nextjs, server-actions, events, rsvp, recurrence, date-fns]

# Dependency graph
requires:
  - phase: 02-content-creation-03
    provides: createPlace, PlaceForm, /places/new, /places/[id], GPS verification
  - phase: 02-content-creation-01
    provides: eventRsvps schema table with uniqueIndex(userId, postId)
  - phase: 01-foundation-04
    provides: requireAuth, requireLocalInCity guards; ContributionsList stub
provides:
  - createEvent Server Action with Zod validation, GPS check, recurrence mapping ('1 week'/'1 month'/null)
  - rsvpToEvent and cancelRsvp Server Actions using onConflictDoNothing for idempotency
  - getActiveEventsForCity query with EVNT-02 filter (endsAt IS NULL OR endsAt > NOW())
  - getEventById returning rsvpCount and attendees array
  - getNextOccurrence pure function computing next occurrence from recurrenceInterval
  - listContributionsForUser query returning posts by authorId
  - EventForm 'use client' component with GPS capture and recurrence selector
  - RsvpButton 'use client' toggle component
  - /events/new Server Component with requireLocalInCity guard
  - /events/[id] async RSC rendering event detail, attendee count, attendee list
  - ContributionsList refactored from stub to prop-driven synchronous component
affects: [phase-03-discovery, phase-04-ratings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - onConflictDoNothing for idempotent RSVP insert at DB level
    - Pure function getNextOccurrence for recurrence computation (no DB call)
    - Prop-driven synchronous ContributionsList: parent RSC fetches, child renders
    - TDD: two separate task commits (test stub → GREEN)

key-files:
  created:
    - src/actions/rsvp.ts
    - src/app/events/[id]/page.tsx
    - src/app/events/new/page.tsx
    - src/components/events/RsvpButton.tsx
    - src/components/posts/EventForm.tsx
  modified:
    - src/actions/posts.ts
    - src/lib/db/queries/posts.ts
    - src/components/profile/ContributionsList.tsx
    - src/app/profile/[username]/page.tsx
    - tests/posts/create-event.test.ts
    - tests/posts/event-queries.test.ts
    - tests/posts/recurrence.test.ts
    - tests/rsvp/rsvp.test.ts
    - tests/posts/event-detail.test.tsx
    - tests/profile/profile-page.test.tsx

key-decisions:
  - "createEvent test fixture used non-UUID cityId 'city-paris' but Zod schema requires z.string().uuid() — fixed to use proper UUID in test fixture"
  - "getByText(/2/) matched multiple DOM nodes (attendee count AND date text) — narrowed to getByText(/2 attending/) for specificity"
  - "profile-page test mocked single db.select call but profile page now makes two calls (profile query + listContributionsForUser) — updated mock with mockImplementation call-count pattern"
  - "ContributionsList empty state text changed from '0 contributions' to 'No contributions yet.' (new component) — updated profile-page test assertion"

patterns-established:
  - "onConflictDoNothing: RSVP idempotency handled at DB level via uniqueIndex, not application code"
  - "Pure occurrence function: getNextOccurrence is synchronous, no DB calls — computes next future date iteratively"
  - "Prop-driven child pattern: async RSC parent fetches data, passes as prop to synchronous child component"
  - "vi.mock factory hoisting: mock constants defined inside the factory function to avoid 'cannot access before initialization' errors"
  - "Two-call db mock: use mockImplementation with call counter for tests where a page makes multiple db.select calls"

requirements-completed: [EVNT-01, EVNT-02, EVNT-03, EVNT-04, EVNT-05]

# Metrics
duration: 12min
completed: 2026-03-17
---

# Phase 2 Plan 04: Event Creation, RSVP, and ContributionsList Summary

**createEvent Server Action with recurrence mapping, idempotent rsvpToEvent via onConflictDoNothing, event detail/new pages, RsvpButton/EventForm client components, getNextOccurrence pure function, and ContributionsList refactored from Phase 1 stub to prop-driven real query**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-17T17:29:51Z
- **Completed:** 2026-03-17T17:37:30Z
- **Tasks:** 3 of 3 complete (Task 3 checkpoint:human-verify approved by user)
- **Files modified:** 15

## Accomplishments
- All 5 EVNT requirements (EVNT-01 through EVNT-05) implemented and tested
- Full TDD cycle: RED stubs replaced with real tests, GREEN implementations pass all 84 suite tests
- ContributionsList refactored from Phase 1 stub (hardcoded empty array) to real listContributionsForUser query passed as prop
- Zero TypeScript errors, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: createEvent, RSVP actions, event queries, ContributionsList** - `981b5e9` (feat)
2. **Task 2: Event pages, EventForm, RsvpButton** - `25ce3f8` (feat)
3. **Task 3: Human verification checkpoint** - `approved` (manual end-to-end verification passed)

## Files Created/Modified
- `src/actions/posts.ts` - Added createEvent with Zod schema, GPS check, recurrence mapping
- `src/actions/rsvp.ts` - New: rsvpToEvent and cancelRsvp Server Actions with onConflictDoNothing
- `src/lib/db/queries/posts.ts` - Added getActiveEventsForCity, getEventById, getNextOccurrence, listContributionsForUser
- `src/components/profile/ContributionsList.tsx` - Refactored from userId stub to posts prop-driven component
- `src/app/profile/[username]/page.tsx` - Added listContributionsForUser fetch, passes contributions prop
- `src/app/events/[id]/page.tsx` - New: async RSC with event detail, attendee count and list, notFound()
- `src/app/events/new/page.tsx` - New: Server Component with requireLocalInCity guard
- `src/components/events/RsvpButton.tsx` - New: 'use client' toggle calling rsvpToEvent/cancelRsvp
- `src/components/posts/EventForm.tsx` - New: 'use client' form with GPS capture, date pickers, recurrence select
- `tests/posts/create-event.test.ts` - Replaced test.todo stubs with 6 real tests
- `tests/posts/event-queries.test.ts` - Replaced test.todo stubs with 2 real tests
- `tests/posts/recurrence.test.ts` - Replaced test.todo stubs with 4 real tests
- `tests/rsvp/rsvp.test.ts` - Replaced test.todo stubs with 4 real tests
- `tests/posts/event-detail.test.tsx` - Replaced test.todo stubs with 4 real tests
- `tests/profile/profile-page.test.tsx` - Updated to handle two db.select calls and new ContributionsList output

## Decisions Made
- createEvent test fixture used non-UUID cityId 'city-paris' but Zod schema requires UUID format — fixed to use proper UUID in test fixture
- getByText(/2/) in event-detail test matched multiple DOM nodes — narrowed to /2 attending/ for specificity
- profile-page test needed two-call db mock pattern (profile query + contributions query)
- ContributionsList empty state text updated from '0 contributions' to 'No contributions yet.' to match refactored component

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-UUID cityId in createEvent test fixture**
- **Found during:** Task 1 (create-event tests)
- **Issue:** Plan's test fixture used `cityId: 'city-paris'` but createEventSchema uses `z.string().uuid()` — Zod rejects it before GPS check is reached, causing multiple test failures
- **Fix:** Changed fixture to `cityId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'` (valid UUID format)
- **Files modified:** tests/posts/create-event.test.ts
- **Verification:** All 6 create-event tests pass
- **Committed in:** 981b5e9 (Task 1 commit)

**2. [Rule 1 - Bug] Ambiguous getByText(/2/) matches multiple DOM nodes**
- **Found during:** Task 2 (event-detail tests)
- **Issue:** Plan's test used `screen.getByText(/2/)` but rendered page has multiple elements containing "2" (attendee count text + date text) — throws "Found multiple elements" error
- **Fix:** Narrowed selector to `screen.getByText(/2 attending/)` which uniquely matches the attendee count span
- **Files modified:** tests/posts/event-detail.test.tsx
- **Verification:** All 4 event-detail tests pass
- **Committed in:** 25ce3f8 (Task 2 commit)

**3. [Rule 1 - Bug] profile-page test mock broke with new db.select call**
- **Found during:** Task 2 (full suite verification after ContributionsList refactor)
- **Issue:** Profile page now calls db.select twice (profile query + listContributionsForUser) but existing test mock only set up one chainable result without orderBy method, causing TypeError
- **Fix:** Rewrote mock to use `mockImplementation` with call counter; also updated "0 contributions" assertion to match new component output "No contributions yet."
- **Files modified:** tests/profile/profile-page.test.tsx
- **Verification:** All 4 profile-page tests pass, full 84-test suite green
- **Committed in:** 25ce3f8 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs — test fixture and mock issues)
**Impact on plan:** All fixes required for correctness. No scope creep.

## Issues Encountered
- vi.mock factory hoisting: defining `mockDb` as a `const` outside `vi.mock()` causes "Cannot access before initialization" — fixed by defining constants inside the factory function

## User Setup Required
None - no external service configuration required for automated tasks.

## Next Phase Readiness
- All 10 Phase 2 requirements implemented (PLAC-01–05, EVNT-01–05)
- Task 3 (human-verify checkpoint) approved — place and event creation flows verified against live Supabase instance
- Phase 3 (Discovery/Feed) is cleared to begin

---
*Phase: 02-content-creation*
*Completed: 2026-03-17*
