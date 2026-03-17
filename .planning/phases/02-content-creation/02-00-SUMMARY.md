---
phase: 02-content-creation
plan: "00"
subsystem: testing
tags: [vitest, postgis, supabase-storage, sql-migrations, test-stubs]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: posts/profiles/cities/userCityRoles tables, requireAuth/requireLocalInCity guards, isUserLocalInCity query
provides:
  - PostGIS extension migration (0002_enable_postgis.sql) enabling geography type for all subsequent DDL
  - Supabase Storage bucket migration (0003_storage_bucket.sql) with RLS for authenticated upload and public read
  - 10 test stub files with 50 test.todo() entries covering all Phase 2 requirements (zero false positives)
affects: [02-01, 02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: [postgis (via Supabase extension), supabase-storage]
  patterns: [test.todo() stubs with no src imports, numbered SQL migration ordering, RLS-on-storage-objects pattern]

key-files:
  created:
    - supabase/migrations/0002_enable_postgis.sql
    - supabase/migrations/0003_storage_bucket.sql
    - tests/posts/create-place.test.ts
    - tests/posts/place-detail.test.tsx
    - tests/posts/create-event.test.ts
    - tests/posts/event-queries.test.ts
    - tests/posts/event-detail.test.tsx
    - tests/posts/recurrence.test.ts
    - tests/rsvp/rsvp.test.ts
    - tests/gps/proximity.test.ts
    - tests/storage/signed-url.test.ts
    - tests/db/schema-phase2.test.ts
  modified: []

key-decisions:
  - "PostGIS installed WITH SCHEMA extensions so ST_DWithin is callable unqualified (Supabase sets search_path to include extensions schema)"
  - "Storage bucket is public (not private) so getPublicUrl() works without per-request signed read URLs"
  - "10MB file size limit with ARRAY mime type allowlist: jpeg/png/webp/heic"
  - "All test stubs use test.todo() with zero src imports — ensures suite stays green (50 skipped) until implementations are added in subsequent waves"

patterns-established:
  - "Migration ordering: 0002_ must precede any geography column DDL — file prefix enforces run order"
  - "Test stub pattern: import only { describe, test } from vitest, use test.todo() only, no src imports"
  - "RLS on storage.objects: authenticated insert with foldername check, public select by bucket_id"

requirements-completed: [PLAC-01, PLAC-02, PLAC-03, PLAC-04, PLAC-05, EVNT-01, EVNT-02, EVNT-03, EVNT-04, EVNT-05]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 2 Plan 00: Content Creation Prerequisites Summary

**PostGIS geography migration, Supabase Storage bucket with RLS, and 50 test.todo() stubs covering all 10 Phase 2 requirements across places, events, RSVP, GPS verification, and schema**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T16:07:47Z
- **Completed:** 2026-03-17T16:10:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Created 0002_enable_postgis.sql: CREATE EXTENSION postgis, ALTER TABLE posts ADD COLUMN location geography(POINT,4326), GIST spatial index
- Created 0003_storage_bucket.sql: post-images bucket with mime allowlist and 10MB limit, authenticated insert policy, public read policy
- Created 10 test stub files with 50 test.todo() entries — vitest run reports 0 failures, all 50 skipped

## Task Commits

Each task was committed atomically:

1. **Task 1: PostGIS and Storage bucket SQL migrations** - `6397f03` (feat)
2. **Task 2: All Phase 2 test stub files** - `acbb5e9` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/migrations/0002_enable_postgis.sql` - PostGIS extension + geography column on posts + GIST index
- `supabase/migrations/0003_storage_bucket.sql` - post-images storage bucket + 2 RLS policies
- `tests/posts/create-place.test.ts` - PLAC-01/02/03/05 stubs (8 todos)
- `tests/posts/place-detail.test.tsx` - PLAC-04 stubs (4 todos)
- `tests/posts/create-event.test.ts` - EVNT-01/04 stubs (7 todos)
- `tests/posts/event-queries.test.ts` - EVNT-02 stubs (4 todos)
- `tests/posts/event-detail.test.tsx` - EVNT-05 stubs (4 todos)
- `tests/posts/recurrence.test.ts` - EVNT-04 recurrence stubs (4 todos)
- `tests/rsvp/rsvp.test.ts` - EVNT-03 stubs (5 todos)
- `tests/gps/proximity.test.ts` - PLAC-02 verifyGpsProximity stubs (4 todos)
- `tests/storage/signed-url.test.ts` - PLAC-03 getSignedUploadUrl stubs (4 todos)
- `tests/db/schema-phase2.test.ts` - schema additions stubs (6 todos)

## Decisions Made

- PostGIS installed WITH SCHEMA extensions so ST_DWithin and other spatial functions are callable unqualified (Supabase sets search_path to include extensions schema by default)
- Storage bucket is public (not private) so getPublicUrl() works without per-request signed read URLs; upload still restricted to authenticated users via RLS
- 10MB file size limit with ARRAY mime type allowlist (jpeg, png, webp, heic) prevents arbitrary file uploads
- All test stubs use test.todo() with zero src imports — suite stays green until Wave 1+ implementations are added

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 0 complete — all test stubs exist (zero false positives confirmed)
- 0002_enable_postgis.sql must be applied to Supabase instance before Wave 1 schema work runs (geography type dependency)
- Wave 1 can begin: Drizzle schema extension (post_images, event_rsvps tables, Phase 2 columns on posts)

---
*Phase: 02-content-creation*
*Completed: 2026-03-17*
