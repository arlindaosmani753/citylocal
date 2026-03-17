---
phase: 3
slug: city-feed-and-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library (already configured) |
| **Config file** | `vitest.config.ts` (exists from Phase 1) |
| **Quick run command** | `npx vitest run tests/feed/ tests/cities/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/feed/ tests/cities/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-00-01 | 00 | 0 | FEED-01 | unit | `npx vitest run tests/feed/feed-service.test.ts` | ❌ W0 | ⬜ pending |
| 3-00-02 | 00 | 0 | FEED-02 | unit | `npx vitest run tests/feed/feed-service.test.ts` | ❌ W0 | ⬜ pending |
| 3-00-03 | 00 | 0 | FEED-03 | unit | `npx vitest run tests/cities/city-search.test.ts` | ❌ W0 | ⬜ pending |
| 3-00-04 | 00 | 0 | FEED-04 | unit | `npx vitest run tests/map/city-map.test.tsx` | ❌ W0 | ⬜ pending |
| 3-01-01 | 01 | 1 | FEED-01 | unit | `npx vitest run tests/feed/feed-service.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | FEED-01 | unit | `npx vitest run tests/feed/feed-service.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | FEED-02 | unit | `npx vitest run tests/feed/feed-service.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | FEED-04 | unit | `npx vitest run tests/feed/feed-service.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | FEED-01 | unit | `npx vitest run tests/feed/city-page.test.tsx` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | FEED-02 | unit | `npx vitest run tests/feed/category-tabs.test.tsx` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | FEED-03 | unit | `npx vitest run tests/cities/city-search.test.ts` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | FEED-04 | unit | `npx vitest run tests/map/city-map.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/feed/feed-service.test.ts` — stubs for FEED-01, FEED-02, FEED-04, pagination
- [ ] `tests/feed/city-page.test.tsx` — stubs for FEED-01 city page render
- [ ] `tests/feed/category-tabs.test.tsx` — stubs for FEED-02 category filter tabs
- [ ] `tests/cities/city-search.test.ts` — stubs for FEED-03 query functions
- [ ] `tests/map/city-map.test.tsx` — stubs for FEED-04 client component (react-leaflet mocked)

*No new framework installs needed — Vitest + RTL already present from Phases 1-2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map tiles visually load from OpenStreetMap | FEED-04 | Requires real browser + network | Navigate to `/cities/paris-france`, confirm map tiles render |
| Marker pins appear at correct lat/lng | FEED-04 | Requires real browser + Leaflet DOM | Create a place post, verify pin appears on map at correct location |
| Category filter tab changes URL without full reload | FEED-02 | Requires browser navigation observation | Click a category tab, confirm URL updates and feed changes without full page flash |
| City search redirects on exact single match | FEED-03 | Requires running server with redirect | Search for "Paris", confirm redirect to `/cities/paris-france` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
