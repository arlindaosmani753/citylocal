# CityLocal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default Next.js starter page at `/` with a public CityLocal landing page (Hero + How it Works), and update the middleware so unauthenticated visitors are no longer redirected to `/login` when visiting the root route.

**Architecture:** Two-file change. First update `middleware.ts` to whitelist `/` as a public path. Then fully replace `src/app/page.tsx` with a static server component — no data fetching, no client interactivity, no auth checks. All styling via Tailwind utility classes; icons from `lucide-react`.

**Tech Stack:** Next.js 15 (App Router, server components), Tailwind CSS, `lucide-react`, `next/link`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `middleware.ts` | Modify (1 line) | Add `path === '/'` to `isPublicPath` |
| `src/app/page.tsx` | Replace entirely | Homepage: Navbar + Hero + How it Works + Footer |

No new files. No new dependencies.

---

### Task 1: Make `/` a public route in middleware

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Open `middleware.ts` and locate `isPublicPath`**

  The block currently reads:
  ```ts
  const isPublicPath =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/auth') ||
    path.startsWith('/cities') ||
    path.startsWith('/profile')
  ```

- [ ] **Step 2: Add `path === '/'` as the first condition**

  ```ts
  const isPublicPath =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/auth') ||
    path.startsWith('/cities') ||
    path.startsWith('/profile')
  ```

  Only `path === '/'` is new — leave all other lines exactly as they are.

- [ ] **Step 3: Verify the app still builds**

  ```bash
  cd /root && source ~/.bashrc && npm run build 2>&1 | tail -20
  ```

  Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

  ```bash
  git add middleware.ts
  git commit -m "feat: make / a public route for the homepage"
  ```

---

### Task 2: Build the homepage

**Files:**
- Modify: `src/app/page.tsx` (full replacement)

- [ ] **Step 1: Replace the entire contents of `src/app/page.tsx`**

  The page is a server component — no `'use client'` directive. Paste this exactly:

  ```tsx
  import Link from 'next/link'
  import { Search, Map, Users } from 'lucide-react'

  export default function HomePage() {
    return (
      <div className="min-h-screen bg-white text-gray-900">

        {/* Navbar */}
        <nav className="border-b border-gray-100 bg-white">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
            <span className="text-sm font-bold tracking-widest text-gray-900">
              CITYLOCAL
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Join free
              </Link>
            </div>
          </div>
        </nav>

        <main>
          {/* Hero */}
          <section className="bg-white border-b border-gray-100 py-20 text-center">
            <div className="max-w-4xl mx-auto px-6">
              <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full mb-6">
                LOCAL KNOWLEDGE, SHARED
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                Your city,<br />from the inside
              </h1>
              <p className="text-base text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                Places, events and reviews from locals who actually live there — not tourists, not algorithms.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create free account
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 border border-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-400">No credit card · Free forever</p>
            </div>
          </section>

          {/* How it Works */}
          <section className="bg-gray-50 py-16">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
                  How it works
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  Three steps to your city
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    icon: Search,
                    step: '1',
                    heading: 'Search a city',
                    body: 'Find your city or discover somewhere new',
                  },
                  {
                    icon: Map,
                    step: '2',
                    heading: 'Browse the feed',
                    body: 'Places, events and local reviews — on a map',
                  },
                  {
                    icon: Users,
                    step: '3',
                    heading: 'Join & contribute',
                    body: 'Add your own picks and help your community',
                  },
                ].map(({ icon: Icon, step, heading, body }) => (
                  <div
                    key={step}
                    className="bg-white border border-gray-200 rounded-xl p-6 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{heading}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-4">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-gray-300">CITYLOCAL</span>
            <span className="text-xs text-gray-300">© 2026</span>
          </div>
        </footer>

      </div>
    )
  }
  ```

- [ ] **Step 2: Verify the build succeeds**

  ```bash
  cd /root && source ~/.bashrc && npm run build 2>&1 | tail -20
  ```

  Expected: no TypeScript or build errors. The homepage is fully static so no data-fetching warnings are expected.

- [ ] **Step 3: Spot-check the running app**

  The app runs with PM2. Restart it and open the homepage:

  ```bash
  pm2 restart all && sleep 3
  ```

  Then visit `http://citylocal.arlindaosmani.site` in the browser (logged out). You should see:
  - Navbar with CITYLOCAL wordmark + "Sign in" + indigo "Join free" button
  - Hero with indigo pill badge, large headline, two CTA buttons
  - "How it Works" section on a grey background with 3 white cards, each with an indigo icon circle
  - Minimal footer

  Verify:
  - "Join free" and "Create free account" both go to `/register`
  - "Sign in" goes to `/login`
  - No redirect occurs — the homepage loads directly for logged-out users

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: add CityLocal homepage with hero and how it works sections"
  ```

---

## Done

Both success criteria from the spec are now satisfied:
1. Unauthenticated visitors land on the homepage instead of being redirected to `/login`
2. The page matches the approved design: indigo accent, Lucide icons, Hero + How it Works sections
