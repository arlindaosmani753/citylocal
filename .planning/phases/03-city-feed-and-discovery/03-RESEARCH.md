# Phase 3: City Feed and Discovery - Research

**Researched:** 2026-03-17
**Domain:** Cursor-based feed pagination (Drizzle), category filter tabs (URL searchParams), city search (Drizzle ilike), interactive map (react-leaflet v5 + OpenStreetMap), Next.js App Router public routes
**Confidence:** HIGH (pagination and URL searchParams patterns verified against official Drizzle and Next.js docs; react-leaflet v5 SSR pattern verified against official docs and maintained blog posts; map marker fix verified)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FEED-01 | Each city has a public page showing a chronological feed of recent place posts and events | `FeedService` query on `posts` table with `cityId` filter + `createdAt DESC` order; public route `/cities/[slug]`; no auth required |
| FEED-02 | City feed can be filtered by content category without a full page reload | URL searchParam `?category=restaurant` read by Server Component page via `searchParams` prop; client-side `<Link>` updates param; Server Component re-renders only the feed section |
| FEED-03 | User can search for a city by name and navigate to its city page | `getCityByName` Drizzle query using `ilike` on `cities.name`; `/cities/search?q=paris` route; navigates to `/cities/[slug]` on match |
| FEED-04 | City page has an interactive map view showing all places as pins | react-leaflet v5 + OpenStreetMap tiles; `dynamic(() => import('./Map'), { ssr: false })` pattern; lat/lng from `posts` table decimal columns |
</phase_requirements>

---

## Summary

Phase 3 builds the public discovery surface — the city page that tourists land on first. It has four distinct technical concerns that must compose cleanly: a paginated feed, category filtering, city search, and a map view.

The feed and filtering are purely server-side: the city page is a Server Component that receives `searchParams` from Next.js and queries the `posts` table with cursor-based pagination. Category filtering happens through URL query parameters — the client navigates with `<Link>` (no `useRouter` needed), Next.js re-renders the Server Component with the new `searchParams`, and the filtered feed loads without a full page reload. The compound cursor uses `(createdAt, id)` to handle UUID primary keys correctly per the official Drizzle cursor pagination guide.

City search is a simple Drizzle `ilike` query against `cities.name`, returning a slug for redirect. The cities table already has the `slug` column (established in Phase 1 with `paris-france` as the seed value). The search UI can be a server form or a client component — a server form is simpler and avoids the `useSearchParams` Suspense requirement.

The map is the only technically tricky piece. Leaflet makes direct DOM calls and cannot run on the server. The pattern is `next/dynamic` with `{ ssr: false }` wrapping a client component that imports `leaflet/dist/leaflet.css` and initializes the map. react-leaflet v5 is stable, requires React 19 (which this project already uses at 19.2.3), and works with Next.js App Router. The marker icon bug requires copying `marker-icon.png` and `marker-shadow.png` to `/public` and constructing a custom `L.Icon`. Posts already have `lat`/`lng` decimal columns from Phase 2 GPS verification — these feed the map pins directly.

**Primary recommendation:** Server Component feed with URL searchParams for filtering, react-leaflet v5 with dynamic import for the map, and a Drizzle `ilike` city search. All patterns are well-documented and have no known blockers with the existing stack.

---

## Standard Stack

### Core (already installed from Phases 1-2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, Server Components, searchParams prop | Already in use |
| Drizzle ORM | 0.45.1 | Feed queries, city search, cursor pagination | Already in use |
| React | 19.2.3 | UI layer | Already in use |
| date-fns | 4.x | Feed card timestamps ("3 hours ago") | Already installed |
| lucide-react | latest | Icons (map-pin, search, filter) | Already installed |

### New in Phase 3

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| leaflet | 1.9.4 | Core map library (OpenStreetMap tiles) | Industry standard; Mapbox-free; decision locked in STATE.md |
| react-leaflet | 5.0.0 | React bindings for Leaflet | v5 requires React 19 (matches project); stable Dec 2024 |
| @types/leaflet | latest | TypeScript types for leaflet | Required for `L.Icon` and other Leaflet types in TS |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet v5 | Mapbox GL JS | Decision locked: Leaflet + OSM to avoid billing |
| react-leaflet v5 | bare Leaflet (no React wrapper) | react-leaflet provides React lifecycle integration; bare Leaflet requires manual cleanup |
| URL searchParams filter | useState + client fetch | URL approach is shareable, bookmarkable, works without JS, and keeps Server Components for data fetching |
| Drizzle cursor pagination | limit/offset pagination | Cursor pagination has no skip-duplicate bug on concurrent inserts; official Drizzle recommendation for feeds |

**Installation:**
```bash
npm install leaflet react-leaflet @types/leaflet
```

---

## Architecture Patterns

### Recommended Project Structure Additions

```
src/
├── app/
│   └── cities/
│       ├── [slug]/
│       │   └── page.tsx           # Public city page (FEED-01, FEED-02, FEED-04)
│       │   └── loading.tsx        # Skeleton fallback
│       └── search/
│           └── page.tsx           # City search results (FEED-03)
├── components/
│   ├── feed/
│   │   ├── FeedCard.tsx           # Shared card for place and event posts
│   │   ├── CategoryFilterTabs.tsx # 'use client' — Link-based tab bar
│   │   └── FeedList.tsx           # Server Component list wrapper
│   └── map/
│       ├── CityMap.tsx            # 'use client' — react-leaflet map
│       └── CityMapLoader.tsx      # Dynamic import wrapper (ssr: false)
├── lib/
│   └── db/
│       └── queries/
│           ├── feed.ts            # getFeedForCity (cursor-based), getPostsForMap
│           └── cities.ts          # getCityBySlug, searchCitiesByName
```

### Pattern 1: Cursor-Based Feed Pagination (Compound Cursor)

**What:** Fetches the city feed ordered by `createdAt DESC, id DESC`. Uses a compound cursor `(createdAt, id)` since UUIDs are not sequential. Passes `cursor` as URL searchParam for "load more".

**When to use:** FEED-01. The roadmap specifies cursor-based pagination with a compound index on `city_id + created_at DESC`.

```typescript
// Source: https://orm.drizzle.team/docs/guides/cursor-based-pagination
// src/lib/db/queries/feed.ts

import { db } from '@/lib/db'
import { posts, postImages, profiles } from '@/lib/db/schema'
import { and, eq, isNull, or, lt, desc, sql } from 'drizzle-orm'

export type FeedPost = {
  id: string
  title: string
  contentType: 'place' | 'event'
  category: string | null
  body: string | null
  lat: string | null
  lng: string | null
  authorUsername: string | null
  createdAt: Date
  startsAt: Date | null
  endsAt: Date | null
  firstImagePath: string | null
}

type FeedCursor = { id: string; createdAt: Date }

export async function getFeedForCity(
  cityId: string,
  options: {
    category?: string
    cursor?: FeedCursor
    limit?: number
  } = {}
): Promise<{ posts: FeedPost[]; nextCursor: FeedCursor | null }> {
  const { category, cursor, limit = 20 } = options

  const filters = [
    eq(posts.cityId, cityId),
    isNull(posts.deletedAt),
    eq(posts.status, 'active'),
    // EVNT-02: exclude past events
    or(
      eq(posts.contentType, 'place'),
      isNull(posts.endsAt),
      // gt(posts.endsAt, sql`NOW()`) already imported from Phase 2
    ),
  ]

  if (category && category !== 'all') {
    if (category === 'event') {
      filters.push(eq(posts.contentType, 'event'))
    } else {
      filters.push(eq(posts.category, category as any))
    }
  }

  // Compound cursor: (createdAt DESC, id DESC)
  // "lt" because we're descending: next page has items OLDER than cursor
  if (cursor) {
    filters.push(
      or(
        lt(posts.createdAt, cursor.createdAt),
        and(
          eq(posts.createdAt, cursor.createdAt),
          lt(posts.id, cursor.id)
        )
      )
    )
  }

  const rows = await db
    .select({
      id:              posts.id,
      title:           posts.title,
      contentType:     posts.contentType,
      category:        posts.category,
      body:            posts.body,
      lat:             posts.lat,
      lng:             posts.lng,
      createdAt:       posts.createdAt,
      startsAt:        posts.startsAt,
      endsAt:          posts.endsAt,
      authorUsername:  profiles.username,
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.authorId))
    .where(and(...filters))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1)  // fetch one extra to detect if next page exists

  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const lastRow = pageRows[pageRows.length - 1]

  return {
    posts: pageRows as FeedPost[],
    nextCursor: hasMore && lastRow
      ? { id: lastRow.id, createdAt: lastRow.createdAt }
      : null,
  }
}
```

**Required index (already partially exists — verify or add):**
```typescript
// In schema.ts — the existing index is:
// index('posts_city_created_idx').on(table.cityId, table.createdAt)
// This covers the compound cursor well. No new index needed for Phase 3.
```

### Pattern 2: Category Filter Tabs via URL searchParams (Server Component)

**What:** The city page is a Server Component that reads `searchParams.category`. Filter tabs are `<Link>` components that update the URL. No `useRouter`, no `useState` for the filter state. The Server Component re-fetches on each navigation.

**When to use:** FEED-02 (filter without full page reload).

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params
// src/app/cities/[slug]/page.tsx

import { Suspense } from 'react'
import { getCityBySlug } from '@/lib/db/queries/cities'
import { getFeedForCity } from '@/lib/db/queries/feed'
import CategoryFilterTabs from '@/components/feed/CategoryFilterTabs'
import FeedList from '@/components/feed/FeedList'
import CityMapLoader from '@/components/map/CityMapLoader'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; cursor?: string }>
}

export default async function CityPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { category } = await searchParams

  const city = await getCityBySlug(slug)
  if (!city) notFound()

  const { posts, nextCursor } = await getFeedForCity(city.id, { category })

  return (
    <main>
      <h1>{city.name}</h1>
      <CategoryFilterTabs activeCategory={category ?? 'all'} citySlug={slug} />
      <FeedList posts={posts} nextCursor={nextCursor} citySlug={slug} />
      <Suspense fallback={<div>Loading map...</div>}>
        <CityMapLoader cityId={city.id} />
      </Suspense>
    </main>
  )
}
```

```typescript
// src/components/feed/CategoryFilterTabs.tsx
// 'use client' — only needed for active state highlight, Link is sufficient
// Actually can be a pure Server Component using Link components

import Link from 'next/link'

const CATEGORIES = [
  { value: 'all',              label: 'All' },
  { value: 'restaurant',       label: 'Restaurants' },
  { value: 'cafe',             label: 'Cafes' },
  { value: 'bar',              label: 'Bars' },
  { value: 'activity',         label: 'Activities' },
  { value: 'sport',            label: 'Sport' },
  { value: 'tourist_attraction', label: 'Attractions' },
  { value: 'shopping',         label: 'Shopping' },
  { value: 'event',            label: 'Events' },
]

export default function CategoryFilterTabs({
  activeCategory,
  citySlug,
}: {
  activeCategory: string
  citySlug: string
}) {
  return (
    <nav aria-label="Filter by category">
      {CATEGORIES.map(({ value, label }) => (
        <Link
          key={value}
          href={value === 'all'
            ? `/cities/${citySlug}`
            : `/cities/${citySlug}?category=${value}`
          }
          className={activeCategory === value ? 'tab-active' : 'tab'}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

**Key insight:** `CategoryFilterTabs` can be a pure Server Component using `<Link>` — no `'use client'` needed. The active state comes from `activeCategory` prop passed from the page.

### Pattern 3: City Search

**What:** A search form POSTs to `/cities/search?q=paris` (or GET with query param). The Server Component queries `cities` with Drizzle `ilike`. Matching cities redirect to `/cities/[slug]`; no match shows a "not found" state.

**When to use:** FEED-03.

```typescript
// Source: drizzle-orm docs — ilike operator
// src/lib/db/queries/cities.ts

import { db } from '@/lib/db'
import { cities } from '@/lib/db/schema'
import { eq, ilike } from 'drizzle-orm'

export async function getCityBySlug(slug: string) {
  const rows = await db
    .select()
    .from(cities)
    .where(eq(cities.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function searchCitiesByName(query: string) {
  return db
    .select({ id: cities.id, name: cities.name, slug: cities.slug, country: cities.country })
    .from(cities)
    .where(ilike(cities.name, `%${query}%`))
    .limit(10)
}
```

```typescript
// src/app/cities/search/page.tsx — Server Component search results page

type Props = { searchParams: Promise<{ q?: string }> }

export default async function CitySearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  if (!q) return <SearchForm />

  const results = await searchCitiesByName(q)

  if (results.length === 1) {
    // Exact single match — redirect directly to city page
    redirect(`/cities/${results[0].slug}`)
  }

  return (
    <div>
      <SearchForm initialQuery={q} />
      {results.length === 0
        ? <p>No cities found for &ldquo;{q}&rdquo;</p>
        : <ul>{results.map(c => (
            <li key={c.id}><Link href={`/cities/${c.slug}`}>{c.name}, {c.country}</Link></li>
          ))}</ul>
      }
    </div>
  )
}
```

### Pattern 4: Interactive Map with react-leaflet v5 (SSR-Safe)

**What:** The map is a Client Component wrapped in `next/dynamic` with `ssr: false`. Leaflet's CSS is imported inside the client component. Marker icons require copying two PNG files to `/public`. Place lat/lng come from the posts table decimal columns.

**When to use:** FEED-04.

```typescript
// Source: https://xxlsteve.net/blog/react-leaflet-on-next-15/
// src/components/map/CityMapLoader.tsx — Server Component wrapper

import dynamic from 'next/dynamic'
import { getPostsForMap } from '@/lib/db/queries/feed'

const CityMap = dynamic(() => import('./CityMap'), {
  loading: () => <div style={{ height: 400 }}>Loading map...</div>,
  ssr: false,
})

export default async function CityMapLoader({ cityId }: { cityId: string }) {
  const places = await getPostsForMap(cityId)
  return <CityMap places={places} />
}
```

```typescript
// src/components/map/CityMap.tsx — Client Component
// 'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icon — broken by webpack asset hashing
const markerIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
})

type Place = { id: string; title: string; lat: string; lng: string }

export default function CityMap({ places }: { places: Place[] }) {
  const center: [number, number] = places.length > 0
    ? [parseFloat(places[0].lat), parseFloat(places[0].lng)]
    : [48.8566, 2.3522]  // Paris fallback

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map(place => (
        <Marker
          key={place.id}
          position={[parseFloat(place.lat), parseFloat(place.lng)]}
          icon={markerIcon}
        >
          <Popup>{place.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

```typescript
// Map data query — separate from feed query to keep map light
// src/lib/db/queries/feed.ts addition

export type MapPin = { id: string; title: string; lat: string; lng: string }

export async function getPostsForMap(cityId: string): Promise<MapPin[]> {
  return db
    .select({
      id:    posts.id,
      title: posts.title,
      lat:   posts.lat,
      lng:   posts.lng,
    })
    .from(posts)
    .where(
      and(
        eq(posts.cityId, cityId),
        eq(posts.contentType, 'place'),
        isNull(posts.deletedAt),
        eq(posts.status, 'active'),
        isNotNull(posts.lat),
        isNotNull(posts.lng),
      )
    )
    .limit(200)  // map pins cap — enough for v1
}
```

**Marker icon files:** Copy from the leaflet package to `/public`:
```bash
cp node_modules/leaflet/dist/images/marker-icon.png public/
cp node_modules/leaflet/dist/images/marker-shadow.png public/
```

### Anti-Patterns to Avoid

- **Importing react-leaflet in a Server Component:** Leaflet calls `window` and `document` at import time. Always wrap in `dynamic(() => import(...), { ssr: false })`.
- **Importing `leaflet/dist/leaflet.css` in `_app.tsx` or `layout.tsx`:** Import it inside the client-side map component only — importing in the layout causes SSR CSS conflicts.
- **Using `useSearchParams` for category filter when `searchParams` prop suffices:** The city page is a Server Component — read `searchParams` from the page props directly. Only use `useSearchParams` in deeply nested client components where prop-drilling the value is impractical.
- **Offset pagination for the feed:** With concurrent posting (events and places added constantly), offset pagination causes duplicated or skipped rows. Use cursor pagination.
- **Querying all posts for the map with no limit:** Production cities could have thousands of pins. Cap at 200 and let Phase 4+ add clustering if needed.
- **Treating `posts.lat` as a number:** The schema uses `decimal` which Drizzle returns as `string`. Always `parseFloat()` before passing to Leaflet's `[lat, lng]` position.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive map | Custom SVG/Canvas map | react-leaflet v5 + OpenStreetMap | Pan/zoom/touch, tile loading, projection math — all solved |
| Marker icon fix | Complex webpack alias | Copy PNGs to `/public`, use `L.Icon` | Simple, zero-config, always works |
| City name search | Full-text search index | Drizzle `ilike` on `cities.name` | v1 has few cities; ilike is fast and sufficient; upgrade to pg_trgm in v2 if needed |
| Category filter state | `useState` + client-side data fetch | URL searchParams + Server Component | Server-driven: shareable links, no hydration mismatch, works without JS |
| Cursor serialization | Custom base64 encoding | Pass raw `id` + `createdAt` as separate params | Simple, debuggable URL params; no opaque token needed at this scale |

**Key insight:** The city page can be almost entirely Server Components — only the map and any "load more" button need client-side JavaScript. Keeping filtering as a Server Component URL-param pattern eliminates a whole class of hydration bugs.

---

## Common Pitfalls

### Pitfall 1: Leaflet Map Hydration Error ("Map container already initialized")

**What goes wrong:** `Error: Map container is already initialized.` appears in development when React's Strict Mode double-invokes effects. The Leaflet `MapContainer` tries to initialize twice on the same DOM element.

**Why it happens:** React 19 Strict Mode runs effects twice in development. Leaflet stores a reference on the container DOM node and throws if it's already set.

**How to avoid:** react-leaflet v5 is designed to handle this correctly. If the error appears, ensure you are using react-leaflet v5.0.0 (not v4, not a v5 RC). The fix in v5 addresses the React 19 double-invoke issue specifically.

**Warning signs:** Error only in development, not production. Appears on hot reload.

### Pitfall 2: Missing Leaflet CSS — Map Renders as Zero-Height

**What goes wrong:** The map container renders with zero height or tiles don't display correctly even though the map initializes without errors.

**Why it happens:** Leaflet requires `leaflet/dist/leaflet.css` to be imported. Without it, the tile container has no height and map controls are unstyled.

**How to avoid:** Import `'leaflet/dist/leaflet.css'` as the first line inside the `CityMap.tsx` client component (the one that contains the actual `MapContainer`). Do not import it in the Server Component wrapper or layout.

**Warning signs:** Map div is empty or zero-height; no tile images visible; pin icons are broken boxes.

### Pitfall 3: decimal String from Drizzle Causes Leaflet NaN Position

**What goes wrong:** Place pins don't appear on the map, or appear at `[NaN, NaN]`. Leaflet silently ignores invalid positions.

**Why it happens:** Drizzle returns `decimal` columns as JavaScript `string`, not `number`. `L.LatLng` requires numbers. Passing `place.lat` directly (a string like `"48.8566000"`) results in `NaN` when Leaflet does internal arithmetic.

**How to avoid:** Always call `parseFloat(place.lat)` and `parseFloat(place.lng)` before using them in Leaflet position arrays. Filter out rows where `lat` or `lng` is null before rendering markers.

**Warning signs:** Map renders with no pins despite having posts with GPS coordinates.

### Pitfall 4: useSearchParams Without Suspense Fails Production Build

**What goes wrong:** `next build` fails with "Missing Suspense boundary with useSearchParams". Works fine in development.

**Why it happens:** Next.js static analysis requires any component using `useSearchParams` to be wrapped in `<Suspense>` during static page builds.

**How to avoid:** Do not use `useSearchParams` in the category filter at all — the Server Component `searchParams` prop is simpler and avoids the requirement entirely. If `useSearchParams` is used in any client component on the city page, wrap it in `<Suspense fallback={...}>`.

**Warning signs:** Build passes locally (development mode), fails in CI or `next build`.

### Pitfall 5: Event Category Mixing in Filter

**What goes wrong:** Filtering by category shows only places with that category value. Events (which have `content_type = 'event'`, not a `category` value) never appear under the "Events" filter tab.

**Why it happens:** Places store their type in `category` (enum: `restaurant`, `cafe`, etc.). Events use `content_type = 'event'` and typically have `category = null`. A naive `WHERE category = 'event'` returns nothing.

**How to avoid:** The category filter must special-case `'event'`: when `category === 'event'`, filter on `contentType = 'event'` instead of `category = 'event'`. For all other category values, filter on `category = value` (places only). The `CategoryFilterTabs` component passes `?category=event` for the Events tab, which the feed query handles with this branch.

**Warning signs:** Events tab shows zero results even when events exist for the city.

### Pitfall 6: City Page Route Must Be Public

**What goes wrong:** The Next.js middleware (established in Phase 1) redirects unauthenticated users. If `/cities/[slug]` is not in the public routes allowlist, tourists cannot view the feed.

**Why it happens:** Phase 1 middleware redirects all routes except `/login`, `/register`, `/auth`, and `/cities` to the login page. The city page and city search page are in this allowlist already (the middleware comment in the Phase 1 code confirms `/cities` prefix is allowed).

**How to avoid:** Verify the middleware `matcher` and route guard allows `/cities/**` without authentication. No server action on the city page should call `requireAuth()` — only the RSVP button (a Phase 2 component) uses auth.

**Warning signs:** Tourists see the login page when navigating to `/cities/paris-france`.

---

## Code Examples

Verified patterns from official sources:

### Drizzle: ilike for City Search

```typescript
// Source: https://orm.drizzle.team/docs/operators#ilike
import { ilike } from 'drizzle-orm'

const results = await db
  .select({ id: cities.id, name: cities.name, slug: cities.slug })
  .from(cities)
  .where(ilike(cities.name, `%${query}%`))
  .limit(10)
```

### Next.js: searchParams Prop in Server Component Page

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
// Works in Next.js 15+: searchParams is a Promise
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string }>
}

export default async function CityPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { category } = await searchParams
  // ...
}
```

### Next.js: dynamic import with ssr: false (Leaflet)

```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading#nextdynamic
import dynamic from 'next/dynamic'

const CityMap = dynamic(() => import('./CityMap'), {
  loading: () => <p>Loading map...</p>,
  ssr: false,
})
```

### react-leaflet v5: Basic Map with OpenStreetMap Tiles

```typescript
// Source: https://react-leaflet.js.org (official docs)
// 'use client' — required
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

<MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ height: '400px' }}>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  />
  <Marker position={[48.8566, 2.3522]}>
    <Popup>A place</Popup>
  </Marker>
</MapContainer>
```

### Drizzle: Compound Cursor for Descending Feed

```typescript
// Source: https://orm.drizzle.team/docs/guides/cursor-based-pagination
// Descending order: next page = items OLDER than cursor (lt)
import { lt, and, eq, or, desc } from 'drizzle-orm'

const rows = await db
  .select()
  .from(posts)
  .where(
    cursor
      ? or(
          lt(posts.createdAt, cursor.createdAt),
          and(
            eq(posts.createdAt, cursor.createdAt),
            lt(posts.id, cursor.id)
          )
        )
      : undefined
  )
  .orderBy(desc(posts.createdAt), desc(posts.id))
  .limit(pageSize + 1)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-leaflet@next` (RC) | `react-leaflet@5.0.0` (stable) | December 2024 | Use stable; RC no longer needed |
| `react-leaflet` v4 (React 18) | `react-leaflet` v5 (React 19) | December 2024 | v4 does NOT support React 19; must use v5 |
| `dynamic('use client' global CSS)` | `leaflet/dist/leaflet.css` inside map client component | Always | CSS must be in the client component, not layout |
| `export const dynamic = 'force-dynamic'` | `await connection()` for forced dynamic rendering | Next.js 15+ | Prefer `connection()` — semantically clear, official recommendation |
| `useSearchParams` for filter state | `searchParams` prop on Server Component page | App Router (stable) | Server Component prop is simpler, no Suspense required, no client JS |

**Deprecated/outdated:**
- `react-leaflet@next` (v5 RC): Replaced by v5.0.0 stable.
- `leaflet-defaulticon-compatibility` package: Unnecessary with the `L.Icon` constructor pattern.
- `dynamic = 'force-dynamic'` on page: Use `await connection()` from `next/server` instead.

---

## Open Questions

1. **Polling vs. static feed (60-second polling)**
   - What we know: The roadmap mentions "60-second polling" for the feed. This implies client-side periodic re-fetch.
   - What's unclear: Whether 60-second polling means `setInterval` + client fetch, or React Query / SWR with `refreshInterval`, or simple page-level revalidation (`revalidate: 60` in Next.js).
   - Recommendation: Use Next.js `export const revalidate = 60` on the city page for server-side ISR. This is simpler than client polling, avoids client-side JS for non-interactive users, and Next.js handles the staleness. If real-time updates are needed, defer to v2. Flag this for the planner to confirm intended approach.

2. **"Load more" UX vs. link-based pagination**
   - What we know: Cursor pagination produces a `nextCursor` value. The roadmap doesn't specify whether pagination is "load more" (client-side append) or page-link navigation.
   - What's unclear: "Load more" requires a client component with state to accumulate pages; link-based navigation is simpler but loses scroll position.
   - Recommendation: Implement as a simple "Load more" link pointing to `?cursor=...` (same URL searchParam pattern). The Server Component renders the single page at that cursor. This avoids client state management in Phase 3. True infinite scroll can be added in a later phase.

3. **Map bounds fitting**
   - What we know: `MapContainer` takes an initial `center` and `zoom`. With multiple pins at varying locations, the initial view may not frame all pins.
   - What's unclear: Whether to use `fitBounds` (requires accessing the Leaflet map instance via `useMap()` hook from react-leaflet) or a static default zoom.
   - Recommendation: Start with a static `zoom={13}` centered on the first pin or the city's lat/lng from the `cities` table. `fitBounds` is an enhancement for a later task — do not block Phase 3 on it.

4. **City page URL slug conflict with future city additions**
   - What we know: Only Paris (`paris-france`) is seeded. Phase 3 adds the city search page.
   - What's unclear: How new cities get added — there is no admin UI planned for v1. City search returns empty for any non-seeded city.
   - Recommendation: The city search page should gracefully display a "City not yet available" state. City creation is an admin operation not in scope for Phase 3.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library (already configured) |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run tests/feed/ tests/cities/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-01 | `getFeedForCity` returns posts ordered by `createdAt DESC` | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| FEED-01 | `getFeedForCity` excludes soft-deleted and hidden posts | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| FEED-01 | `getFeedForCity` excludes past events (endsAt < NOW) | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| FEED-01 | City page renders post titles in feed | unit | `npx vitest run tests/feed/city-page.test.tsx` | Wave 0 |
| FEED-02 | `getFeedForCity` filters by category when provided | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| FEED-02 | `getFeedForCity` returns events when category='event' | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| FEED-02 | `CategoryFilterTabs` renders links with correct hrefs | unit | `npx vitest run tests/feed/category-tabs.test.tsx` | Wave 0 |
| FEED-03 | `searchCitiesByName` returns cities matching partial name (case-insensitive) | unit | `npx vitest run tests/cities/city-search.test.ts` | Wave 0 |
| FEED-03 | `searchCitiesByName` returns empty array for no match | unit | `npx vitest run tests/cities/city-search.test.ts` | Wave 0 |
| FEED-03 | `getCityBySlug` returns city for valid slug | unit | `npx vitest run tests/cities/city-search.test.ts` | Wave 0 |
| FEED-03 | `getCityBySlug` returns null for unknown slug | unit | `npx vitest run tests/cities/city-search.test.ts` | Wave 0 |
| FEED-04 | `getPostsForMap` returns only places with non-null lat/lng | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| FEED-04 | `CityMap` renders without error (dynamic import mock) | unit | `npx vitest run tests/map/city-map.test.tsx` | Wave 0 |
| Pagination | `getFeedForCity` with cursor returns next page (no duplicates) | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |
| Pagination | `getFeedForCity` returns `nextCursor=null` on last page | unit | `npx vitest run tests/feed/feed-service.test.ts` | Wave 0 |

**Manual-only tests (cannot be automated without a real browser or running server):**
- Map tiles visually loading from OpenStreetMap
- Marker pins appearing at correct geographic coordinates
- Category filter tab navigation in-browser (URL change without full reload)
- City search navigate-on-exact-match redirect

### Sampling Rate

- **Per task commit:** `npx vitest run tests/feed/ tests/cities/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/feed/feed-service.test.ts` — covers FEED-01, FEED-02, FEED-04, pagination
- [ ] `tests/feed/city-page.test.tsx` — covers FEED-01 city page render
- [ ] `tests/feed/category-tabs.test.tsx` — covers FEED-02 tab links
- [ ] `tests/cities/city-search.test.ts` — covers FEED-03 queries
- [ ] `tests/map/city-map.test.tsx` — covers FEED-04 client component (react-leaflet mocked)

*(No new framework installs needed — Vitest + RTL infrastructure from Phases 1-2 is sufficient. `leaflet` must be mock-friendly in tests since it requires a real DOM; use `vi.mock('leaflet', ...)` or `vi.mock('react-leaflet', ...)` in the map test.)*

---

## Sources

### Primary (HIGH confidence)

- [Drizzle ORM: Cursor-Based Pagination](https://orm.drizzle.team/docs/guides/cursor-based-pagination) — compound cursor pattern with `(createdAt, id)`, descending order, limit+1 trick
- [Next.js: useSearchParams API Reference](https://nextjs.org/docs/app/api-reference/functions/use-search-params) — Suspense requirement, `searchParams` prop as alternative for Server Components, router.push pattern (v16.1.7 docs, updated 2026-03-16)
- [Next.js: page.js File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/page) — `searchParams` prop as Promise in Next.js 15+
- [react-leaflet: Installation](https://react-leaflet.js.org/docs/start-installation/) — v5 peer deps (React 19 required), `@types/leaflet` for TypeScript
- [react-leaflet v5.0.0 Release](https://github.com/PaulLeCam/react-leaflet/releases) — stable December 2024, React 19 required, not RC
- [XXL Steve: React Leaflet on Next.js 15 App Router](https://xxlsteve.net/blog/react-leaflet-on-next-15/) — verified dynamic import pattern, CSS location, marker icon fix with L.Icon

### Secondary (MEDIUM confidence)

- [Drizzle ORM: ilike operator](https://orm.drizzle.team/docs/operators#ilike) — case-insensitive LIKE for city name search
- [Next.js Learn: Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — official tutorial showing searchParams + Server Component pattern for search
- Community confirmation that react-leaflet v4 does NOT support React 19 — multiple GitHub issues and blog posts agree; v5 is required

### Tertiary (LOW confidence)

- None for this phase — all critical patterns verified against official sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-leaflet v5, Drizzle cursor pagination, Next.js searchParams all verified against official docs
- Architecture: HIGH — Server Component + searchParams pattern is the official Next.js recommendation for this use case; cursor pagination is the official Drizzle guide
- Pitfalls: HIGH — Leaflet SSR bug is documented in react-leaflet GitHub issues; decimal string issue is a known Drizzle behavior; Suspense requirement is documented in Next.js official docs
- Map implementation: MEDIUM-HIGH — dynamic import pattern is consistent across multiple verified sources; marker icon fix is community-verified but straightforward

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (30 days — APIs are stable; react-leaflet v5 just released, monitor for patch releases)
