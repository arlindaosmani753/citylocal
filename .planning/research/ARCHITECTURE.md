# Architecture Research

**Domain:** Community-powered city guide platform (multi-city, GPS-verified, dual user roles)
**Researched:** 2026-03-13
**Confidence:** MEDIUM — patterns drawn from training knowledge of comparable platforms (Yelp, Meetup, Nextdoor, Foursquare); web search unavailable during this session

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  City Feed   │  │  Post Form   │  │  Place / Event Page  │   │
│  │  (public)    │  │  (local only)│  │  (public + reviews)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│  ┌──────▼─────────────────▼──────────────────────▼───────────┐  │
│  │                  Browser Geolocation API                   │  │
│  │         (GPS coordinate capture at post time only)         │  │
│  └────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                        API LAYER                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  Auth API   │  │  Content API │  │  Location API         │    │
│  │  /auth/*    │  │  /posts/*    │  │  /cities/*            │    │
│  │             │  │  /places/*   │  │  /verify-location     │    │
│  │             │  │  /events/*   │  │                       │    │
│  │             │  │  /reviews/*  │  │                       │    │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬────────────┘   │
│         │                │                      │                │
│  ┌──────▼────────────────▼──────────────────────▼────────────┐  │
│  │                   Business Logic Layer                      │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐ │  │
│  │  │ AuthService  │  │ ContentService│  │  GeoService     │ │  │
│  │  │ RoleGuard    │  │ FeedService   │  │  CityResolver   │ │  │
│  │  └──────────────┘  └───────────────┘  └─────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        DATA LAYER                                 │
│  ┌───────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Primary Database     │  │  Geospatial Index                │ │
│  │  (users, posts,       │  │  (PostGIS or spatial queries     │ │
│  │   places, events,     │  │   for city boundary lookups,     │ │
│  │   reviews, cities)    │  │   radius checks)                 │ │
│  └───────────────────────┘  └──────────────────────────────────┘ │
│  ┌───────────────────────┐                                        │
│  │  Object Storage       │                                        │
│  │  (post images/media)  │                                        │
│  └───────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| City Feed | Paginated list of recent posts scoped to a city | Server-rendered or SSR page, infinite scroll |
| Post Form | Create place/event post with GPS capture | Client-side geolocation capture, server-side proximity check |
| Place / Event Page | Display full content + tourist reviews | Static-ish rendering, dynamic review section |
| Auth API | Register, login, session management, role assignment | JWT or session cookies; role stored on user record |
| Content API | CRUD for posts, places, events, reviews | REST endpoints with role guards on write paths |
| Location API | City resolution, proximity verification | Reverse geocoding + radius math |
| AuthService | Verify identity, enforce Local/Tourist role | Middleware guard on all write endpoints |
| RoleGuard | Block Tourists from posting, block Locals-only actions | Per-route middleware |
| ContentService | Post creation, feed assembly, rating aggregation | DB queries + denormalized counts |
| FeedService | Assemble city feed sorted by recency | Paginated query scoped by city_id |
| GeoService | Verify user's GPS matches claimed post location | Haversine distance check server-side |
| CityResolver | Map a GPS coordinate to a city record | Reverse geocode → match to cities table |

---

## Multi-City Data Organization

### The Core Decision: City as First-Class Entity

Every piece of content is owned by a city. This is the foundational scoping dimension.

```
cities
  id, slug, name, country, lat, lng, radius_km, timezone

users
  id, email, role (local | tourist), home_city_id (for locals)

posts                          ← unified content table
  id, city_id, author_id,
  content_type (place | event),
  title, body, category,
  lat, lng,                    ← captured at post time
  verified_at,                 ← timestamp of GPS check
  starts_at, ends_at           ← NULL for places, set for events
  created_at

reviews
  id, post_id, author_id,      ← author must be Tourist role
  rating (1-5), body,
  created_at

rating_summary                 ← denormalized aggregate per post
  post_id, avg_rating, review_count
```

**Why unified posts table:** Places and events share 90% of fields. Separating them creates join complexity for the city feed with no meaningful query benefit at v1 scale. The `content_type` discriminator is sufficient.

**Why city has lat/lng + radius_km:** CityResolver uses these to assign incoming GPS coordinates to a city without a full geospatial polygon dataset. A radius approximation is accurate enough for major cities and dead simple to implement.

### City Slug as URL Structure

```
/cities/berlin         ← city feed
/cities/berlin/posts/[id]   ← individual post
/cities/berlin/events        ← filtered event feed
```

The `city_id` foreign key on every post makes all city-scoped queries a single indexed column lookup — no complex joins needed for the feed.

---

## GPS Verification Flow

### Why Server-Side Verification is Required

Client-side GPS can be spoofed trivially. The browser returns coordinates, but verification logic must run on the server. The client submits coordinates; the server decides if they're valid.

```
POST /posts  { lat, lng, ...post_data }
        │
        ▼
  GeoService.verify(user_lat, user_lng, claimed_post_lat, claimed_post_lng)
        │
        ├── distance = haversine(user_lat, user_lng, post_lat, post_lng)
        │
        ├── if distance > PROXIMITY_THRESHOLD (e.g. 200m)
        │       → reject: 422 "Must be physically present to post"
        │
        └── if distance <= PROXIMITY_THRESHOLD
                → accept, set verified_at = now()
                → resolve city via CityResolver
                → save post with city_id
```

**Key design choices:**

1. **Proximity threshold: 200m** — loose enough for GPS drift and large venues (stadiums, parks), tight enough to prevent remote abuse. Tunable as a config value, not hardcoded.

2. **Both coordinates stored:** Store `user_lat/user_lng` separately from `post_lat/post_lng`. This provides an audit trail and allows threshold tuning without invalidating old posts.

3. **CityResolver runs after GPS check:** GPS check is the gate. City assignment is a consequence of passing it. Fail fast — don't do city resolution work if GPS verification fails.

4. **No re-verification on edit:** Post lat/lng is immutable after creation. Editing body/title is allowed; location cannot be changed. This keeps the trust model clean.

### CityResolver Logic

```
CityResolver.resolve(lat, lng):
  candidates = SELECT * FROM cities
               WHERE ST_DWithin(point(lat,lng), center, radius_km)
               ORDER BY distance ASC
               LIMIT 1

  if no candidates:
    → create new city record? or reject?   ← v1: reject; require city pre-seeded
    → error: "This city is not yet on CityLocal"

  return city
```

**v1 decision:** Pre-seed cities rather than auto-create. Prevents garbage city records from GPS errors. Add cities via admin tooling or a simple seed file.

---

## Dual User Role Enforcement

### Role Model: Simple Enum, Not RBAC

Two roles: `local` and `tourist`. No permissions table needed. Enforce with middleware guards.

```
users.role: enum('local', 'tourist')
users.home_city_id: FK → cities (only set when role = 'local')
```

### Enforcement Layers

```
Layer 1 — Route Guard (fast reject)
  POST /posts     → requireRole('local')
  POST /reviews   → requireRole('tourist')
  GET  /feed      → public (no auth required)

Layer 2 — Business Logic Check (data integrity)
  ContentService.createPost():
    if user.role !== 'local' → throw ForbiddenError
    if !gpsVerified         → throw UnverifiedLocationError

Layer 3 — Database Constraint (last line of defense)
  reviews.author_id → user must have role = 'tourist'
  (CHECK constraint or application-enforced invariant)
```

**Why two layers matter:** Route guards protect against unauthorized HTTP access. Business logic guards protect against bugs in routing. For a trust-critical app, belt-and-suspenders is correct.

### Role Assignment at Registration

```
Registration flow:
  1. User submits: email, password, role_choice (local | tourist)
  2. If role = local: also submit home_city (city_id from dropdown/search)
  3. Server sets users.role = chosen_role
  4. No role-change in v1 — simplifies trust model

Why no role switching:
  A Local who switches to Tourist to leave reviews on their own posts
  is a trust model attack. Prevent it by making role immutable in v1.
  If needed later: require email verification + cooldown period.
```

---

## Real-Time Feed Architecture

### v1: Polling, Not WebSockets

Real-time feels important but is premature for v1. Cities won't have enough post volume to make instant updates visible. Polling every 60s on the city feed is indistinguishable from WebSockets at low volume.

```
Feed Query (polling model):
  GET /cities/:slug/feed?cursor=<timestamp>&limit=20

  SELECT posts.*
  FROM posts
  WHERE city_id = :city_id
    AND created_at < :cursor
  ORDER BY created_at DESC
  LIMIT 20

  Returns: { posts: [...], next_cursor: <oldest_post_timestamp> }
```

**Cursor-based pagination over offset:** At high volumes, `OFFSET N` requires scanning N rows. Cursor pagination (using `created_at` as cursor) is O(1) per page regardless of feed depth. Build this correctly from the start.

**When to add WebSockets:** When a city has >10 posts/minute average. That's a good problem to have. Add it then.

---

## Recommended Project Structure

```
src/
├── server/
│   ├── api/
│   │   ├── auth/             # login, register, session
│   │   ├── cities/           # city lookup, feed endpoint
│   │   ├── posts/            # create, read, list (places + events)
│   │   └── reviews/          # create, read per post
│   ├── services/
│   │   ├── AuthService.ts    # authentication, role checks
│   │   ├── ContentService.ts # post/review CRUD + feed assembly
│   │   ├── GeoService.ts     # GPS verification, haversine math
│   │   └── CityResolver.ts   # coordinate → city mapping
│   ├── middleware/
│   │   ├── requireAuth.ts    # session check
│   │   └── requireRole.ts    # role enforcement
│   └── db/
│       ├── schema.ts         # table definitions
│       ├── migrations/       # versioned schema changes
│       └── seed/             # city seed data
├── client/
│   ├── pages/
│   │   ├── city/[slug].tsx   # city feed page
│   │   ├── post/[id].tsx     # post detail + reviews
│   │   ├── register.tsx      # role selection
│   │   └── new-post.tsx      # GPS-gated post form
│   ├── components/
│   │   ├── feed/             # FeedCard, FeedList, EventBadge
│   │   ├── post/             # PostForm, LocationCapture
│   │   └── review/           # ReviewForm, StarRating
│   └── hooks/
│       ├── useGeolocation.ts # Web Geolocation API wrapper
│       └── useCityFeed.ts    # paginated feed fetcher
└── shared/
    └── types/                # shared TS types for API contracts
```

### Structure Rationale

- **server/services/:** All business logic isolated from HTTP layer. Services are testable without HTTP mocking. Each service owns one domain.
- **server/middleware/:** Auth and role guards as composable middleware. A route either uses `requireAuth` or doesn't. Role enforcement is explicit at the route level.
- **client/hooks/:** Browser-specific APIs (geolocation) wrapped in hooks. The PostForm component calls `useGeolocation`, not `navigator.geolocation` directly. This makes components testable and the GPS abstraction swappable.
- **shared/types/:** API contracts shared between client and server eliminate a class of type mismatch bugs.

---

## Architectural Patterns

### Pattern 1: City-Scoped Repository Queries

**What:** Every data access function that returns feed content accepts `city_id` as a required parameter. No query returns cross-city content by default.

**When to use:** All content reads. The feed, search, post lists — everything scoped to a city.

**Trade-offs:** Slightly more verbose query signatures; prevents entire class of data leakage bugs where content from other cities bleeds into a feed.

**Example:**
```typescript
// Good: city_id is explicit, required
async function getCityFeed(cityId: string, cursor: Date, limit: number) {
  return db.posts.findMany({
    where: { city_id: cityId, created_at: { lt: cursor } },
    orderBy: { created_at: 'desc' },
    take: limit
  });
}

// Bad: city scoping is optional or forgotten
async function getFeed(options?: { cityId?: string }) { ... }
```

### Pattern 2: GPS Verification as Pre-Condition, Not Side Effect

**What:** GPS verification runs before any content is saved. It is a gate, not a post-save audit.

**When to use:** Post creation only (not edits, not reviews).

**Trade-offs:** Slightly more complex post creation flow; prevents the alternative (save first, verify later) which creates a window for bad data.

**Example:**
```typescript
async function createPost(userId: string, data: CreatePostInput) {
  // Gate first
  const user = await getUser(userId);
  if (user.role !== 'local') throw new ForbiddenError();

  const distance = haversine(data.userLat, data.userLng, data.postLat, data.postLng);
  if (distance > GPS_PROXIMITY_THRESHOLD_METERS) {
    throw new LocationVerificationError(`Must be within ${GPS_PROXIMITY_THRESHOLD_METERS}m`);
  }

  const city = await cityResolver.resolve(data.postLat, data.postLng);
  if (!city) throw new UnknownCityError();

  // Only now write to DB
  return db.posts.create({ ...data, city_id: city.id, verified_at: new Date() });
}
```

### Pattern 3: Denormalized Rating Counts

**What:** Maintain a `rating_summary` row (avg_rating, review_count) updated on each review insert/delete, rather than computing aggregates on read.

**When to use:** Any time aggregate ratings appear in feed cards (i.e., on every page load).

**Trade-offs:** Slightly more complex write path (update summary on review create/delete); removes expensive `AVG()` + `COUNT()` aggregate queries from the hot feed read path. Worth it from day one.

---

## Data Flow

### Post Creation Flow (GPS-verified)

```
User taps "Post" in PostForm
    │
    ▼
useGeolocation.capture()
    │ browser prompts for location permission
    │ returns { lat, lng } or error
    ▼
Client submits POST /posts { userLat, userLng, postLat, postLng, ...content }
    │
    ▼
requireAuth middleware → verify session
    │
    ▼
requireRole('local') middleware → check user.role
    │
    ▼
GeoService.verify(userLat, userLng, postLat, postLng)
    │ haversine distance check
    │ reject if > 200m
    ▼
CityResolver.resolve(postLat, postLng)
    │ query cities table by proximity
    │ reject if no city found
    ▼
ContentService.createPost(userId, cityId, data)
    │ DB insert with verified_at timestamp
    ▼
Response: 201 Created { postId, citySlug }
    │
    ▼
Client redirects to /cities/:slug/posts/:id
```

### City Feed Load Flow

```
User navigates to /cities/berlin
    │
    ▼
Server looks up city by slug → city record
    │
    ▼
FeedService.getCityFeed(cityId, cursor=now, limit=20)
    │ SELECT posts WHERE city_id = ? ORDER BY created_at DESC
    │ JOIN rating_summary for avg_rating
    ▼
Render feed cards (no auth required)
    │
    ▼
Client polls GET /cities/berlin/feed?cursor=<last_seen> every 60s
```

### Tourist Review Flow

```
Tourist on place page taps "Leave Review"
    │
    ▼
requireAuth → requireRole('tourist')
    │
    ▼
ContentService.createReview(userId, postId, { rating, body })
    │ INSERT review
    │ UPDATE rating_summary (avg recalculation + count++)
    ▼
Response: 201 Created
    │
    ▼
Post page re-fetches rating_summary (no full page reload needed)
```

---

## Build Order (Phase Dependencies)

The components have hard dependencies that dictate build sequence:

```
Phase 1: Foundation
  Cities table + seed data
  User model + Auth (register/login/session)
  Role enforcement middleware
  → Nothing else works without identity + city scope

Phase 2: GPS + Post Creation
  GeoService (haversine verification)
  CityResolver (coordinate → city)
  Post model + ContentService
  Post creation API endpoint (role-gated + GPS-gated)
  → Feed has nothing to show until posts exist

Phase 3: City Feed
  FeedService + paginated feed query
  City feed page (public)
  Individual post page (public)
  → Feed is read-only; reviews need post pages

Phase 4: Reviews
  Review model + rating_summary
  Tourist review API endpoint
  Review display on post pages
  → Requires post pages from Phase 3

Phase 5: Events
  Add content_type = 'event' to posts
  starts_at / ends_at fields
  Event filtering on city feed
  Expired event handling
  → Events are posts; layered onto Phase 2 post model

Phase 6: Polish
  Feed polling / refresh
  Image uploads for posts
  Category filtering
  City search / discovery
```

**Critical path:** Auth → GPS + Posts → Feed → Reviews. Events can be added after the feed exists.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is correct. Single DB, no caching layer. Ship fast. |
| 1k-100k users | Add read replica for feed queries. Cache city records (they change rarely). Index `posts(city_id, created_at DESC)` — this is the hot query. |
| 100k+ users | Consider city-level caching (Redis, feed per city cached for 30s). Separate media storage from DB. Eventual: separate read model for feeds. |

### Scaling Priorities

1. **First bottleneck:** Feed query. `SELECT posts WHERE city_id = ? ORDER BY created_at DESC` with cursor pagination on a composite index `(city_id, created_at)` handles millions of rows efficiently. Build this index from day one.

2. **Second bottleneck:** GPS coordinate lookups in CityResolver. At scale, this becomes a hot read path on the cities table. Cache the cities table in memory — it's small (few thousand cities max) and rarely changes.

---

## Anti-Patterns

### Anti-Pattern 1: Storing City as String, Not Foreign Key

**What people do:** Store `city_name = "Berlin"` as a string on each post rather than `city_id = 42` as a foreign key.

**Why it's wrong:** String matching is error-prone ("berlin", "Berlin", "Berlin, Germany"), prevents efficient indexed queries, and breaks city feed consistency when a city record needs to be renamed or merged.

**Do this instead:** Cities table with canonical records. All content references `city_id`. City resolution (coordinate → city) runs once at post creation; all subsequent reads use the FK.

### Anti-Pattern 2: Client-Side GPS Verification

**What people do:** Verify that the user's GPS coordinates match the place coordinates in JavaScript before allowing the "Post" button to activate.

**Why it's wrong:** Any user can intercept the POST request and submit arbitrary coordinates. Client-side validation is UX, not security.

**Do this instead:** Client captures coordinates and sends them to the server. Server runs the haversine check. Client-side check is optional as UX polish only; server-side check is mandatory.

### Anti-Pattern 3: Merging Place and Event Feeds as Afterthought

**What people do:** Build a place feed, then bolt events on later as a separate query stitched together in application code.

**Why it's wrong:** Feed assembly becomes complex join/merge logic. Pagination breaks when mixing two ordered result sets. City feed loses coherent recency ordering.

**Do this instead:** Single `posts` table with `content_type` discriminator from day one. The feed is always one query. Events and places are different views of the same data.

### Anti-Pattern 4: Allowing Role Changes Without Audit

**What people do:** Allow users to switch between Local and Tourist freely (or with a simple profile edit).

**Why it's wrong:** A Local who switches to Tourist can review their own posts. A Tourist who switches to Local can post without GPS history. The trust model collapses.

**Do this instead:** Make role immutable in v1. If role change is needed in v2, require re-registration or a cooldown + audit log.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Web Geolocation API | `navigator.geolocation.getCurrentPosition()` in browser | HTTPS required; user must grant permission; graceful error handling for denied/unavailable |
| Reverse Geocoding (optional) | HTTP call to Nominatim or similar if CityResolver needs human-readable city names | v1 can use coordinate-to-city radius match without external geocoding; Nominatim is free but rate-limited |
| Object Storage (images) | Presigned URL upload direct from browser to S3/R2 | Avoids routing large files through app server; add in Phase 6 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client ↔ API | HTTP/JSON REST | All writes require auth header; all reads are public except review creation |
| GeoService ↔ CityResolver | Direct function call (same service layer) | GPS check and city resolution always happen together at post creation; no reason to separate |
| ContentService ↔ DB | ORM queries (Prisma/Drizzle) | ContentService owns all DB access for content domain; API routes never query DB directly |
| FeedService ↔ ContentService | Direct function call | FeedService is a specialized read concern within ContentService; may be same module |

---

## Sources

- Training knowledge of community platform architecture (Yelp, Foursquare, Meetup, Nextdoor patterns) — MEDIUM confidence
- Web Geolocation API specification (MDN) — HIGH confidence for browser GPS capabilities
- Haversine formula for distance calculation — HIGH confidence (standard spherical geometry)
- Cursor-based pagination patterns — HIGH confidence (widely documented best practice)
- PostGIS/spatial indexing patterns for radius queries — MEDIUM confidence

*Note: Web search was unavailable during this research session. Architecture patterns are based on training knowledge of comparable platforms. Recommendations for specific library versions should be verified via STACK.md research.*

---
*Architecture research for: CityLocal — Community-Powered City Guide*
*Researched: 2026-03-13*
