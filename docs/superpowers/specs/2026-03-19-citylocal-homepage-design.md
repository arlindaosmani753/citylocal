# CityLocal Homepage Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Add a public landing page at `/` for CityLocal — the local city discovery platform. Currently, unauthenticated visitors are immediately redirected to `/login`. This spec defines a homepage that gives visitors context about the product before prompting them to register.

---

## Problem

- The root route `/` is not in the middleware's `isPublicPath` list, so unauthenticated users are redirected to `/login` instantly
- The `src/app/page.tsx` file contains the default Next.js starter template — no product content at all
- Visitors have no way to understand what CityLocal is before being asked to create an account

---

## Design Decisions

### Layout: Feature Grid + Community Story (Option C)
Visual grid showcasing the platform's core value with a community-oriented angle. Chosen for its ability to communicate both features and social context at a glance.

### Sections
1. **Navbar** — CITYLOCAL wordmark left, "Sign in" (ghost) + "Join free" (indigo) right
2. **Hero** — indigo pill badge ("LOCAL KNOWLEDGE, SHARED"), bold headline, subtext, dual CTAs, "No credit card · Free forever" note
3. **How it Works** — 3 numbered cards on a light grey background: Search → Browse → Join
4. **Footer strip** — wordmark + year, minimal

Sections intentionally kept to two (Hero + How it Works) — enough to communicate value without overwhelming a first-time visitor.

### Visual Style
- **Colors:** Black, white, indigo-600 as the single accent. Indigo-50 used for the hero badge background. Dark mode is **not supported** on this page — wrap the root element with `className="bg-white text-gray-900"` and use only explicit light Tailwind color classes (e.g. `bg-indigo-600`, `text-indigo-600`, `bg-indigo-50`, `bg-gray-50`, `text-gray-500`). Do **not** add any `dark:` variant classes. This overrides the system-level dark mode that the rest of the app uses.
- **Icons:** Import `Search`, `Map`, `Users` from `lucide-react` (already a project dependency). Render them inside indigo circle badge `<div>`s — do not use inline SVG strings.
- **Typography:** Existing font stack (Geist Sans via `--font-sans`). No new fonts.
- **No emojis** anywhere on the page.

### Copy
- Headline: *"Your city, from the inside"*
- Subtext: *"Places, events and reviews from locals who actually live there — not tourists, not algorithms."*
- How it Works title: *"Three steps to your city"*
- Steps: Search a city → Browse the feed → Join & contribute
- Primary CTA: *"Create free account"* → `/register`
- Secondary CTA: *"Sign in"* → `/login`

---

## Technical Changes

### 1. Middleware — make `/` public
Add `path === '/'` to the existing `isPublicPath` check. **Only this one condition is new** — all other entries already exist in the middleware.

**File:** `middleware.ts`

```ts
const isPublicPath =
  path === '/' ||              // ← only this line is new
  path.startsWith('/login') ||
  path.startsWith('/register') ||
  path.startsWith('/auth') ||
  path.startsWith('/cities') ||
  path.startsWith('/profile')
```

**Authenticated users on `/`:** No redirect. Authenticated users see the same homepage as logged-out users. The page is **not auth-aware** — always render the unauthenticated nav ("Sign in" + "Join free"). No `getUser()` call, no conditional nav items. This keeps the page fully static and simple.

### 2. Replace `src/app/page.tsx`
Replace the default Next.js starter content with the homepage component. The page is a server component (no `'use client'` needed — no interactivity required).

**Structure:**
```
<div>
  <nav>          — CITYLOCAL + Sign in / Join free
  <main>
    <section>    — Hero
    <section>    — How it Works
  </main>
  <footer>       — wordmark + year
</div>
```

Use `next/link` for CTAs (not `<a>` tags). Tailwind utility classes throughout — no new CSS files. Import icons from `lucide-react`.

**Layout container:** All sections use a centred container: `max-w-4xl mx-auto px-6`.

**Responsive behaviour:**
- Navbar: both "Sign in" and "Join free" always visible — no collapse on mobile
- Hero: single column, centred, full width at all breakpoints
- How it Works cards: 3 columns on `sm` and above (`sm:grid-cols-3`), single column stacked on mobile (`grid-cols-1`)

**How it Works — full card content:**

| Step | Icon (`lucide-react`) | Heading | Body copy |
|------|----------------------|---------|-----------|
| 1 | `Search` | Search a city | Find your city or discover somewhere new |
| 2 | `Map` | Browse the feed | Places, events and local reviews — on a map |
| 3 | `Users` | Join & contribute | Add your own picks and help your community |

The `Map` icon for step 2 is intentional — the feed includes a city map view, making it accurate and not misleading.

**Note on middleware path matching:** Next.js strips route group segments (e.g. `(auth)`) from the URL. So `src/app/(auth)/login/page.tsx` is reached at `/login`, not `/(auth)/login`. The existing `path.startsWith('/login')` in the middleware is correct as-is.

---

## Out of Scope

- City search bar on the homepage (not requested)
- Social proof / stats section (not selected)
- Bottom CTA banner (not selected)
- Dark mode styling (homepage explicitly uses light-mode-only classes; dark mode is not supported on this page)
- Any database queries or dynamic data on the homepage (fully static)

---

## Success Criteria

- Visiting `citylocal.arlindaosmani.site` as a logged-out user shows the homepage (not a redirect to `/login`)
- "Join free" and "Create free account" both navigate to `/register`
- "Sign in" navigates to `/login`
- Page is fully static — no loading states, no data fetching
- Design matches approved mockup: indigo accent, Lucide icons, two sections
