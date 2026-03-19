# Phase 2: Content Creation - Research

**Researched:** 2026-03-16
**Domain:** GPS-gated content creation (places + events), Supabase Storage photo uploads, PostGIS proximity verification, recurring event schema design
**Confidence:** HIGH (core patterns verified against official Supabase, Next.js, PostGIS, and Drizzle docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAC-01 | Local (or user with GPS verification) can post a place with name, category, and description | Server Action behind `requireLocalInCity` guard; zod schema for place fields; category constrained to enum |
| PLAC-02 | GPS location verified server-side at post time — user must be within proximity of the place | Browser `navigator.geolocation` sends lat/lng + accuracy to Server Action; PostGIS `ST_DWithin(geography, geography, meters)` validates proximity; accuracy threshold rejects imprecise readings |
| PLAC-03 | User can upload at least one photo when creating a place post | Supabase Storage with signed upload URL pattern (two-step: Server Action mints URL, client uploads directly); `post_images` junction table tracks storage paths per post |
| PLAC-04 | Each place has a dedicated detail page showing full info, photos, and ratings | `/places/[id]/page.tsx` as async RSC; queries `posts` JOIN `post_images`; photos fetched via `getPublicUrl` |
| PLAC-05 | Place categories include: Restaurant, Café, Bar, Activity, Sport, Tourist Attraction, Shopping, Other | `placeCategoryEnum` PostgreSQL enum in schema; zod enum for Server Action validation |
| EVNT-01 | Local can post an open community event with name, description, date/time, and GPS-verified location | Same GPS verification path as PLAC-02; event-specific fields: `startsAt`, `endsAt`, `locationName` |
| EVNT-02 | Events automatically hide from the feed after their end date/time passes | Query filter: `AND (ends_at IS NULL OR ends_at > NOW())` — no cron/background job needed for Phase 3 feed; server-rendered page enforces at read time |
| EVNT-03 | Any user can RSVP "I'm attending" to an event | `event_rsvps` table (userId, postId, unique constraint); `rsvpToEvent` Server Action; unauthenticated users redirected to login |
| EVNT-04 | Local can create a recurring event with weekly or monthly repeat | `recurrenceInterval` + `recurrenceEndsAt` columns on `posts`; PostgreSQL `interval` type; occurrences computed via `generate_series`-style query, not pre-materialized |
| EVNT-05 | Event detail page shows attendee count and RSVP list | `COUNT(*) FROM event_rsvps WHERE post_id = X` + `SELECT profiles.username FROM event_rsvps JOIN profiles`; async RSC on `/events/[id]/page.tsx` |
</phase_requirements>

---

## Summary

Phase 2 adds the core content creation flows that make CityLocal useful: GPS-gated place posts and community events. It builds on the Phase 1 foundation (unified `posts` table, `user_city_roles`, Server Actions pattern) and activates three new technical systems.

The first new system is Supabase Storage for photo uploads. The recommended pattern is a two-step signed URL flow: a Server Action mints a short-lived signed upload URL (avoiding Next.js's 1MB Server Action body limit), and the client uploads directly to Supabase Storage using `uploadToSignedUrl`. A `post_images` table tracks storage paths per post, enabling ordered multi-photo retrieval.

The second new system is PostGIS proximity verification. PostGIS must be enabled as a Supabase extension (free tier supported — it is a standard Postgres extension). The `posts` table already has `lat`/`lng` decimal columns from Phase 1. Phase 2 adds a `location` column of type `geography(POINT, 4326)` for efficient spatial indexing, and GPS verification uses `ST_DWithin(geography, geography, 200)` to assert the poster was within 200 meters of the claimed location. The browser sends coordinates plus the `accuracy` value; the server rejects readings with accuracy worse than 150 meters.

The third new system is event-specific schema additions: an `event_rsvps` table, and `recurrenceInterval` / `recurrenceEndsAt` columns on `posts` for weekly/monthly patterns. Recurring events store a PostgreSQL `interval` value ('1 week' or '1 month') and occurrences are computed at query time — no pre-materialization needed at Phase 2 scale.

**Primary recommendation:** Use the signed upload URL two-step pattern for all photo uploads, activate PostGIS via migration (not dashboard) so it is reproducible, and store recurring event recurrence as a PostgreSQL `interval` + `recurrenceEndsAt` on the posts row.

---

## Standard Stack

### Core (already installed from Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x App Router | Full-stack framework, Server Actions | Already in use |
| Drizzle ORM | 0.39+ | Type-safe ORM, raw SQL for PostGIS | Already in use |
| @supabase/supabase-js | 2.x | Supabase Storage client | Already in use |
| @supabase/ssr | latest | Server-side Supabase client | Already in use |
| zod | 3.x | Server Action input validation | Already in use |
| TypeScript | 5.1+ | Type safety | Already in use |

### New in Phase 2

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostGIS | (Postgres extension) | Geospatial proximity verification | Official Supabase-supported extension; `ST_DWithin` is the canonical proximity check |
| react-dropzone | 14.x | Drag-and-drop file input component | Widely used, well-maintained, handles multiple file selection and MIME validation; no custom drag logic needed |
| date-fns | 4.x (already in Phase 1 deps) | Date formatting for event display, recurrence label | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dropzone | 14.x | File input with drag-and-drop | Place/event creation forms requiring photo upload |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Signed upload URL (two-step) | Pass file through Server Action | Server Actions have 1MB body limit by default; increasing it weakens DDoS protection. Signed URL bypasses this entirely. |
| PostgreSQL `interval` for recurrence | Pre-generating occurrence rows | Pre-generation requires a job to extend the series; interval-based computation is simpler and correct for Phase 2 scale |
| `geography(POINT, 4326)` column for GPS | Store lat/lng as decimal only | Decimal columns can't use GIST spatial indexes; geography type enables `ST_DWithin` with automatic bounding-box index pruning |
| react-dropzone | Native `<input type="file">` | Native input works but gives no drag-and-drop UX or easy file-list management; dropzone reduces custom wiring |

**New installation:**
```bash
npm install react-dropzone
```

PostGIS is activated via a SQL migration, not npm.

---

## Architecture Patterns

### Recommended Project Structure Additions

```
src/
├── app/
│   ├── places/
│   │   ├── new/page.tsx              # place creation form (PLAC-01, PLAC-02, PLAC-03)
│   │   └── [id]/page.tsx             # place detail page (PLAC-04)
│   └── events/
│       ├── new/page.tsx              # event creation form (EVNT-01)
│       └── [id]/page.tsx             # event detail + RSVP list (EVNT-05)
├── actions/
│   ├── posts.ts                      # createPlace, createEvent Server Actions
│   ├── storage.ts                    # getSignedUploadUrl Server Action
│   └── rsvp.ts                       # rsvpToEvent, cancelRsvp Server Actions
├── components/
│   ├── posts/
│   │   ├── PlaceForm.tsx             # 'use client' — collects GPS, photos
│   │   ├── EventForm.tsx             # 'use client' — collects GPS, date/time
│   │   └── PhotoUploader.tsx         # 'use client' — react-dropzone + signed URL upload
│   └── events/
│       ├── RsvpButton.tsx            # 'use client' — RSVP toggle
│       └── AttendeeList.tsx          # server component or fetch in RSC
├── lib/
│   └── db/
│       ├── schema.ts                 # ADD: post_images, event_rsvps tables; new columns on posts
│       └── queries/
│           ├── posts.ts              # getPlaceById, getEventById, listPlacesForCity
│           └── gps.ts                # verifyGpsProximity (raw SQL ST_DWithin)
```

### Pattern 1: Signed Upload URL Two-Step Photo Upload

**What:** Server Action generates a signed upload URL (server-to-Supabase). Client uploads file directly to Supabase Storage using that URL. This avoids the 1MB Server Action body limit entirely.

**When to use:** Any form that accepts photo uploads.

```typescript
// Source: Supabase JS SDK docs — storage-from-createsigneduploadurl
// src/actions/storage.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/guards'

export async function getSignedUploadUrl(fileName: string, postId: string) {
  const { userId } = await requireAuth()
  const supabase = await createClient()

  // Path: posts/{postId}/{userId}-{timestamp}-{fileName}
  const ext = fileName.split('.').pop()
  const path = `posts/${postId}/${userId}-${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('post-images')
    .createSignedUploadUrl(path)

  if (error) throw new Error('Failed to create upload URL')

  return { signedUrl: data.signedUrl, path, token: data.token }
}
```

```typescript
// Client component — src/components/posts/PhotoUploader.tsx
// 'use client'
// After user selects files, for each file:

const { signedUrl, path, token } = await getSignedUploadUrl(file.name, postId)

// Upload directly to Supabase — bypasses Next.js body limit
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
await supabase.storage.from('post-images').uploadToSignedUrl(path, token, file, {
  contentType: file.type,
})
```

### Pattern 2: PostGIS GPS Proximity Verification

**What:** Browser sends `{ lat, lng, accuracy }` to a Server Action. Server runs `ST_DWithin` via raw SQL to assert the claimed location is within 200 meters of the stored `geography(POINT)` on the post. A separate accuracy pre-check rejects readings worse than 150 meters to prevent WiFi-derived imprecision from sneaking through.

**When to use:** Place creation (PLAC-02) and event creation (EVNT-01). Accuracy threshold and geofence radius are two distinct configurable values.

```typescript
// Source: PostGIS docs (ST_DWithin), Drizzle raw SQL pattern
// src/lib/db/queries/gps.ts

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const GPS_ACCURACY_THRESHOLD_METERS = 150  // reject readings worse than this
const GEOFENCE_RADIUS_METERS = 200          // must be within this of the place

export async function verifyGpsProximity(
  userLat: number,
  userLng: number,
  userAccuracy: number,  // from navigator.geolocation
  placeLat: number,
  placeLng: number
): Promise<{ verified: boolean; reason?: string }> {
  // Step 1: Reject imprecise readings before hitting the DB
  if (userAccuracy > GPS_ACCURACY_THRESHOLD_METERS) {
    return { verified: false, reason: 'GPS accuracy insufficient — move outdoors' }
  }

  // Step 2: PostGIS proximity check
  // ST_DWithin(geography, geography, meters) — uses spheroid, units are meters
  const result = await db.execute(sql`
    SELECT ST_DWithin(
      ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${placeLng}, ${placeLat}), 4326)::geography,
      ${GEOFENCE_RADIUS_METERS}
    ) AS within_range
  `)

  const withinRange = (result as any)[0]?.within_range ?? false
  if (!withinRange) {
    return { verified: false, reason: 'You must be physically at the location to post' }
  }

  return { verified: true }
}
```

**PostGIS activation migration** (Wave 0 of Phase 2):
```sql
-- supabase/migrations/0002_enable_postgis.sql
-- Run before any geography column is created
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
-- Add geography column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);
-- Add GIST index for spatial queries
CREATE INDEX IF NOT EXISTS posts_location_gist_idx ON posts USING GIST (location);
```

**Keeping lat/lng decimal columns:** The existing `lat`/`lng` decimal columns remain on `posts` as human-readable duplicates. The `location` geography column is the authoritative geospatial field for PostGIS operations. On insert, populate all three from the same input.

### Pattern 3: Event RSVP with Unique Constraint

**What:** `event_rsvps` table with a unique constraint on `(userId, postId)` prevents double-RSVPs. Server Action uses `INSERT ... ON CONFLICT DO NOTHING` for idempotent RSVP, and a separate delete action for cancellation.

**When to use:** Event detail page RSVP toggle (EVNT-03).

```typescript
// src/lib/db/schema.ts additions

export const eventRsvps = pgTable(
  'event_rsvps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('event_rsvps_user_post_unique').on(table.userId, table.postId),
    index('event_rsvps_post_idx').on(table.postId),
    index('event_rsvps_user_idx').on(table.userId),
  ]
)
```

### Pattern 4: Recurring Events Schema

**What:** Store recurrence as a PostgreSQL `interval` column (`'1 week'` or `'1 month'`) plus an optional `recurrenceEndsAt` timestamp. A SQL function computes occurrences on-demand via `generate_series`. No pre-materialized rows.

**When to use:** EVNT-04 recurring event creation and event feed queries.

```typescript
// Schema additions on posts table (via ALTER TABLE migration)
// recurrenceInterval: interval — '1 week' | '1 month' | null (non-recurring)
// recurrenceEndsAt:  timestamp — optional end of recurrence series

// In Drizzle schema, use customType for interval:
import { customType } from 'drizzle-orm/pg-core'

export const pgInterval = customType<{ data: string }>({
  dataType() { return 'interval' },
})

// Posts table additions (add to existing posts table definition):
// recurrenceInterval: pgInterval('recurrence_interval'),
// recurrenceEndsAt: timestamp('recurrence_ends_at', { withTimezone: true }),
```

SQL for computing next occurrence (for feed display):
```sql
-- For a recurring event, compute whether it has a future occurrence
-- using generate_series with the stored interval
SELECT id, title, starts_at + (n.n * recurrence_interval) AS next_occurrence
FROM posts
CROSS JOIN LATERAL generate_series(0, 100) AS n(n)
WHERE content_type = 'event'
  AND recurrence_interval IS NOT NULL
  AND starts_at + (n.n * recurrence_interval) > NOW()
  AND (recurrence_ends_at IS NULL OR starts_at + (n.n * recurrence_interval) <= recurrence_ends_at)
ORDER BY next_occurrence
LIMIT 1
```

### Pattern 5: Post Images Junction Table

**What:** A `post_images` table records storage path, display order, and foreign key to `posts`. Public URLs are derived at read time via `supabase.storage.from('post-images').getPublicUrl(path)`.

**When to use:** All place posts (PLAC-03) and event posts that include photos.

```typescript
// src/lib/db/schema.ts additions

export const postImages = pgTable(
  'post_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),  // 'posts/{postId}/{fileName}'
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('post_images_post_idx').on(table.postId),
  ]
)
```

### Pattern 6: Event Auto-Expiry (Feed Filter)

**What:** Events past their `endsAt` timestamp are excluded at query time. No cron job or background worker required for Phase 2. Phase 3 (feed) applies this filter universally.

**When to use:** Any query that lists events for a feed or search.

```typescript
// src/lib/db/queries/posts.ts
import { sql, and, eq, isNull, or, gt } from 'drizzle-orm'

// Filter: non-recurring events must have endsAt > now, or be null (no end time set)
// Recurring events with future occurrences are handled separately
const activeEventFilter = or(
  isNull(posts.endsAt),
  gt(posts.endsAt, sql`NOW()`)
)
```

### Anti-Patterns to Avoid

- **Passing photo files through Server Actions:** The 1MB body limit will silently fail or throw. Always use signed upload URLs.
- **Using lat/lng decimal columns for proximity queries:** Decimal math does not use spatial indexes. Use `ST_DWithin` on the `geography` column.
- **Pre-generating recurring event occurrence rows:** Every edit to a recurring event requires updating potentially hundreds of rows. Store the interval, compute occurrences at query time.
- **Trusting browser GPS without an accuracy check:** `accuracy` of 5000m (IP-based) and `accuracy` of 10m (GPS satellite) are both valid `getCurrentPosition` results. Reject readings above 150m before calling PostGIS.
- **Checking local status with a global `role` column:** Phase 1 established that `isUserLocalInCity(userId, cityId)` is the only correct check. Phase 2 Server Actions MUST call this function, not check any profile column.
- **Creating the `post_images` bucket as private without RLS policies:** Supabase Storage blocks all operations on buckets without RLS. The bucket must exist and have policies before any upload is attempted.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo upload bypassing body limit | Chunked upload via multiple Server Actions | Supabase `createSignedUploadUrl` + `uploadToSignedUrl` | Signed URLs are the official pattern; handles auth, expiry, and CDN correctly |
| Proximity math in application code | Haversine formula in TypeScript | PostGIS `ST_DWithin(geography, geography, meters)` | PostGIS uses spatial indexes; JavaScript Haversine does not scale, misses edge cases at poles |
| Image resizing | Sharp.js pipeline in Server Action | Supabase Storage image transformations (Pro plan) or accept originals in Phase 2 | Image resizing is Pro-only; for free tier Phase 2, store originals and constrain upload size client-side |
| Double-RSVP prevention | Application-level check before insert | PostgreSQL `UNIQUE` constraint on `(userId, postId)` + `ON CONFLICT DO NOTHING` | Unique constraint is race-condition-safe; application-level checks are not |
| Recurring event date generation | Custom date arithmetic in TypeScript | PostgreSQL `interval` type + `generate_series` | PostgreSQL interval handles month boundaries, leap years, DST correctly |
| File type validation | Server-side MIME magic bytes check | Client-side MIME type check (react-dropzone `accept` prop) + Supabase bucket `allowedMimeTypes` config | Defense in depth: client validates UX, bucket config enforces server-side |

**Key insight:** PostGIS and Supabase Storage together handle the two hardest technical problems in Phase 2 (spatial verification and file storage). The application layer should only coordinate — not implement — these concerns.

---

## Common Pitfalls

### Pitfall 1: PostGIS Not Enabled Before First GPS-Related Migration

**What goes wrong:** `drizzle-kit push` or `drizzle-kit migrate` runs before the PostGIS extension is enabled. The `geography` type is not recognized, and the migration fails with `type "geography" does not exist`.

**Why it happens:** `CREATE EXTENSION postgis` must precede any DDL that uses PostGIS types. Drizzle does not enable extensions automatically.

**How to avoid:** Wave 0 of Phase 2 MUST include a SQL migration that runs `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;` before any table migration that references `geography`. This migration runs first, always.

**Warning signs:** Migration error mentioning unknown type `geography` or `POINT`.

### Pitfall 2: Geography vs Geometry Type Confusion

**What goes wrong:** Using `geometry(POINT, 4326)` instead of `geography(POINT, 4326)`. The `geometry` type uses planar (2D) math — distances are in degrees, not meters. `ST_DWithin(geometry, geometry, 200)` would check if points are within 200 degrees, not 200 meters.

**Why it happens:** Drizzle's built-in `geometry()` helper defaults to the geometry type. The geography type requires explicit casting or a `customType`.

**How to avoid:** All proximity checks in CityLocal use `geography` type. When using raw SQL with PostGIS, always cast: `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`.

**Warning signs:** `ST_DWithin` returns `true` for locations clearly far apart, or returns `false` for adjacent points.

### Pitfall 3: Longitude/Latitude Argument Order in PostGIS

**What goes wrong:** `ST_MakePoint(lat, lng)` instead of `ST_MakePoint(lng, lat)`. PostGIS and all geospatial standards use (x, y) = (longitude, latitude), not the conventional human reading order of (lat, lng).

**Why it happens:** Browser Geolocation API returns `{ latitude, longitude }` — humans think lat-first. PostGIS expects (lng, lat).

**How to avoid:** In every PostGIS function call, pass longitude as the first argument: `ST_MakePoint(${userLng}, ${userLat})`. Add a comment on every such call.

**Warning signs:** The proximity check fails for users who are clearly at the correct location, or passes for distant locations in a symmetric geographic pattern.

### Pitfall 4: Missing Supabase Storage Bucket and RLS Policies

**What goes wrong:** `getSignedUploadUrl` call fails with a `storage/bucket-not-found` error, or the upload succeeds but `getPublicUrl` returns a 403. This blocks Phase 2 entirely.

**Why it happens:** Supabase Storage buckets are not created automatically. The bucket must be created (public or private with policies) before the first upload. RLS on `storage.objects` blocks all operations by default.

**How to avoid:** Wave 0 of Phase 2 includes the bucket creation SQL and RLS policy SQL as migrations. The bucket is created as **public** (so `getPublicUrl` works without signed read URLs for photos), with INSERT restricted to authenticated users uploading to their own folder.

```sql
-- Create post-images bucket (public — photos are intentionally public)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'post-images',
  'post-images',
  true,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  10485760  -- 10MB per file
)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to their own folder within posts/
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = 'posts'
);

-- Public read for all post images
CREATE POLICY "Post images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');
```

**Warning signs:** 400/403 errors from Supabase Storage SDK; upload appearing to succeed but URLs returning 403.

### Pitfall 5: ContributionsList Refactor from Phase 1

**What goes wrong:** Phase 1 left `ContributionsList` as a synchronous stub (documented in STATE.md). Phase 2 must refactor it to query real posts. Forgetting this creates a profile page that never shows real place/event contributions.

**Why it happens:** Phase 1 explicitly deferred making ContributionsList async because react-dom/client in tests cannot render async RSCs.

**How to avoid:** Phase 2 plans must include the ContributionsList refactor (query `posts WHERE author_id = userId`) as a specific task.

**Warning signs:** Profile page shows zero contributions even after a user has created posts.

### Pitfall 6: GPS Accuracy vs Geofence Radius Conflation

**What goes wrong:** Using a single threshold for both "is the GPS signal good enough to trust?" and "is the user within the geofence?". These are independent checks.

**Why it happens:** Accuracy (how precise the reported position is) and geofence radius (how close the user must be) are both in meters and easy to conflate.

**How to avoid:** Two separate constants: `GPS_ACCURACY_THRESHOLD_METERS = 150` (reject the reading if worse than this) and `GEOFENCE_RADIUS_METERS = 200` (the user's reported position must be within this distance of the place). The accuracy check runs first, before PostGIS.

---

## Code Examples

Verified patterns from official sources:

### Supabase Storage: Create Signed Upload URL (Server Action)

```typescript
// Source: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
// Valid for 2 hours; client uses uploadToSignedUrl() with the returned token

const { data, error } = await supabase.storage
  .from('post-images')
  .createSignedUploadUrl('posts/post-uuid/user-uuid-1234567890.jpg')

// Returns: { signedUrl: string, path: string, token: string }
```

### Supabase Storage: Upload to Signed URL (Client Component)

```typescript
// Source: Supabase JS SDK
// 'use client' component after receiving signedUrl and token from Server Action

const { error } = await supabase.storage
  .from('post-images')
  .uploadToSignedUrl(path, token, file, {
    contentType: file.type,
  })
```

### Supabase Storage: Get Public URL

```typescript
// Source: Supabase JS SDK
// For public buckets, no expiry — safe to store publicUrl in post_images table

const { data } = supabase.storage
  .from('post-images')
  .getPublicUrl('posts/post-uuid/user-uuid-1234567890.jpg')

// Returns: { publicUrl: string }
```

### PostGIS: Proximity Verification (Raw SQL via Drizzle)

```typescript
// Source: https://postgis.net/docs/ST_DWithin.html
// Geography type — distance is in meters, uses spheroid by default

const result = await db.execute(sql`
  SELECT ST_DWithin(
    ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
    ST_SetSRID(ST_MakePoint(${placeLng}, ${placeLat}), 4326)::geography,
    ${GEOFENCE_RADIUS_METERS}
  ) AS within_range
`)
```

### Browser Geolocation API (Client Component)

```typescript
// Source: MDN Web API — navigator.geolocation
// Must be in a 'use client' component; accuracy is in meters (95% confidence)

function requestGps(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,  // meters, 95% confidence
      }),
      (err) => reject(err),
      {
        enableHighAccuracy: true,   // request GPS over WiFi when available
        timeout: 15000,             // 15 seconds before timeout error
        maximumAge: 0,              // never use cached position for verification
      }
    )
  })
}
```

### Drizzle: Event RSVP with ON CONFLICT DO NOTHING

```typescript
// Source: Drizzle ORM docs — insert with conflict handling

import { sql } from 'drizzle-orm'

await db
  .insert(eventRsvps)
  .values({ userId, postId })
  .onConflictDoNothing()  // unique(userId, postId) prevents double-RSVP
```

### Drizzle: Active Events Query (Excludes Past Events)

```typescript
// Source: Drizzle ORM docs — conditional filtering

import { or, isNull, gt, sql } from 'drizzle-orm'

const events = await db
  .select()
  .from(posts)
  .where(
    and(
      eq(posts.contentType, 'event'),
      eq(posts.cityId, cityId),
      isNull(posts.deletedAt),
      eq(posts.status, 'active'),
      // EVNT-02: hide events past their end date
      or(
        isNull(posts.endsAt),
        gt(posts.endsAt, sql`NOW()`)
      )
    )
  )
  .orderBy(desc(posts.startsAt))
```

---

## Schema Additions for Phase 2

The following additions to `schema.ts` are required (do not remove existing Phase 1 tables):

```typescript
// 1. New columns on posts table (via migration)
// Add to existing posts table definition:
//   location: geography(POINT, 4326) — PostGIS geography column
//   locationName: varchar(200) — human-readable location label for events
//   recurrenceInterval: interval — '1 week' | '1 month' | null
//   recurrenceEndsAt: timestamp — end of recurrence series

// 2. New: placeCategoryEnum
export const placeCategoryEnum = pgEnum('place_category', [
  'restaurant', 'cafe', 'bar', 'activity', 'sport',
  'tourist_attraction', 'shopping', 'other'
])
// IMPORTANT: Update posts.category column type from varchar to use this enum

// 3. New: post_images table
export const postImages = pgTable('post_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('post_images_post_idx').on(table.postId),
])

// 4. New: event_rsvps table
export const eventRsvps = pgTable('event_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('event_rsvps_user_post_unique').on(table.userId, table.postId),
  index('event_rsvps_post_idx').on(table.postId),
  index('event_rsvps_user_idx').on(table.userId),
])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pass files through Server Action body | Signed upload URL (two-step) | Always for large files; documented clearly since Next.js 14 | Required — Next.js Server Actions have 1MB body limit by default |
| `geometry` type for location | `geography` type for location | PostGIS standard for lat/lng data | Geography type's distance is in meters; geometry distance is in degrees |
| Pre-generate recurring event rows | Store `interval`, compute occurrences via SQL | Established pattern from thoughtbot/PostgreSQL community | Simpler data model, no maintenance job required |
| Supabase Storage image transformations | Not available on free tier (Pro only) | N/A — always been Pro-only | Phase 2 must store and serve original images; resize via CSS |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs` — still deprecated, use `@supabase/ssr` (established in Phase 1, reminder for Phase 2 storage code)
- Supabase `ANON_KEY` env var name — use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (established in Phase 1)

---

## Open Questions

1. **PostGIS extension schema location on Supabase**
   - What we know: Supabase docs show `CREATE EXTENSION postgis WITH SCHEMA extensions;` — PostGIS is installed under `extensions` schema, not public
   - What's unclear: Whether Drizzle raw SQL calls to `ST_DWithin` need to be prefixed as `extensions.ST_DWithin` or whether Supabase configures the search path so unqualified `ST_DWithin` resolves correctly
   - Recommendation: Use unqualified function names in raw SQL (Supabase sets `search_path` to include `extensions`); verify against actual Supabase project when activating PostGIS in Wave 0. If unqualified fails, prefix with `extensions.`.

2. **Geofence radius for Paris (urban density)**
   - What we know: STATE.md flags geofence radius as needing a design decision; 200m is the research default
   - What's unclear: Whether 200m is appropriate for dense urban Paris vs a suburban area. A restaurant in a Paris arrondissement may be 50m from another. 200m may be too generous in some blocks.
   - Recommendation: Use 200m as the Phase 2 default (matches the accuracy threshold approach). Make it a named constant that can be tuned per-city in the future. Document that this is intentionally generous for Phase 2.

3. **ContributionsList refactor scope**
   - What we know: Phase 1 left `ContributionsList` as a synchronous stub (STATE.md decision record)
   - What's unclear: Whether the refactor belongs in Phase 2 Wave 0 or Wave 1
   - Recommendation: Wave 0 of Phase 2 — the profile page should show real contributions as soon as posts exist.

4. **Category enum migration from varchar**
   - What we know: `posts.category` was created as `varchar(50)` in Phase 1 (nullable)
   - What's unclear: Whether to convert the column type to the new `placeCategoryEnum` in Phase 2, or keep varchar and validate at the application layer
   - Recommendation: Add `placeCategoryEnum` as a new PostgreSQL enum and alter the `posts.category` column to use it. This enforces valid categories at the database level. Include a migration to convert existing null values.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest) + React Testing Library |
| Config file | `vitest.config.ts` (exists from Phase 1) |
| Quick run command | `npx vitest run tests/posts/ tests/gps/ tests/storage/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAC-01 | `createPlace` Server Action validates name, category, description fields | unit | `npx vitest run tests/posts/create-place.test.ts` | Wave 0 |
| PLAC-01 | `createPlace` rejects unauthenticated callers | unit | `npx vitest run tests/posts/create-place.test.ts` | Wave 0 |
| PLAC-01 | `createPlace` rejects non-locals (isUserLocalInCity = false) | unit | `npx vitest run tests/posts/create-place.test.ts` | Wave 0 |
| PLAC-02 | `verifyGpsProximity` returns false when user accuracy > 150m | unit | `npx vitest run tests/gps/proximity.test.ts` | Wave 0 |
| PLAC-02 | `verifyGpsProximity` returns true when user is within 200m | unit | `npx vitest run tests/gps/proximity.test.ts` | Wave 0 |
| PLAC-02 | `verifyGpsProximity` returns false when user is >200m away | unit | `npx vitest run tests/gps/proximity.test.ts` | Wave 0 |
| PLAC-03 | `getSignedUploadUrl` returns signedUrl and path for authenticated user | unit | `npx vitest run tests/storage/signed-url.test.ts` | Wave 0 |
| PLAC-03 | `createPlace` inserts into `post_images` table with correct postId and storagePath | unit | `npx vitest run tests/posts/create-place.test.ts` | Wave 0 |
| PLAC-04 | Place detail page renders title, category, body, and photo URLs | unit | `npx vitest run tests/posts/place-detail.test.tsx` | Wave 0 |
| PLAC-05 | `createPlace` rejects invalid category not in enum | unit | `npx vitest run tests/posts/create-place.test.ts` | Wave 0 |
| EVNT-01 | `createEvent` validates startsAt, endsAt, locationName | unit | `npx vitest run tests/posts/create-event.test.ts` | Wave 0 |
| EVNT-01 | `createEvent` applies same GPS verification as place creation | unit | `npx vitest run tests/posts/create-event.test.ts` | Wave 0 |
| EVNT-02 | Active events query excludes posts with `endsAt < NOW()` | unit | `npx vitest run tests/posts/event-queries.test.ts` | Wave 0 |
| EVNT-02 | Active events query includes posts with `endsAt = null` | unit | `npx vitest run tests/posts/event-queries.test.ts` | Wave 0 |
| EVNT-03 | `rsvpToEvent` inserts into `event_rsvps` | unit | `npx vitest run tests/rsvp/rsvp.test.ts` | Wave 0 |
| EVNT-03 | `rsvpToEvent` is idempotent (double call does not error, does not duplicate) | unit | `npx vitest run tests/rsvp/rsvp.test.ts` | Wave 0 |
| EVNT-03 | `rsvpToEvent` rejects unauthenticated callers | unit | `npx vitest run tests/rsvp/rsvp.test.ts` | Wave 0 |
| EVNT-04 | `createEvent` with recurrenceInterval='1 week' stores correct interval value | unit | `npx vitest run tests/posts/create-event.test.ts` | Wave 0 |
| EVNT-04 | Recurrence query generates correct next occurrence for weekly event | unit | `npx vitest run tests/posts/recurrence.test.ts` | Wave 0 |
| EVNT-05 | Event detail page renders attendee count and list of usernames | unit | `npx vitest run tests/posts/event-detail.test.tsx` | Wave 0 |
| Schema | `post_images` table exists with correct FK and index | unit | `npx vitest run tests/db/schema-phase2.test.ts` | Wave 0 |
| Schema | `event_rsvps` table enforces unique (userId, postId) | unit | `npx vitest run tests/db/schema-phase2.test.ts` | Wave 0 |

**Manual-only tests (cannot be automated without a real Supabase project):**
- PostGIS extension activation and `ST_DWithin` returning correct results on actual DB
- Supabase Storage bucket creation and RLS policy enforcement
- `uploadToSignedUrl` actual file delivery to Supabase CDN
- Browser `navigator.geolocation` permission prompt behavior

### Sampling Rate

- **Per task commit:** `npx vitest run tests/posts/ tests/gps/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/posts/create-place.test.ts` — covers PLAC-01, PLAC-02, PLAC-03, PLAC-05
- [ ] `tests/posts/place-detail.test.tsx` — covers PLAC-04
- [ ] `tests/posts/create-event.test.ts` — covers EVNT-01, EVNT-04
- [ ] `tests/posts/event-queries.test.ts` — covers EVNT-02
- [ ] `tests/posts/event-detail.test.tsx` — covers EVNT-05
- [ ] `tests/posts/recurrence.test.ts` — covers EVNT-04 recurrence logic
- [ ] `tests/rsvp/rsvp.test.ts` — covers EVNT-03
- [ ] `tests/gps/proximity.test.ts` — covers PLAC-02 (unit test verifyGpsProximity logic; mocks db.execute)
- [ ] `tests/storage/signed-url.test.ts` — covers PLAC-03 (mocks Supabase storage client)
- [ ] `tests/db/schema-phase2.test.ts` — covers post_images and event_rsvps schema constraints

*(No new framework installs needed — Vitest infrastructure from Phase 1 is sufficient)*

---

## Sources

### Primary (HIGH confidence)

- [Supabase: Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) — standard upload API, 6MB threshold for TUS
- [Supabase: Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) — TUS protocol, signed upload URL with token, 24-hour URL validity
- [Supabase JS Reference: createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) — signed URL valid 2 hours, requires `insert` permission on objects
- [Supabase: Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — RLS policies on storage.objects, bucket-level policies pattern
- [Supabase: PostGIS Geo Queries](https://supabase.com/docs/guides/database/extensions/postgis) — enabling extension, geography type, distance queries
- [PostGIS: ST_DWithin](https://postgis.net/docs/ST_DWithin.html) — geography overload, meters unit, use_spheroid parameter, bounding box index usage
- [Drizzle ORM: PostGIS Geometry Point](https://orm.drizzle.team/docs/guides/postgis-geometry-point) — geometry/geography type support, raw SQL approach for filtering
- [Next.js: serverActions configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) — bodySizeLimit default 1MB, configuration via next.config.js
- [MDN: GeolocationCoordinates.accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy) — accuracy is meters at 95% confidence
- [Supabase: Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) — Pro plan only, format support

### Secondary (MEDIUM confidence)

- [thoughtbot: Recurring Events and PostgreSQL](https://thoughtbot.com/blog/recurring-events-and-postgresql) — PostgreSQL interval type for recurrence, generate_series pattern (verified against PostgreSQL interval docs)
- [Drizzle ORM: Rows in given radius with PostGIS](https://sofiyevsr.com/blog/how-to-return-rows-in-given-radius-with-postgresql-postgis-and-drizzleorm/) — raw SQL workaround for geography type in Drizzle filters (multiple sources agree on raw SQL approach)
- [Next.js discussions: Server Action body size limit](https://github.com/vercel/next.js/discussions/57973) — community confirmation of 1MB default, signed URL as standard workaround

### Tertiary (LOW confidence)

- Community pattern for `post_images` junction table — no single authoritative source, derived from common relational patterns + Supabase metadata discussion

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs; Supabase Storage and PostGIS patterns verified
- Photo upload pattern: HIGH — signed URL pattern confirmed in Supabase reference docs and Next.js bodySizeLimit docs
- GPS verification: HIGH — PostGIS ST_DWithin with geography confirmed in official PostGIS docs; accuracy approach confirmed via MDN
- Recurring events: MEDIUM-HIGH — PostgreSQL interval type verified; generate_series approach is well-documented but specific query form is community-verified not official-doc-verified
- Storage RLS policies: HIGH — verified against official Supabase access control docs
- Schema additions: HIGH — follows established Phase 1 patterns

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (30 days — APIs are stable; monitor Supabase Storage changelog for any signed URL API changes)
