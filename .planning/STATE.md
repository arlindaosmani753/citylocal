---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-03-PLAN.md — city search page, CitySearchForm, closes FEED-03 gap — 119 tests passing
last_updated: "2026-03-18T18:18:18.620Z"
last_activity: "2026-03-16 — Plan 01-03 complete: Role queries (isUserLocalInCity), server guards (requireAuth/requireLocalInCity), Paris seed"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 15
  completed_plans: 15
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Authentic, GPS-verified local knowledge that tourists can trust — because every post comes from someone who was physically there.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 3 of 5 in current phase (next: 01-04)
Status: In Progress
Last activity: 2026-03-16 — Plan 01-03 complete: Role queries (isUserLocalInCity), server guards (requireAuth/requireLocalInCity), Paris seed

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 4.5 min
- Total execution time: 0.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 9 min | 4.5 min |

**Recent Trend:**
- Last 5 plans: 01-00 (2 min), 01-01 (7 min)
- Trend: -

*Updated after each plan completion*
| Phase 01-foundation P03 | 3 | 2 tasks | 5 files |
| Phase 01-foundation P02 | 7 | 2 tasks | 19 files |
| Phase 01-foundation P04 | 3 | 2 tasks | 6 files |
| Phase 01-foundation P04 | 15 | 2 tasks | 6 files |
| Phase 02-content-creation P01 | 3 | 2 tasks | 3 files |
| Phase 02-content-creation P00 | 2 | 2 tasks | 12 files |
| Phase 02-content-creation P02 | 6 | 2 tasks | 4 files |
| Phase 02-content-creation P03 | 9 | 2 tasks | 10 files |
| Phase 02-content-creation P04 | 9min | 2 tasks | 15 files |
| Phase 03-city-feed-and-discovery P01 | 4min | 2 tasks | 4 files |
| Phase 03-city-feed-and-discovery P00 | 3 | 2 tasks | 5 files |
| Phase 03-city-feed-and-discovery P02 | 2 | 2 tasks | 7 files |
| Phase 03-city-feed-and-discovery P04 | 3min | 2 tasks | 7 files |
| Phase 03-city-feed-and-discovery P03 | 6min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-Phase 1]: Unified posts table with content_type discriminator — places and events share one table; events are added in Phase 2, not later
- [Pre-Phase 1]: Per-city role model is behavior-based (3+ GPS-verified posts = local in that city), not a signup checkbox
- [Pre-Phase 1]: Soft-delete and report/flag mechanism must be in place at Phase 1 data model level — not deferred
- [Pre-Phase 1]: Map view deferred to Phase 3 (FEED-04); feed-first is the default entry point
- [Pre-Phase 1]: Leaflet + OpenStreetMap tiles (not Mapbox) for map view to avoid billing surprise
- [Phase 01-foundation]: vitest.config.ts written before Next.js scaffold — incorporated naturally when plan 01-01 runs create-next-app
- [Phase 01-foundation]: All test stubs use test.todo() with no src imports — ensures zero false positives before implementation
- [Phase 01-foundation]: shadcn/ui v4 API: --style flag removed, --defaults flag uses base-nova preset (new-york equivalent)
- [Phase 01-foundation]: Drizzle v0.45+ uses array syntax for table indexes: (table) => [...] not object syntax
- [Phase 01-foundation]: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY used over legacy ANON_KEY per current Supabase docs
- [Phase 01-foundation]: isUserLocalInCity reads isLocal column directly — verifiedPostCount threshold logic belongs to Phase 2 GPS verification
- [Phase 01-foundation]: requireAuth uses getUser() not getSession() for server-side JWT validation per Supabase security best practice
- [Phase 01-foundation]: Paris seed slug is paris-france matching Phase 3 URL pattern /cities/paris-france
- [Phase 01-foundation]: Zod v4 uses z.infer<typeof schema> not schema._type for TypeScript inference
- [Phase 01-foundation]: useActionState with Server Actions requires double cast (as unknown as) due to TypeScript narrowing
- [Phase 01-foundation]: middleware.ts at project root — @/* alias maps to ./src/* only, so tests use relative import
- [Phase 01-foundation]: ContributionsList is synchronous in Phase 1 — async RSC not supported by react-dom/client in tests; Phase 2 will refactor with real post query
- [Phase 01-foundation]: ContributionsList is synchronous in Phase 1 — async RSC not supported by react-dom/client in tests; Phase 2 will refactor with real post query
- [Phase 01-foundation]: ProfileHeader uses CSS initials fallback instead of shadcn Avatar — Avatar component not installed; avoids interactive shadcn CLI
- [Phase 02-content-creation]: placeCategoryEnum declared before posts table — forward reference causes Drizzle init error
- [Phase 02-content-creation]: posts.category changed from varchar(50) to placeCategoryEnum for DB-level type enforcement
- [Phase 02-content-creation]: eventRsvps uniqueIndex enforces one RSVP per user per event at DB level not application level
- [Phase 02-content-creation]: PostGIS installed WITH SCHEMA extensions so ST_DWithin is callable unqualified
- [Phase 02-content-creation]: Storage bucket is public so getPublicUrl() works without per-request signed read URLs
- [Phase 02-content-creation]: All Phase 2 test stubs use test.todo() with zero src imports — suite stays green until implementations added
- [Phase 02-content-creation]: requireAuth() returns Supabase User with user.id — not { userId } as plan interface specified; all callers must use user.id
- [Phase 02-content-creation]: ST_MakePoint MUST use (lng, lat) order — PostGIS (x,y) convention; GPS_ACCURACY_THRESHOLD_METERS=150 and GEOFENCE_RADIUS_METERS=200 are separate exported constants
- [Phase 02-content-creation]: Zod v4 uses .issues[0].message not .errors[0].message for validation error extraction
- [Phase 02-content-creation]: @testing-library/jest-dom added as project-wide setup via tests/setup.ts — toHaveTextContent and toBeInTheDocument now available to all tests
- [Phase 02-content-creation]: Category label map needed in both PlaceForm and PlacePage to display Café (with accent) not Cafe
- [Phase 02-content-creation]: createEvent test fixture used non-UUID cityId — fixed to UUID format; getByText(/2/) matched multiple nodes — narrowed to /2 attending/; profile-page test updated for two db.select calls and new ContributionsList empty state text
- [Phase 03-city-feed-and-discovery]: Wave 0 stubs use test.todo() with zero src imports — same Nyquist compliance pattern as Phase 1 and Phase 2
- [Phase 03-city-feed-and-discovery]: Leaflet mock strategy (vi.mock react-leaflet + leaflet) documented in comment in city-map.test.tsx — deferred to Wave 2 when CityMap component exists
- [Phase 03-city-feed-and-discovery]: category='event' filter uses contentType column NOT category column (category is null for events)
- [Phase 03-city-feed-and-discovery]: Compound cursor for getFeedForCity: fetch limit+1 rows; last item of sliced result becomes nextCursor
- [Phase 03-city-feed-and-discovery]: Past-event exclusion: or(isPlace, endsAt IS NULL, endsAt > NOW()) so places are never excluded by event filter
- [Phase 03-city-feed-and-discovery]: CategoryFilterTabs uses aria-current='page' on active Link — accessible and testable without className inspection
- [Phase 03-city-feed-and-discovery]: URLSearchParams encoding for Load more href — safe for ISO cursor strings containing colons and dots
- [Phase 03-city-feed-and-discovery]: L.Icon mock must use constructor function not arrow fn — vi.fn().mockImplementation(() => ({})) is not a constructor
- [Phase 03-city-feed-and-discovery]: city-page.test.tsx must mock getPostsForMap alongside getFeedForCity — CityMapLoader renders inside Suspense and calls getPostsForMap
- [Phase 03-city-feed-and-discovery]: UI tests for CitySearchPage placed in separate file to prevent vi.mock hoisting conflict with query unit tests
- [Phase 03-city-feed-and-discovery]: CitySearchForm uses plain HTML GET form — bookmarkable, no JS dependency, aria-label for accessibility

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED] shadcn/ui stable + Tailwind v4 compatibility verified — shadcn v4 with --defaults uses base-nova (new-york equivalent)
- [Research flag] Supabase PostGIS extension enablement and ST_DWithin with GEOGRAPHY type should be verified on a real instance before Phase 2 GPS work
- [Research flag] Geofence radius (200m default) vs. GPS accuracy rejection threshold are two separate values — clarify during Phase 2 planning
- [Research flag] Recurring event data model needs a design decision during Phase 2 planning

## Session Continuity

Last session: 2026-03-18T18:14:22.834Z
Stopped at: Completed 03-03-PLAN.md — city search page, CitySearchForm, closes FEED-03 gap — 119 tests passing
Resume file: None
