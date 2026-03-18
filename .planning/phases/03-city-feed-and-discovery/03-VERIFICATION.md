---
phase: 03-city-feed-and-discovery
verified: 2026-03-18T19:16:30Z
status: passed
score: 4/4 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 2/4
  gaps_closed:
    - "A visitor can search for a city by name and navigate to its city page (FEED-03)"
    - "The city page has an interactive map view showing all places as pins (FEED-04)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "City feed page public accessibility"
    expected: "Visiting /cities/paris-france (or any seeded city) without being logged in should show the city feed — no redirect to /login"
    why_human: "Middleware logic verified in code but actual Supabase session behavior under no-cookie conditions requires a browser test"
  - test: "Category filter tab active state visual"
    expected: "The active category tab should visually appear selected/highlighted (CSS or styling)"
    why_human: "aria-current is verified but visual styling is not introspectable via grep"
  - test: "Interactive map renders in browser"
    expected: "Visiting /cities/[slug] in a browser should show a Leaflet map with markers for place posts — no blank div, no JS error"
    why_human: "react-leaflet is client-side only; jsdom tests mock the library; real tile loading and marker positioning requires a live browser"
---

# Phase 3: City Feed and Discovery — Verification Report (Re-verification)

**Phase Goal:** Any visitor can reach a city page and browse, filter, search, and map-locate all local posts
**Verified:** 2026-03-18T19:16:30Z
**Status:** passed
**Re-verification:** Yes — after gap closure (plans 03-03 and 03-04 executed)

## Goal Achievement

All four observable truths are now verified. The two previously-failed truths (FEED-03 city search, FEED-04 interactive map) have been implemented, tested, and wired.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A city page loads with a public, recency-first feed of all place posts and events for that city (FEED-01) | VERIFIED | `src/app/cities/[slug]/page.tsx` async Server Component with ISR=60; calls `getCityBySlug` + `getFeedForCity`; renders h1 + CategoryFilterTabs + FeedList; middleware marks `/cities` as public — unchanged from initial verification |
| 2 | The feed can be filtered by content category without a full page reload (FEED-02) | VERIFIED | `CategoryFilterTabs` has 9 Link-based tabs; correct hrefs; `aria-current="page"` on active tab; 5 passing tests — unchanged from initial verification |
| 3 | A visitor can search for a city by name and navigate to its city page (FEED-03) | VERIFIED | `src/app/cities/search/page.tsx` calls `searchCitiesByName`; `CitySearchForm` renders GET form to `/cities/search`; 4 UI tests + 5 query tests all pass (9 total); `searchCitiesByName` is no longer orphaned |
| 4 | The city page has an interactive map view showing all places as pins (FEED-04) | VERIFIED | `CityMap.tsx` (react-leaflet client component), `CityMapLoader.tsx` (server component calling `getPostsForMap`), wired into CityPage via `<Suspense><CityMapLoader cityId={city.id} /></Suspense>`; placeholder div removed; 4 map tests pass; all test.todo() stubs replaced |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/feed/feed-service.test.ts` | 14 real assertions for getFeedForCity + getPostsForMap | VERIFIED | Passing — unchanged |
| `tests/feed/city-page.test.tsx` | 3 real RTL tests for CityPage | VERIFIED | Passing — unchanged |
| `tests/feed/category-tabs.test.tsx` | 5 real RTL tests for CategoryFilterTabs | VERIFIED | Passing — unchanged |
| `tests/cities/city-search.test.ts` | 5 real assertions for getCityBySlug + searchCitiesByName | VERIFIED | Passing — unchanged |
| `tests/cities/city-search-page.test.tsx` | 4 RTL tests for CitySearchPage render behaviors | VERIFIED | NEW — 4 passing tests: form renders, city links, no-match message, initialQuery passed to input |
| `tests/map/city-map.test.tsx` | Real assertions for CityMap + CityMapLoader | VERIFIED | FIXED — all 4 test.todo() stubs replaced with real assertions; all 4 pass |
| `src/lib/db/queries/feed.ts` | getFeedForCity, getPostsForMap, FeedPost, FeedCursor, MapPin | VERIFIED | Unchanged |
| `src/lib/db/queries/cities.ts` | getCityBySlug, searchCitiesByName | VERIFIED | Unchanged |
| `src/app/cities/[slug]/page.tsx` | Async Server Component with ISR, notFound, getFeedForCity, CategoryFilterTabs, FeedList, CityMapLoader | VERIFIED | Updated — placeholder div replaced with `<Suspense><CityMapLoader cityId={city.id} /></Suspense>` |
| `src/app/cities/[slug]/loading.tsx` | Suspense skeleton | VERIFIED | Unchanged |
| `src/app/cities/search/page.tsx` | Server Component at /cities/search?q= | VERIFIED | NEW — imports `searchCitiesByName`; renders CitySearchForm; shows results or no-match message |
| `src/components/feed/FeedCard.tsx` | Card for a single FeedPost | VERIFIED | Unchanged |
| `src/components/feed/CategoryFilterTabs.tsx` | 9-tab Server Component, no 'use client' | VERIFIED | Unchanged |
| `src/components/feed/FeedList.tsx` | Maps FeedCards + empty state + Load more cursor link | VERIFIED | Unchanged |
| `src/components/city/CitySearchForm.tsx` | GET form submitting ?q= to /cities/search | VERIFIED | NEW — plain HTML form with `method="GET" action="/cities/search"` and `aria-label="Search for a city"` |
| `src/components/map/CityMap.tsx` | react-leaflet client component rendering MapPin[] markers | VERIFIED | NEW — 'use client'; MapContainer + TileLayer + Marker + Popup; parseFloat for lat/lng; Paris fallback center |
| `src/components/map/CityMapLoader.tsx` | Server Component calling getPostsForMap, dynamic import CityMap ssr:false | VERIFIED | NEW — async Server Component; `dynamic(() => import('./CityMap'), { ssr: false })`; awaits getPostsForMap |
| `public/marker-icon.png` | Leaflet default marker icon asset | VERIFIED | EXISTS — copied from node_modules/leaflet/dist/images/ |
| `public/marker-shadow.png` | Leaflet default marker shadow asset | VERIFIED | EXISTS — copied from node_modules/leaflet/dist/images/ |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/cities/[slug]/page.tsx` | `src/lib/db/queries/feed.ts` | `import getFeedForCity` | WIRED | Line 4 + called line 30 |
| `src/app/cities/[slug]/page.tsx` | `src/lib/db/queries/cities.ts` | `import getCityBySlug` | WIRED | Line 3 + called line 20 |
| `src/app/cities/[slug]/page.tsx` | `src/components/feed/CategoryFilterTabs.tsx` | renders `<CategoryFilterTabs>` | WIRED | Line 5 + rendered line 38 |
| `src/app/cities/[slug]/page.tsx` | `src/components/feed/FeedList.tsx` | renders `<FeedList>` | WIRED | Line 6 + rendered line 42 |
| `src/app/cities/[slug]/page.tsx` | `src/components/map/CityMapLoader.tsx` | renders `<CityMapLoader cityId={city.id}>` | WIRED | Line 7 import + line 49 render inside Suspense |
| `src/components/feed/FeedList.tsx` | `src/components/feed/FeedCard.tsx` | renders `<FeedCard>` | WIRED | Imported; used in map() |
| `src/app/cities/search/page.tsx` | `src/lib/db/queries/cities.ts` | `import searchCitiesByName` | WIRED | Line 2 import + line 21 call — FIXED (was orphaned) |
| `src/app/cities/search/page.tsx` | `src/components/city/CitySearchForm.tsx` | renders `<CitySearchForm initialQuery>` | WIRED | Line 3 import + lines 16 and 26 render |
| `src/components/city/CitySearchForm.tsx` | `/cities/search` | `form method="GET" action="/cities/search"` | WIRED | Line 7 — GET form submits ?q= param |
| `src/components/map/CityMapLoader.tsx` | `src/lib/db/queries/feed.ts` | `import getPostsForMap` | WIRED | Line 2 import + line 14 await call — FIXED (was orphaned) |
| `src/components/map/CityMapLoader.tsx` | `src/components/map/CityMap.tsx` | `dynamic(() => import('./CityMap'), { ssr: false })` | WIRED | Lines 4-7 |
| `src/components/map/CityMap.tsx` | `react-leaflet` | `import { MapContainer, TileLayer, Marker, Popup }` | WIRED | Line 4 |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FEED-01 | 03-00, 03-01, 03-02 | Each city has a public page showing a chronological feed of recent place posts and events | SATISFIED | City page implemented, public (middleware), ISR=60, getFeedForCity wired; 8 tests pass; REQUIREMENTS.md marked [x] |
| FEED-02 | 03-00, 03-01, 03-02 | City feed can be filtered by content category | SATISFIED | CategoryFilterTabs with 9 tabs, correct hrefs, aria-current; 5 tests pass; REQUIREMENTS.md marked [x] |
| FEED-03 | 03-00, 03-01, 03-03 | User can search for a city by name and navigate to its city page | SATISFIED | `/cities/search` page calls searchCitiesByName; CitySearchForm with GET submission; 9 tests pass (5 query + 4 UI); REQUIREMENTS.md marked [x] |
| FEED-04 | 03-00, 03-01, 03-04 | City page has an interactive map view showing all places as pins | SATISFIED | CityMap.tsx (react-leaflet), CityMapLoader.tsx (server, ssr:false dynamic), wired into CityPage; placeholder div gone; 4 map tests pass; REQUIREMENTS.md marked [x] |

No orphaned requirements — all four FEED-01 through FEED-04 IDs appear in plan frontmatter across all five plan files and are fully satisfied.

### Anti-Patterns Found

None. No TODO/FIXME/PLACEHOLDER comments in any production file. The `<div id="map-placeholder" />` blocker from the initial verification has been removed. All 4 test.todo() stubs in city-map.test.tsx have been replaced with real assertions.

| File | Line | Pattern | Severity | Notes |
|------|------|---------|----------|-------|
| `src/components/city/CitySearchForm.tsx` | 12 | `placeholder="Search cities..."` | Not a concern | HTML input placeholder attribute — legitimate, not a stub pattern |

### Human Verification Required

#### 1. City Feed Publicly Accessible Without Login

**Test:** Visit `/cities/paris-france` in an incognito browser window (no session)
**Expected:** City feed renders — no redirect to `/login`
**Why human:** Middleware code verified to include `/cities` in `isPublicPath`, but actual Supabase `getUser()` session behavior under no-cookie conditions requires a live browser test

#### 2. Category Filter Active Tab Visual State

**Test:** Visit `/cities/paris-france?category=restaurant` and inspect the "Restaurants" tab
**Expected:** Tab appears visually distinct from inactive tabs (highlighted, underlined, or otherwise indicated as selected)
**Why human:** `aria-current="page"` is verified in code but CSS/Tailwind styling for the active state cannot be verified by grep

#### 3. Interactive Map Renders in Browser

**Test:** Visit `/cities/paris-france` in a browser and observe the map section
**Expected:** A Leaflet tile map appears below the feed with pin markers for any place posts; no blank div; no JavaScript console errors about Leaflet's DOM requirements
**Why human:** CityMap is a client component hidden behind `dynamic(..., { ssr: false })`; jsdom tests mock react-leaflet entirely; real tile loading and marker positioning requires a live browser with network access

### Full Suite Result

All 119 tests across 23 test files pass with zero failures or regressions introduced by the gap-closure work (plans 03-03 and 03-04).

### Re-verification Summary

Both gaps from the initial verification are closed:

**Gap 1 — City Search (FEED-03) — CLOSED:** `src/app/cities/search/page.tsx` and `src/components/city/CitySearchForm.tsx` were created. The search page awaits `searchParams.q`, calls `searchCitiesByName(q)`, and renders either a no-match message or a `<ul>` of `<Link>` results pointing to `/cities/[slug]`. The CitySearchPage UI tests live in `tests/cities/city-search-page.test.tsx` (separated from query unit tests to avoid vi.mock hoisting conflicts). All 9 city-search tests pass.

**Gap 2 — Interactive Map (FEED-04) — CLOSED:** `src/components/map/CityMap.tsx` (react-leaflet client component with `'use client'`, `L.Icon` marker, `parseFloat` for decimal lat/lng strings, Paris fallback center) and `src/components/map/CityMapLoader.tsx` (async Server Component, `dynamic(() => import('./CityMap'), { ssr: false })`, calls `getPostsForMap`) were created. `src/app/cities/[slug]/page.tsx` was updated to import and render `<Suspense fallback={<div>Loading map...</div>}><CityMapLoader cityId={city.id} /></Suspense>`, replacing the placeholder div entirely. The `leaflet`, `react-leaflet`, and `@types/leaflet` packages are installed in `package.json`. Marker icon assets are present in `/public/`. All 4 map tests pass with full vi.mock isolation of Leaflet's DOM dependencies.

---

_Verified: 2026-03-18T19:16:30Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — initial verification 2026-03-18T18:45:00Z found 2 gaps; both closed_
