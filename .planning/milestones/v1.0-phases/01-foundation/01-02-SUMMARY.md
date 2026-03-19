---
phase: 01-foundation
plan: "02"
subsystem: auth
tags: [nextjs, supabase, auth, middleware, server-actions, zod, react-hook-form, shadcn, vitest, typescript]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Next.js 16 scaffold, Drizzle schema (profiles table), Supabase clients, zod, react-hook-form"
provides:
  - middleware.ts with getUser() dual cookie pattern (session refresh + protected route redirect)
  - /auth/callback route handler (email verification and password recovery token exchange)
  - Five Server Actions in src/actions/auth.ts (registerUser, signIn, signOut, resetPassword, updatePassword)
  - Five auth pages in src/app/(auth)/ (login, register, verify-email, reset-password, update-password)
  - Three form components (LoginForm, ResetPasswordForm, RegisterForm with cities dropdown)
  - (auth) layout with centered card and CityLocal wordmark
  - 24 auth tests passing (middleware, callback, register, reset)
affects: [01-03, 01-04, 02-foundation]

# Tech tracking
tech-stack:
  added:
    - shadcn input component
    - shadcn label component
    - shadcn card component
  patterns:
    - "Server Action pattern: (formData: FormData) => Promise<{error: FieldErrors} | {success: true} | undefined>"
    - "Zod v4 uses z.infer<typeof schema> not schema._type for TypeScript inference"
    - "useActionState cast pattern: action as unknown as (state, formData) => Promise<State>"
    - "middleware.ts dual cookie setAll: MUST update both request.cookies AND supabaseResponse.cookies"
    - "getUser() not getSession() in middleware — validates JWT against Supabase servers"
    - "registerUser creates profiles row with same UUID as auth.users after signUp()"
    - "Callback route handles both type=email (redirect to /) and type=recovery (redirect to /update-password)"

key-files:
  created:
    - middleware.ts
    - src/app/auth/callback/route.ts
    - src/actions/auth.ts
    - src/components/auth/LoginForm.tsx
    - src/components/auth/RegisterForm.tsx
    - src/components/auth/ResetPasswordForm.tsx
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/app/(auth)/verify-email/page.tsx
    - src/app/(auth)/reset-password/page.tsx
    - src/app/(auth)/update-password/page.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/card.tsx
  modified:
    - tests/middleware.test.ts
    - tests/auth/callback.test.ts
    - tests/auth/register.test.ts
    - tests/auth/reset.test.ts

key-decisions:
  - "Zod v4 uses z.infer<typeof schema> not schema._type — using named types via z.infer is cleaner and version-safe"
  - "useActionState with Server Actions requires double cast (as unknown as) due to TypeScript's type narrowing on function signatures"
  - "Middleware test imports use relative path (../middleware) not @/middleware — @/* alias maps to ./src/* only"
  - "update-password page is 'use client' because useActionState is client-side; no Metadata export needed"
  - "register/page.tsx catches DB errors silently to allow build without DATABASE_URL"

patterns-established:
  - "Pattern: Server Action returns discriminated union {error: FieldErrors} | {success: true} | undefined"
  - "Pattern: Test discriminated unions with 'error' in result narrowing (not optional chaining)"
  - "Pattern: Auth callback handles both email and recovery OTP types in single route handler"
  - "Pattern: middleware.ts must be at project root (not src/) for Next.js App Router"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, ROLE-01]

# Metrics
duration: 7min
completed: 2026-03-16
---

# Phase 1 Plan 02: Auth Flows Summary

**Full Supabase auth implementation: middleware with session refresh, email verification callback, 5 Server Actions with Zod validation, 5 auth pages, and 3 form components — 24 tests passing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-16T15:05:24Z
- **Completed:** 2026-03-16T15:12:02Z
- **Tasks:** 2 completed
- **Files modified:** 19

## Accomplishments
- middleware.ts uses getUser() (not getSession()) with dual cookie setAll pattern for correct session refresh
- /auth/callback route handles both email verification (token_hash+type=email) and password recovery (type=recovery)
- 5 Server Actions with Zod validation: registerUser creates profiles row with matching UUID, signIn, signOut, resetPassword (no redirect — shows confirmation), updatePassword
- 5 auth pages in (auth) route group with shared centered card layout
- 3 form components using useActionState for Server Action error display
- RegisterForm includes home city dropdown populated from cities table (ROLE-01 at data layer)
- 24 tests passing across middleware, callback, register, and reset suites

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing middleware and callback tests** - `e83f73c` (test)
2. **Task 1 GREEN: Middleware and /auth/callback implementation** - `5304362` (feat)
3. **Task 2 RED: Failing register and reset tests** - `76f91cd` (test)
4. **Task 2 GREEN: Server Actions, auth pages, form components** - `67f5263` (feat)

## Files Created/Modified
- `middleware.ts` - Session refresh with getUser() + dual cookie setAll, protected route redirect
- `src/app/auth/callback/route.ts` - verifyOtp for email and recovery token types
- `src/actions/auth.ts` - 5 Server Actions with Zod schemas and TypeScript discriminated union return types
- `src/components/auth/LoginForm.tsx` - Email/password login with useActionState error display
- `src/components/auth/RegisterForm.tsx` - Registration form with home city dropdown
- `src/components/auth/ResetPasswordForm.tsx` - Password reset with success message on submit
- `src/app/(auth)/layout.tsx` - Shared auth layout with centered card
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/register/page.tsx` - Register page (server component fetching cities)
- `src/app/(auth)/verify-email/page.tsx` - Static "check your inbox" holding page
- `src/app/(auth)/reset-password/page.tsx` - Reset password request page
- `src/app/(auth)/update-password/page.tsx` - Set new password page (client component with form)
- `src/components/ui/{input,label,card}.tsx` - shadcn/ui components added

## Decisions Made
- **Zod v4 type inference**: Used `z.infer<typeof schema>` with named types instead of `schema._type`. The `_type` property was removed in Zod v4.
- **useActionState cast**: Server Actions return `(formData: FormData)` but useActionState expects `(prevState, formData)` — required `as unknown as` double cast.
- **Middleware relative import in tests**: The `@/*` tsconfig alias maps to `./src/*`, so `middleware.ts` at root must be imported as `../middleware` in tests.
- **update-password as client component**: Uses `useActionState` so must be `'use client'`. Page exports a default component directly — no separate Metadata export needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 removed `schema._type` property**
- **Found during:** Task 2 (TypeScript type check after implementing auth.ts)
- **Issue:** `npx tsc --noEmit` reported 12 errors: `Property '_type' does not exist` on Zod schemas. Zod v4 (installed as zod@4.3.6) removed the `_type` internal property.
- **Fix:** Replaced all `typeof schema._type` usages with `z.infer<typeof schema>` and extracted named type aliases (`RegisterInput`, `SignInInput`, etc.)
- **Files modified:** src/actions/auth.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 67f5263 (Task 2 commit)

**2. [Rule 1 - Bug] useActionState type cast incompatibility**
- **Found during:** Task 2 (TypeScript type check after implementing form components)
- **Issue:** TypeScript reported type incompatibility when casting Server Actions (which take `formData: FormData`) for use with `useActionState` (which expects `(prevState, formData)`). Standard single cast insufficient.
- **Fix:** Used `as unknown as (state, formData) => Promise<State>` double cast in all 4 form components/pages.
- **Files modified:** LoginForm.tsx, RegisterForm.tsx, ResetPasswordForm.tsx, update-password/page.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 67f5263 (Task 2 commit)

**3. [Rule 1 - Bug] Middleware test import path — @/middleware alias doesn't resolve to root**
- **Found during:** Task 1 (first test run for middleware)
- **Issue:** Tests used `@/middleware` import but `@/*` in tsconfig.json maps to `./src/*` — middleware.ts lives at root, not src/. Vite resolution failed.
- **Fix:** Changed middleware test imports to relative `../middleware` path
- **Files modified:** tests/middleware.test.ts
- **Verification:** All 6 middleware tests pass
- **Committed in:** 5304362 (Task 1 feat commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — API version changes and path resolution)
**Impact on plan:** All auto-fixes necessary due to library version differences (Zod v4) and Next.js path alias convention. Functionally equivalent to plan spec. No scope creep.

## Issues Encountered
None beyond the API changes documented above.

## User Setup Required
**External services require manual configuration.** Supabase auth flows require environment variables to be set:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
- `NEXT_PUBLIC_SITE_URL` — Production site URL (used in email redirect URLs)
- `DATABASE_URL` — For the register action to insert into profiles table

Auth callbacks also require configuring Supabase dashboard:
- Set Site URL to `NEXT_PUBLIC_SITE_URL` in Supabase Auth settings
- Add `/auth/callback` to allowed redirect URLs

## Next Phase Readiness
- Auth foundation complete — sessions, registration, email verification, password reset all wired end-to-end
- middleware.ts in place — protected routes redirect unauthenticated users to /login
- profiles row created on registration — ready for 01-03 role queries
- Cities dropdown in RegisterForm ready for cities data once Supabase + seed data is available

---
*Phase: 01-foundation*
*Completed: 2026-03-16*
