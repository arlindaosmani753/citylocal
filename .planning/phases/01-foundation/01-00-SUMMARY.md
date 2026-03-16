---
phase: 01-foundation
plan: "00"
subsystem: testing
tags: [vitest, react-testing-library, jsdom, vite-tsconfig-paths, test-stubs]

# Dependency graph
requires: []
provides:
  - vitest.config.ts with jsdom environment and tests/** include glob
  - 7 test stub files covering all VALIDATION.md Wave 0 behaviors
  - Test directory structure: tests/auth, tests/roles, tests/profile, tests/db
affects:
  - 01-foundation (all subsequent plans depend on these stubs for RED verification)

# Tech tracking
tech-stack:
  added:
    - vitest (config only — install deferred to plan 01-01 with Next.js scaffold)
    - "@vitejs/plugin-react (config referenced)"
    - vite-tsconfig-paths (config referenced)
  patterns:
    - "test.todo() stubs created before implementation — Nyquist rule satisfied"
    - "Requirement IDs (AUTH-01, ROLE-01, etc.) embedded as comments in every test"

key-files:
  created:
    - vitest.config.ts
    - tests/auth/register.test.ts
    - tests/auth/callback.test.ts
    - tests/auth/reset.test.ts
    - tests/middleware.test.ts
    - tests/roles/city-role.test.ts
    - tests/profile/profile-page.test.tsx
    - tests/db/schema.test.ts
  modified: []

key-decisions:
  - "vitest.config.ts written before Next.js scaffold exists — file will be incorporated when 01-01 runs create-next-app"
  - "All test stubs use test.todo() with no src imports — ensures zero false positives before implementation"

patterns-established:
  - "Test-first: stubs exist before any implementation code"
  - "Requirement traceability: every test.todo() comment includes the requirement ID (AUTH-XX, ROLE-XX)"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 1 Plan 00: Test Infrastructure Summary

**Vitest config and 26 test.todo() stubs covering all VALIDATION.md Wave 0 behaviors across auth, roles, middleware, profile, and DB schema**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T14:54:40Z
- **Completed:** 2026-03-16T14:56:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created vitest.config.ts with jsdom environment, vite-tsconfig-paths, v8 coverage, and `tests/**` glob
- Created 7 test stub files covering all Wave 0 VALIDATION.md behaviors (AUTH-01 through ROLE-04)
- Established test directory structure (tests/auth, tests/roles, tests/profile, tests/db)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test framework dependencies and create vitest.config.ts** - `c892e33` (chore)
2. **Task 2: Create failing test stubs for all VALIDATION.md behaviors** - `00a34f9` (test)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `vitest.config.ts` — Vitest config with jsdom, vite-tsconfig-paths, v8 coverage, tests/** glob
- `tests/auth/register.test.ts` — test.todo() stubs for AUTH-01, ROLE-01
- `tests/auth/callback.test.ts` — test.todo() stubs for AUTH-02, AUTH-03 callback route
- `tests/auth/reset.test.ts` — test.todo() stubs for AUTH-03 password reset/update actions
- `tests/middleware.test.ts` — test.todo() stubs for AUTH-04, ROLE-03
- `tests/roles/city-role.test.ts` — test.todo() stubs for ROLE-02
- `tests/profile/profile-page.test.tsx` — test.todo() stubs for ROLE-04
- `tests/db/schema.test.ts` — test.todo() stubs for soft-delete columns and unique constraint

## Decisions Made

- vitest.config.ts written ahead of the Next.js scaffold: the file will sit at root and be naturally incorporated when plan 01-01 runs `create-next-app`. No special handling needed.
- npm install of vitest and testing-library is deferred to plan 01-01 alongside the full scaffold install, as specified in the plan action note.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Wave 0 test stubs are in place; plan 01-01 can immediately run RED verification after implementing each task
- vitest.config.ts ready to be picked up by the Next.js scaffold
- npm install of vitest dependencies must happen in plan 01-01 before `npx vitest run` will work

---
*Phase: 01-foundation*
*Completed: 2026-03-16*

## Self-Check: PASSED

All 9 files confirmed on disk. Both task commits (c892e33, 00a34f9) confirmed in git log.
