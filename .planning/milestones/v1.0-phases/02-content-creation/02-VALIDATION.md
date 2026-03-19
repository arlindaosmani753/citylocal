---
phase: 2
slug: content-creation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-00-01 | 00 | 0 | PLAC-01 | unit | `npx vitest run tests/posts/schema.test.ts` | ❌ W0 | ⬜ pending |
| 2-00-02 | 00 | 0 | PLAC-02 | unit | `npx vitest run tests/posts/gps.test.ts` | ❌ W0 | ⬜ pending |
| 2-00-03 | 00 | 0 | EVNT-01 | unit | `npx vitest run tests/posts/events.test.ts` | ❌ W0 | ⬜ pending |
| 2-00-04 | 00 | 0 | EVNT-03 | unit | `npx vitest run tests/posts/rsvp.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-01 | 01 | 1 | PLAC-01 | unit | `npx vitest run tests/posts/schema.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | PLAC-02 | unit | `npx vitest run tests/posts/gps.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | PLAC-02 | unit | `npx vitest run tests/posts/gps.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | PLAC-03 | unit | `npx vitest run tests/posts/place-create.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 2 | PLAC-04 | unit | `npx vitest run tests/posts/photos.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 3 | EVNT-01 | unit | `npx vitest run tests/posts/events.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 3 | EVNT-02 | unit | `npx vitest run tests/posts/events.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-03 | 03 | 3 | EVNT-03 | unit | `npx vitest run tests/posts/rsvp.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-04 | 03 | 3 | EVNT-04 | unit | `npx vitest run tests/posts/events.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-05 | 03 | 3 | EVNT-05 | unit | `npx vitest run tests/posts/events.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/posts/schema.test.ts` — stubs for PLAC-01 (unified posts table, content_type discriminator, GPS fields)
- [ ] `tests/posts/gps.test.ts` — stubs for PLAC-02 (accuracy check, ST_DWithin proximity, 5-min expiry, velocity limit)
- [ ] `tests/posts/place-create.test.ts` — stubs for PLAC-03 (place creation Server Action, category enum)
- [ ] `tests/posts/photos.test.ts` — stubs for PLAC-04/PLAC-05 (signed URL upload, EXIF strip, place detail page)
- [ ] `tests/posts/events.test.ts` — stubs for EVNT-01/EVNT-02/EVNT-04/EVNT-05 (event creation, recurrence, expiry, detail page)
- [ ] `tests/posts/rsvp.test.ts` — stubs for EVNT-03 (RSVP model, attendee count)
- [ ] PostGIS extension migration — `CREATE EXTENSION IF NOT EXISTS postgis` must exist before any geography column

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GPS capture in browser | PLAC-02 | Requires physical device or browser location mock | Open /posts/new, allow location, confirm coordinates match device GPS |
| Photo upload to Supabase Storage | PLAC-04 | Requires live Supabase project + Storage bucket | Create post with photo, confirm file appears in Supabase Storage dashboard |
| RSVP email notification (if any) | EVNT-03 | External email delivery | RSVP to event, confirm attendee count increments |
| Event auto-expiry in feed | EVNT-05 | Requires time-based query in live DB | Create event with past end date, confirm it does not appear in feed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
