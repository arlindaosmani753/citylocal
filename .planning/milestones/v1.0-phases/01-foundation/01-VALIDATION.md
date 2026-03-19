---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (latest) + React Testing Library |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
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
| register-validation | 01 | 1 | AUTH-01, ROLE-01 | unit | `npx vitest run tests/auth/register.test.ts` | ❌ W0 | ⬜ pending |
| callback-route | 01 | 1 | AUTH-02, AUTH-03 | unit | `npx vitest run tests/auth/callback.test.ts` | ❌ W0 | ⬜ pending |
| middleware | 01 | 1 | AUTH-04, ROLE-03 | unit | `npx vitest run tests/middleware.test.ts` | ❌ W0 | ⬜ pending |
| city-role-model | 01 | 2 | ROLE-02 | unit | `npx vitest run tests/roles/city-role.test.ts` | ❌ W0 | ⬜ pending |
| profile-page | 01 | 2 | ROLE-04 | unit | `npx vitest run tests/profile/profile-page.test.tsx` | ❌ W0 | ⬜ pending |
| schema-soft-delete | 01 | 1 | RATE-03 (data model) | unit | `npx vitest run tests/db/schema.test.ts` | ❌ W0 | ⬜ pending |
| schema-city-role-unique | 01 | 1 | ROLE-02 | unit | `npx vitest run tests/db/schema.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — framework config with jsdom + vite-tsconfig-paths
- [ ] `tests/auth/register.test.ts` — stubs for AUTH-01, ROLE-01
- [ ] `tests/auth/callback.test.ts` — stubs for AUTH-02, AUTH-03
- [ ] `tests/auth/reset.test.ts` — stub for AUTH-03 password reset action
- [ ] `tests/middleware.test.ts` — stubs for AUTH-04, ROLE-03
- [ ] `tests/roles/city-role.test.ts` — stubs for ROLE-02
- [ ] `tests/profile/profile-page.test.tsx` — stubs for ROLE-04
- [ ] `tests/db/schema.test.ts` — soft-delete columns, unique constraint stubs
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email verification link arrives in inbox and redirects correctly | AUTH-02 | Requires real email delivery (Supabase SMTP) | Register with real email, click link, verify session established and redirect to home |
| Password reset email arrives and allows password update | AUTH-03 | Requires real email delivery | Request reset for real email, click link, update password, verify login with new password |
| Session persists after browser tab close and reopen | AUTH-04 | Requires real browser session | Log in, close tab, open new tab to protected route, verify still logged in |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
