# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-19
**Phases:** 4 | **Plans:** 19 | **Timeline:** 6 days (2026-03-13 → 2026-03-19)
**Commits:** 88 | **Tests:** 151 passing

### What Was Built
- Auth system with email/password, email verification, password reset, session persistence, per-city roles
- GPS-verified place and event creation on a unified posts table with Supabase Storage photo upload
- RSVP system, recurring events (weekly/monthly), event auto-expiry
- Public city feed with compound-cursor pagination, category filtering, city search, interactive Leaflet map
- Star ratings (1–5) + optional reviews, transactional rating aggregation, report/flag system
- Rating badges on feed cards and detail pages

### What Worked
- **Wave 0 Nyquist stubs** — establishing test.todo() baselines before any implementation caught zero regressions across all 4 phases; high confidence in each GREEN pass
- **Unified posts table design** — compound cursor pagination on (city_id, created_at DESC) worked cleanly for both places and events; no schema rework needed
- **Transactional write-through for rating_summary** — precomputed aggregates made feed JOIN O(1) per post without any additional indexing
- **Wave-based parallel execution** — independent plans within phases ran concurrently, cutting wall-clock time significantly
- **Human-verify checkpoints** — Phase 4 plan 04-03 paused correctly at the end-to-end flow gate, ensuring browser verification before marking complete

### What Was Inefficient
- **ROADMAP.md Phase 3 progress tracking** — tooling artifact left Phase 3 as "Not started" in the progress table despite completion; required manual correction at milestone close
- **accomplishments auto-extraction** — gsd-tools couldn't auto-extract one-liners from SUMMARY.md frontmatter (fields returned null); required manual write to MILESTONES.md
- **No milestone audit** — skipped `/gsd:audit-milestone` before completion; cross-phase integration correctness was inferred from individual phase verifications rather than a holistic E2E pass

### Patterns Established
- **Wave 0 before implementation** — every phase started with a Nyquist stub plan (test.todo(), zero src imports) to lock the baseline
- **TDD per plan** — RED commit (failing tests) followed by GREEN commit (implementation) within each plan, committed atomically
- **Transactional write-through for aggregates** — avoid aggregation queries on the read path; precompute on write in the same transaction
- **Compound cursor pagination** — (city_id, created_at DESC) compound index with cursor state in URL params for efficient, stateless pagination

### Key Lessons
1. **Ship Wave 0 before writing any implementation code** — the 10-minute stub cost pays for itself every time a refactor keeps the suite green without surprises
2. **Unified table design earns its complexity** — the discriminator pattern (content_type enum) simplified feed queries and GPS/photo logic reuse enough to offset schema complexity
3. **Precompute aggregates transactionally** — rating_summary as a write-through cache eliminated the N+1 aggregation problem entirely; should be the default pattern for any future aggregate
4. **Human-verify checkpoints are worth the friction** — catching browser-level issues at a defined gate is cleaner than discovering them post-merge

### Cost Observations
- Model mix: ~100% sonnet (executor_model: sonnet throughout)
- Sessions: ~6 sessions across 6 days
- Notable: parallel wave execution within phases meaningfully reduced total wall-clock time despite sequential phase dependencies

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 4 | 19 | Established Wave 0 Nyquist pattern, TDD per plan, parallel wave execution |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Stubs | Phases |
|-----------|-------|----------------|--------|
| v1.0 | 151 | 4 (one per phase) | 4 |

### Top Lessons (Verified Across Milestones)

1. **Wave 0 Nyquist stubs** — establish the test baseline before any implementation; prevents regressions silently passing
2. **Transactional precomputed aggregates** — avoid aggregation on the read path by computing on write
