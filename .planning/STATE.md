# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Authentic, GPS-verified local knowledge that tourists can trust — because every post comes from someone who was physically there.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of 4 in current phase
Status: Ready to plan
Last activity: 2026-03-13 — Roadmap created; all 26 v1 requirements mapped to 4 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-Phase 1]: Unified posts table with content_type discriminator — places and events share one table; events are added in Phase 2, not later
- [Pre-Phase 1]: Per-city role model is behavior-based (3+ GPS-verified posts = local in that city), not a signup checkbox
- [Pre-Phase 1]: Soft-delete and report/flag mechanism must be in place at Phase 1 data model level — not deferred
- [Pre-Phase 1]: Map view deferred to Phase 3 (FEED-04); feed-first is the default entry point
- [Pre-Phase 1]: Leaflet + OpenStreetMap tiles (not Mapbox) for map view to avoid billing surprise

### Pending Todos

None yet.

### Blockers/Concerns

- [Research flag] shadcn/ui canary + Tailwind v4 compatibility should be verified before Phase 1 scaffolding
- [Research flag] Supabase PostGIS extension enablement and ST_DWithin with GEOGRAPHY type should be verified on a real instance before Phase 2 GPS work
- [Research flag] Geofence radius (200m default) vs. GPS accuracy rejection threshold are two separate values — clarify during Phase 2 planning
- [Research flag] Recurring event data model needs a design decision during Phase 2 planning

## Session Continuity

Last session: 2026-03-13
Stopped at: Roadmap created, STATE.md initialized — ready to plan Phase 1
Resume file: None
