# Phase 1: Foundation - Research

**Researched:** 2026-03-13
**Domain:** Authentication (Supabase Auth + @supabase/ssr), per-city role model (behavior-based), database schema foundation (drizzle-orm + PostgreSQL), soft-delete data model, Next.js App Router middleware
**Confidence:** HIGH (auth and middleware patterns verified against official Supabase and Next.js docs; shadcn/ui Tailwind v4 support verified; drizzle patterns verified against official docs and community sources)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create an account with email and password | Supabase `signUp()` with email + password; email redirect to `/auth/callback` route handler |
| AUTH-02 | User receives email verification link after signup and must verify before posting | Supabase email confirm enabled by default; `/auth/callback` route exchanges `token_hash` via `verifyOtp()`; middleware blocks posting until `email_confirmed_at` is set |
| AUTH-03 | User can request a password reset via email link | Supabase `resetPasswordForEmail()` + `/auth/callback?type=recovery` + `updateUser({ password })` |
| AUTH-04 | User session persists across browser refresh | Cookie-based sessions via `@supabase/ssr`; middleware refreshes tokens on every request; `createServerClient` reads cookies in Server Components |
| ROLE-01 | User declares a home city when registering (self-declared local) | `profiles` table with `home_city_id FK → cities`; set during registration form alongside `signUp()` call; stored in app DB, not Supabase user_metadata |
| ROLE-02 | User earns confirmed local status in a city after 3+ GPS-verified posts from that city | `user_city_roles` table tracks earned local status per city; computed from post history in Phase 2, data model created here |
| ROLE-03 | Any authenticated user can rate/review content (role enforcement is in place for post gating) | `requireAuth` middleware created here; role enforcement gates post creation; review gating is a simpler auth check |
| ROLE-04 | User has a public profile page showing their contributions and average rating received | `profiles` table with public display fields; `/profile/[username]` route; contributions pulled from posts table (Phase 2 will have data) |
</phase_requirements>

---

## Summary

Phase 1 establishes the identity and data-model foundation that every subsequent phase depends on. It has three technical pillars: (1) Supabase Auth wired into Next.js App Router via `@supabase/ssr` with cookie-based sessions, (2) a per-city role model where local status is earned by behavior (tracked in `user_city_roles`) rather than declared at signup, and (3) a complete database schema with soft-delete, content status, and report mechanism baked in from day one.

The stack is well-understood and all major integration points are verified against official documentation. The single highest-risk item is the two-client architecture required by `@supabase/ssr`: a browser client for Client Components, a server client for Server Components/Actions/Route Handlers, and middleware that refreshes tokens on every request. Skipping any of the three layers causes session bugs that are hard to diagnose. The pattern is fully documented and must be followed exactly.

The per-city role model requires a design decision: `user_city_roles` table vs. inferring local status at query time from post history. Research recommends a `user_city_roles` table that is computed from post history and written by a trigger or server-side function — giving both auditability and query speed. The schema must be correct before any users exist; retrofitting a per-city role model after users are in the database is painful.

**Primary recommendation:** Follow the official Supabase + Next.js App Router pattern exactly (three-client architecture), create the `user_city_roles` table now even though it will remain empty until Phase 2 GPS verification, and bake `deleted_at` + `status` + `flagged` columns into every content table from the start.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x (App Router) | Full-stack framework | Official docs confirm v16.x stable; App Router Server Actions handle auth forms natively |
| React | 19.x | UI layer | Required by Next.js 16; `useActionState` and `useOptimistic` power auth forms without extra state management |
| TypeScript | 5.1+ | Type safety | Required by Next.js 16; essential for auth token shape validation |
| Tailwind CSS | 4.x | Styling | v4 released Jan 2025; CSS-first config; `@import "tailwindcss"` only |
| shadcn/ui | latest (stable, Tailwind v4 supported) | UI components | As of Feb 2025, shadcn/ui stable supports Tailwind v4 with full React 19 support; canary no longer required |
| @supabase/supabase-js | 2.x | Supabase client | Core Supabase SDK |
| @supabase/ssr | latest | SSR auth helpers | Required for cookie-based sessions in Next.js App Router; replaces deprecated `@supabase/auth-helpers-nextjs` |
| drizzle-orm | 0.39+ | Type-safe ORM | Raw SQL escape hatch for PostGIS; no binary query engine; direct PostgreSQL connection |
| drizzle-kit | 0.30+ | Schema migrations | Paired with drizzle-orm; `drizzle-kit push` for dev, `drizzle-kit migrate` for production |
| postgres (postgres-js) | 3.x | PostgreSQL driver | drizzle-orm's preferred driver; disable `{ prepare: false }` for Supabase connection pooler (Transaction mode) |
| zod | 3.x | Schema validation | Validate auth inputs (email format, password strength) in Server Actions before touching Supabase |
| react-hook-form | 7.x | Form state | Registration and login forms with `useActionState` fallback |
| @hookform/resolvers | 3.x | Zod adapter | Bridge between react-hook-form and zod schemas |
| @t3-oss/env-nextjs | latest | Env validation | Validate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` at build time |
| lucide-react | latest | Icons | shadcn/ui default icon set; covers user, lock, map-pin needed in Phase 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | Date utilities | Profile timestamps, "member since" display |
| vitest | latest | Unit testing | Test schema utilities, role check functions, zod validators |
| @testing-library/react | latest | Component testing | Test auth form components |
| @vitejs/plugin-react | latest | Vitest React plugin | Required for component tests |
| jsdom | latest | DOM environment | Required for vitest browser environment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui stable (Tailwind v4) | shadcn/ui canary | As of Feb 2025 the stable branch supports Tailwind v4; canary no longer needed for v4 |
| Supabase Auth | NextAuth.js v5 (Auth.js) | Auth.js gives more flexibility for custom providers but adds complexity; Supabase Auth is simpler for email/password + Supabase DB combination |
| drizzle-orm | Prisma | Prisma has no native PostGIS support — all geospatial queries require raw SQL anyway, eliminating its DX advantage |
| `user_city_roles` table | Computed from post history | Computed approach avoids a table but makes "is this user a local here?" queries expensive; table is worth the write complexity |

**Installation:**
```bash
npx create-next-app@latest citylocal --typescript --tailwind --eslint --app --turbopack
cd citylocal

# Database ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Validation and forms
npm install zod react-hook-form @hookform/resolvers

# UI and utilities
npm install lucide-react date-fns @t3-oss/env-nextjs

# shadcn/ui (copies components, not a dependency)
npx shadcn@latest init

# Testing
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # sign-in form
│   │   ├── register/page.tsx       # sign-up form + home city selection
│   │   ├── verify-email/page.tsx   # "check your inbox" holding page
│   │   ├── reset-password/page.tsx # request reset link form
│   │   └── update-password/page.tsx # new password form (after callback)
│   ├── auth/
│   │   └── callback/route.ts       # handles token_hash from email links
│   ├── profile/
│   │   └── [username]/page.tsx     # public profile (ROLE-04)
│   └── layout.tsx                  # root layout
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient — Client Components only
│   │   └── server.ts               # createServerClient — Server Components, Actions, Route Handlers
│   ├── db/
│   │   ├── schema.ts               # drizzle table definitions (all Phase 1 tables)
│   │   ├── index.ts                # db client singleton (postgres-js driver)
│   │   └── migrations/             # generated by drizzle-kit
│   └── env.ts                      # @t3-oss/env-nextjs validated env vars
├── middleware.ts                    # Supabase session refresh (EVERY route)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ResetPasswordForm.tsx
│   └── ui/                         # shadcn/ui components (button, input, card, etc.)
└── actions/
    └── auth.ts                     # Server Actions: signUp, signIn, signOut, resetPassword
```

### Pattern 1: Three-Client Supabase Architecture (CRITICAL)

**What:** @supabase/ssr requires exactly three separate Supabase client utilities. Using the wrong client in the wrong context causes session bugs.

**When to use:** Always — this is not optional, it is the required architecture.

**The three clients:**

```typescript
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth

// 1. Browser client: lib/supabase/client.ts
// Use ONLY in 'use client' components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// 2. Server client: lib/supabase/server.ts
// Use in Server Components, Server Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* ignore in Server Components */ }
        },
      },
    }
  )
}

// 3. Middleware: middleware.ts
// Runs on EVERY non-static request to refresh tokens
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession() — validates JWT against Supabase servers
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isAuthRoute && !request.nextUrl.pathname.startsWith('/cities')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Pattern 2: Email Verification Callback Route

**What:** Supabase sends a link with `token_hash` and `type` query params. A Route Handler must exchange these for a session.

**When to use:** Required for AUTH-02 (email verification) and AUTH-03 (password reset).

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'magiclink' | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // For password reset, redirect to update-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### Pattern 3: Drizzle Schema with Soft-Delete Foundation

**What:** All content tables include `deleted_at`, `status`, and a `reports` table from day one. Never removed — only `deleted_at` is set.

**When to use:** Every table that holds user-created content.

```typescript
// Source: verified against https://orm.drizzle.team/docs/column-types/pg
// lib/db/schema.ts

import {
  pgTable, pgEnum, uuid, text, timestamp, integer,
  boolean, varchar, decimal, index, uniqueIndex
} from 'drizzle-orm/pg-core'

// Enums
export const contentStatusEnum = pgEnum('content_status', ['active', 'hidden', 'removed'])
export const reportReasonEnum = pgEnum('report_reason', ['spam', 'inappropriate', 'fake', 'other'])

// Shared timestamp columns pattern
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),  // soft-delete: null = active
}

// Cities (seed data: Paris)
export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),  // 'paris-france'
  name: varchar('name', { length: 200 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
  lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
  radiusKm: decimal('radius_km', { precision: 5, scale: 2 }).notNull().default('25'),
  timezone: varchar('timezone', { length: 100 }).notNull(),
  ...timestamps,
})

// User profiles (extends Supabase auth.users)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),          // FK to auth.users.id — same UUID
  username: varchar('username', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  homeCityId: uuid('home_city_id').references(() => cities.id),  // ROLE-01: self-declared home city
  avatarUrl: text('avatar_url'),
  ...timestamps,
})

// Per-city role tracking (ROLE-02: behavior-based local status)
// Populated by trigger/function in Phase 2 when GPS-verified post count >= 3
export const userCityRoles = pgTable('user_city_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'cascade' }),
  isLocal: boolean('is_local').notNull().default(false),   // true = earned local status
  verifiedPostCount: integer('verified_post_count').notNull().default(0),
  localSince: timestamp('local_since', { withTimezone: true }),  // when 3rd post was verified
  ...timestamps,
}, (table) => ({
  userCityUniq: uniqueIndex('user_city_roles_user_city_unique').on(table.userId, table.cityId),
  userIdx: index('user_city_roles_user_idx').on(table.userId),
  cityIdx: index('user_city_roles_city_idx').on(table.cityId),
}))

// Unified posts table (places + events — Phase 2 will add GPS-gated creation)
// Define here so foreign keys work; content_type 'event' used in Phase 5
export const contentTypeEnum = pgEnum('content_type', ['place', 'event'])

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  cityId: uuid('city_id').notNull().references(() => cities.id),
  authorId: uuid('author_id').notNull().references(() => profiles.id),
  contentType: contentTypeEnum('content_type').notNull().default('place'),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body'),
  category: varchar('category', { length: 50 }),
  // GPS fields — populated in Phase 2; nullable now
  lat: decimal('lat', { precision: 10, scale: 7 }),
  lng: decimal('lng', { precision: 10, scale: 7 }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  // Event-specific — populated in Phase 5; nullable now
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  // Moderation
  status: contentStatusEnum('status').notNull().default('active'),
  flagCount: integer('flag_count').notNull().default(0),
  ...timestamps,
}, (table) => ({
  cityCreatedIdx: index('posts_city_created_idx').on(table.cityId, table.createdAt),
  authorIdx: index('posts_author_idx').on(table.authorId),
  statusIdx: index('posts_status_idx').on(table.status),
}))

// Reports/flags (RATE-03 data model — built here, UI in Phase 4)
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => profiles.id),
  targetType: varchar('target_type', { length: 20 }).notNull(),  // 'post' | 'review'
  targetId: uuid('target_id').notNull(),
  reason: reportReasonEnum('reason').notNull(),
  details: text('details'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  targetIdx: index('reports_target_idx').on(table.targetType, table.targetId),
  reporterIdx: index('reports_reporter_idx').on(table.reporterId),
}))
```

### Pattern 4: Registration Flow with Profile Creation

**What:** Supabase `signUp()` creates the auth.users record; a Server Action immediately creates the matching `profiles` row. These must be atomic or at least transactional in intent.

**When to use:** User registration (AUTH-01, ROLE-01).

```typescript
// Source: Supabase auth docs + drizzle-orm patterns
// actions/auth.ts (Server Action)

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  username: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/),
  homeCityId: z.string().uuid().optional(),
})

export async function registerUser(formData: FormData) {
  const validated = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: formData.get('username'),
    homeCityId: formData.get('homeCityId') || undefined,
  })

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  // Step 1: Create auth.users record
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (authError || !authData.user) {
    return { error: { _form: [authError?.message ?? 'Registration failed'] } }
  }

  // Step 2: Create profiles record with same UUID
  await db.insert(profiles).values({
    id: authData.user.id,           // same UUID as auth.users
    username: validated.data.username,
    homeCityId: validated.data.homeCityId ?? null,
  })

  redirect('/verify-email')
}
```

### Anti-Patterns to Avoid

- **Using `getSession()` on the server:** `getSession()` does not revalidate the JWT against Supabase Auth servers. Always use `getUser()` in Server Components, Server Actions, and middleware to protect pages.
- **Using `@supabase/auth-helpers-nextjs`:** This package is deprecated. Use `@supabase/ssr` exclusively.
- **Storing role in Supabase `user_metadata`:** User metadata can be modified by the client. Store role-affecting data in your own `profiles` and `user_city_roles` tables, checked server-side.
- **Global role flag instead of per-city:** A `role: 'local' | 'tourist'` column on `profiles` is insufficient — a user must be able to be a local in Paris and a tourist in Berlin simultaneously. Use `user_city_roles` from day one.
- **Hard-deleting records:** All content tables use soft-delete. Set `deleted_at = now()` and `status = 'removed'`. Never `DELETE FROM`.
- **Skipping the `profiles` row after `signUp()`:** Supabase creates `auth.users` but your application tables need a `profiles` row. If you skip this step, the profile page (ROLE-04) and all foreign keys break.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT handling, cookie parsing | `@supabase/ssr` `createBrowserClient` / `createServerClient` | Token refresh, PKCE flow, secure cookie storage — all edge cases handled |
| Email verification | Custom token generation and expiry | Supabase Auth built-in email confirm | Rate limiting, token expiry, secure link generation are complex |
| Password reset | Custom secure token generation | Supabase `resetPasswordForEmail()` | Brute-force protection, secure token storage are non-trivial |
| Password hashing | bcrypt/argon2 custom implementation | Supabase Auth | Supabase handles bcrypt internally; never access passwords |
| CSRF protection on forms | Custom CSRF tokens | Next.js Server Actions (built-in origin checks) | Server Actions have CSRF protection built in for same-origin |
| Environment variable validation | Runtime `process.env.X ?? throw` | `@t3-oss/env-nextjs` | Catches missing vars at build time, not after deployment |
| Input sanitization for XSS | Custom string sanitizer | Zod schema validation + React's escaping | React escapes JSX by default; Zod validates types and shapes |

**Key insight:** Supabase Auth handles the entire authentication lifecycle correctly. The only custom work needed is wiring the three client utilities and handling the callback route for email links. Everything else is a call to a Supabase method.

---

## Common Pitfalls

### Pitfall 1: Missing or Broken Middleware Token Refresh

**What goes wrong:** Sessions expire silently. User appears logged in on one page, then gets redirected to login on the next request. Very difficult to reproduce in development.

**Why it happens:** Next.js caches aggressively. If middleware doesn't call `supabase.auth.getUser()` on every request, expired tokens are not refreshed. Specifically: both `request.cookies.set` AND `supabaseResponse.cookies.set` must be called — if either is missing, the session cookie chain breaks.

**How to avoid:** Use the exact middleware pattern from Supabase docs verbatim. The `setAll` handler must update BOTH the request and the new response object. Do not simplify this code.

**Warning signs:** Users randomly lose sessions after a period of inactivity; "User is null" errors in Server Components for users who are clearly logged in.

### Pitfall 2: Profile Row Missing After Auth Signup

**What goes wrong:** `signUp()` succeeds but the `profiles` row is never created. All downstream queries that JOIN on `profiles.id` return nulls or throw foreign key violations.

**Why it happens:** Supabase creates `auth.users` but knows nothing about application tables. The profile creation is an application responsibility.

**How to avoid:** In the `registerUser` Server Action, always insert into `profiles` immediately after a successful `signUp()`. If the `profiles` insert fails, the user has a dangling auth record — add error handling to delete the auth user or surface the error clearly. Alternatively, use a Supabase database trigger on `auth.users` to auto-create a minimal `profiles` row as a safety net.

**Warning signs:** Profile pages (ROLE-04) return 404 or show empty data for newly registered users.

### Pitfall 3: Per-City Role Model Regression to Global Flag

**What goes wrong:** During implementation, a shortcut is taken: `profiles.role = 'local' | 'tourist'` is used for the Phase 1 role check instead of `user_city_roles`. This passes tests but corrupts the data model — fixing it in Phase 2 requires a migration and query rewrite.

**Why it happens:** The global flag is simpler to implement for the initial auth gates (AUTH-01 through AUTH-04 don't require per-city logic). The temptation is to defer the `user_city_roles` table to Phase 2.

**How to avoid:** Create `user_city_roles` in Phase 1 even though it remains empty. Write the role-check utility function against `user_city_roles` from the start, even if it always returns false for now. Phase 2 populates the table; Phase 1 creates it and creates the lookup pattern.

**Warning signs:** Code that reads `user.role` for posting permission — should always be `getUserCityRole(userId, cityId)`.

### Pitfall 4: shadcn/ui Initialization Overwriting Tailwind Config

**What goes wrong:** Running `npx shadcn@latest init` after manually configuring Tailwind v4 overwrites `globals.css` and creates a conflicting configuration.

**Why it happens:** shadcn init writes its own CSS variables and Tailwind directives. With Tailwind v4's CSS-first config, the merge is not always clean.

**How to avoid:** Run `npx shadcn@latest init` FIRST before any custom Tailwind configuration. Set `--style new-york` (default is now new-york since the toast → Sonner migration). Then add project-specific CSS on top. The `default` style is deprecated — use `new-york`.

**Warning signs:** Components render without styles; CSS variable `--background` conflicts; `tw-animate-css` import missing.

### Pitfall 5: `getUser()` Called Without Await in Server Components

**What goes wrong:** `const { data } = supabase.auth.getUser()` (missing await) returns a Promise object. Destructuring `data.user` succeeds but `user` is undefined. The user appears unauthenticated.

**Why it happens:** `getUser()` is async. TypeScript may not catch this if the return type is used loosely.

**How to avoid:** Always: `const { data: { user } } = await supabase.auth.getUser()`. Lint rule or wrapper function to enforce this.

---

## Code Examples

### Supabase Auth: Sign In

```typescript
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth
// Use in a Server Action or Client Component

const { error } = await supabase.auth.signInWithPassword({
  email: formData.get('email') as string,
  password: formData.get('password') as string,
})
```

### Supabase Auth: Password Reset Request

```typescript
// Source: Supabase Auth docs
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
})
```

### Supabase Auth: Update Password (after recovery callback)

```typescript
// Source: Supabase Auth docs
// Called from /update-password page after recovery callback sets session
const { error } = await supabase.auth.updateUser({ password: newPassword })
```

### Role Check: Is User a Local in This City?

```typescript
// Source: drizzle-orm docs + project schema
// lib/db/queries/roles.ts

import { db } from '@/lib/db'
import { userCityRoles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function isUserLocalInCity(userId: string, cityId: string): Promise<boolean> {
  const result = await db
    .select({ isLocal: userCityRoles.isLocal })
    .from(userCityRoles)
    .where(and(eq(userCityRoles.userId, userId), eq(userCityRoles.cityId, cityId)))
    .limit(1)

  return result[0]?.isLocal ?? false
}
```

### Drizzle: Query Non-Deleted Records

```typescript
// Source: https://subtopik.com/@if-loop/guides/implementing-soft-deletions-with-drizzle-orm-and-postgresql
import { isNull } from 'drizzle-orm'

const activePosts = await db
  .select()
  .from(posts)
  .where(and(eq(posts.cityId, cityId), isNull(posts.deletedAt), eq(posts.status, 'active')))
```

### Drizzle Config for Supabase (Transaction Pool Mode)

```typescript
// Source: https://orm.drizzle.team/docs/connect-supabase
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Transaction mode pooler: disable prepared statements
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle({ client, schema })
```

### drizzle.config.ts

```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 (now fully deprecated) | Must use `createBrowserClient` / `createServerClient` with `getAll`/`setAll` cookie methods only |
| `npx shadcn@canary init` for Tailwind v4 | `npx shadcn@latest init` | February 2025 (shadcn Tailwind v4 release) | Canary no longer needed; stable branch fully supports Tailwind v4 + React 19 |
| `tailwindcss-animate` | `tw-animate-css` | February 2025 (shadcn changelog) | shadcn installs `tw-animate-css` by default; `tailwindcss-animate` deprecated |
| shadcn `default` style | `new-york` style | 2025 (shadcn update) | `default` style deprecated; new projects use `new-york` |
| `toast` component (shadcn) | Sonner | 2025 (shadcn changelog) | `toast` deprecated in favor of Sonner for toasts/notifications |
| `supabase.auth.getSession()` on server | `supabase.auth.getUser()` | 2024 (security recommendation) | `getSession()` doesn't validate JWT on server; `getUser()` validates against Supabase servers |
| Tailwind config in `tailwind.config.js` | CSS-first: `@import "tailwindcss"` in globals.css | January 2025 (Tailwind v4) | No `tailwind.config.js` needed; automatic content detection |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated, no bug fixes. Use `@supabase/ssr`.
- `npx shadcn@canary init`: Canary no longer needed for Tailwind v4 support.
- `tailwindcss-animate`: Replaced by `tw-animate-css`.
- `moment.js`: Use `date-fns` (tree-shakeable, actively maintained).

---

## Open Questions

1. **Supabase project tier for PostGIS**
   - What we know: PostGIS is available on Supabase (mentioned in training data and research); drizzle connects via standard PostgreSQL
   - What's unclear: Whether PostGIS is enabled by default on free tier vs. needing manual activation; the exact `CREATE EXTENSION postgis;` requirement
   - Recommendation: Verify in Supabase dashboard when creating the project. Phase 1 doesn't use PostGIS directly (that's Phase 2), but the migration that enables it should be in Wave 0 of Phase 2's plan, not assumed.

2. **Profile creation atomicity**
   - What we know: `signUp()` creates `auth.users`; a subsequent drizzle insert creates `profiles`
   - What's unclear: If the profiles insert fails after a successful signUp, the user is in a broken state (auth record exists, no profile). No built-in rollback.
   - Recommendation: Use a Supabase database trigger (`AFTER INSERT ON auth.users`) to auto-create a minimal `profiles` row as a safety net. The Server Action still creates the full profile (with username, home_city_id), but the trigger prevents the dangling-auth-record problem.

3. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vs legacy anon key**
   - What we know: Supabase docs now reference `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_xxx` format); older docs use `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - What's unclear: Whether new projects get the new key format automatically, or if both formats are supported
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as the env var name (matches current docs). The value from the Supabase dashboard works regardless of format.

4. **Home city population at registration**
   - What we know: ROLE-01 requires declaring a home city at registration; cities table has Paris seeded
   - What's unclear: UX for city selection — a dropdown of seeded cities (v1 has only Paris), free-text with autocomplete, or skip for Phase 1?
   - Recommendation: Phase 1 should seed Paris and make home_city_id optional at registration. A simple dropdown showing seeded cities is sufficient. The field is nullable in schema.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest) + React Testing Library |
| Config file | `vitest.config.ts` — Wave 0 (does not exist yet) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `registerUser` Server Action validates input schema and returns errors | unit | `npx vitest run tests/auth/register.test.ts` | Wave 0 |
| AUTH-01 | `registerUser` inserts into `profiles` table after `signUp()` | integration | manual / Playwright | Wave 0 |
| AUTH-02 | `/auth/callback` route exchanges `token_hash` for session and redirects | unit | `npx vitest run tests/auth/callback.test.ts` | Wave 0 |
| AUTH-03 | `resetPassword` action calls `resetPasswordForEmail` with correct redirect | unit | `npx vitest run tests/auth/reset.test.ts` | Wave 0 |
| AUTH-04 | Middleware refreshes session cookie on every request | unit | `npx vitest run tests/middleware.test.ts` | Wave 0 |
| ROLE-01 | `profiles.homeCityId` is set during registration | unit | `npx vitest run tests/auth/register.test.ts` | Wave 0 |
| ROLE-02 | `isUserLocalInCity(userId, cityId)` returns false when verifiedPostCount < 3 | unit | `npx vitest run tests/roles/city-role.test.ts` | Wave 0 |
| ROLE-02 | `isUserLocalInCity(userId, cityId)` returns true when isLocal = true | unit | `npx vitest run tests/roles/city-role.test.ts` | Wave 0 |
| ROLE-03 | `requireAuth` middleware redirects unauthenticated users | unit | `npx vitest run tests/middleware.test.ts` | Wave 0 |
| ROLE-04 | Profile page renders username and displays zero contributions | unit | `npx vitest run tests/profile/profile-page.test.tsx` | Wave 0 |
| Schema | Soft-delete: `deletedAt` column exists and `isNull` filter works | unit | `npx vitest run tests/db/schema.test.ts` | Wave 0 |
| Schema | `user_city_roles` unique constraint on (user_id, city_id) | unit | `npx vitest run tests/db/schema.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/auth/ tests/roles/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — framework config with jsdom + vite-tsconfig-paths
- [ ] `tests/auth/register.test.ts` — covers AUTH-01, ROLE-01
- [ ] `tests/auth/callback.test.ts` — covers AUTH-02
- [ ] `tests/auth/reset.test.ts` — covers AUTH-03
- [ ] `tests/middleware.test.ts` — covers AUTH-04, ROLE-03
- [ ] `tests/roles/city-role.test.ts` — covers ROLE-02
- [ ] `tests/profile/profile-page.test.tsx` — covers ROLE-04
- [ ] `tests/db/schema.test.ts` — covers schema constraints (soft-delete, unique indexes)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`

---

## Sources

### Primary (HIGH confidence)

- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, `createServerClient`, `getUser()` vs `getSession()` security note
- [Supabase: AI Prompt for Next.js v16 + Supabase Auth](https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth) — complete code for all three client utilities, sign-up/sign-in patterns
- [Supabase: Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `createBrowserClient` and `createServerClient` API
- [shadcn/ui: Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — confirmed stable Tailwind v4 support as of Feb 2025; canary no longer required
- [shadcn/ui: Changelog](https://ui.shadcn.com/docs/changelog) — `tw-animate-css` replaces `tailwindcss-animate`; `new-york` style is now default
- [Drizzle ORM: Connect Supabase](https://orm.drizzle.team/docs/connect-supabase) — `{ prepare: false }` for transaction pool mode
- [Drizzle ORM: PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) — `uuid().defaultRandom()`, `timestamp`, `pgEnum` patterns
- [Drizzle ORM: Tutorials with Supabase](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — `drizzle.config.ts` pattern

### Secondary (MEDIUM confidence)

- [Implementing Soft Deletions with Drizzle ORM](https://subtopik.com/@if-loop/guides/implementing-soft-deletions-with-drizzle-orm-and-postgresql-s2qauA) — `deletedAt`, `isNull` filter pattern (WebSearch, verified against drizzle docs)
- [Drizzle ORM PostgreSQL Best Practices 2025](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717) — `$onUpdateFn()` for updatedAt, UUID patterns
- [Next.js: Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest) — Vitest setup for App Router
- [Supabase: Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) — custom JWT claims via Auth Hooks (v2 consideration)

### Tertiary (LOW confidence)

- None for Phase 1 — all critical patterns verified against official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions and install commands verified against official docs; shadcn/ui Tailwind v4 support confirmed as stable
- Architecture: HIGH — three-client Supabase pattern verified against official Supabase docs with code; drizzle patterns verified
- Pitfalls: HIGH — all five pitfalls are documented in Supabase official docs or directly observed in the three-client architecture requirement
- Schema design: MEDIUM-HIGH — pattern is standard; specific column choices for `user_city_roles` are project-specific decisions not externally documented

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days — stable APIs; monitor shadcn changelog for any further Tailwind v4 changes)
