---
phase: 4
slug: ratings-and-trust
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/ratings/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/ratings/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-00-01 | 00 | 0 | RATE-01,02,03 | stub | `npx vitest run tests/ratings/` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | RATE-01,02,04 | unit RED | `npx vitest run tests/ratings/create-review.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | RATE-01,02,04 | unit GREEN | `npx vitest run tests/ratings/create-review.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | RATE-01,02,03 | unit RED | `npx vitest run tests/ratings/report.test.ts tests/ratings/rating-badge.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | RATE-01,02,03 | unit GREEN | `npx vitest run tests/ratings/` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 3 | RATE-04 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 3 | RATE-04 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/ratings/create-review.test.ts` — stubs for RATE-01, RATE-02, RATE-04 (review creation, validation, rating_summary write-through)
- [ ] `tests/ratings/report.test.ts` — stubs for RATE-03 (reportContent action, flagCount increment)
- [ ] `tests/ratings/rating-badge.test.tsx` — stubs for RATE-04 (RatingBadge display, feed card integration)

*All stubs use test.todo() with zero src imports.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Star picker interactive selection in browser | RATE-01 | Client interaction in jsdom lacks pointer events fidelity | Visit /cities/paris-france, open a place, click stars 1–5 and verify selection highlights |
| Rating badge visible on feed cards | RATE-04 | RSC + Suspense render requires live Next.js | Visit /cities/paris-france, confirm avg rating and count appear on cards that have reviews |

---

## Validation Architecture

Wave 0 test files establish the Nyquist baseline before any implementation. All mutations (createReview, deleteReview, reportContent) are tested with db mock in unit tests. Feed integration (leftJoin ratingSummary) verified via full suite run after plan 03.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
