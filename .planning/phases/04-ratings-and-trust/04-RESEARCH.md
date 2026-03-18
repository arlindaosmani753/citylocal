# Phase 4: Ratings and Trust — Research

**Researched:** 2026-03-18
**Domain:** Star ratings, written reviews, denormalized aggregation, report/flag surfacing
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RATE-01 | Any authenticated user can leave a star rating (1–5) on a place or event they visited | `reviews` table + `createReview` Server Action behind `requireAuth`; one review per user per target enforced by `uniqueIndex` |
| RATE-02 | Rating includes an optional written review alongside the star score | `body text` column on `reviews` table, nullable; Zod schema validates `min(0).max(2000)` when present |
| RATE-03 | Any user can report/flag a place, event, or review as inappropriate | `reports` table already exists in schema with `targetType` varchar supporting `'post' \| 'review'`; `reportContent` Server Action behind `requireAuth` |
| RATE-04 | Average rating and total review count are displayed on place and event cards and detail pages | Denormalized `rating_summary` table with `avgRating decimal` and `reviewCount integer`; written through on every `createReview` via DB transaction |
</phase_requirements>

---

## Summary

Phase 4 closes the trust loop by allowing authenticated users to rate and review places and events, and by surfacing those aggregates everywhere content appears. The phase also activates the report/flag mechanism whose data model was laid down in Phase 1.

The core engineering challenge is maintaining a consistent denormalized aggregate (`avg_rating`, `review_count`) that is always in sync with the `reviews` table without running expensive COUNT/AVG queries on every feed render. The roadmap already specifies a `rating_summary` table written through in the same DB transaction as each review insert/delete — this is the right approach for a read-heavy feed.

The report/flag path is straightforward: the `reports` table already exists, `targetType` already accepts `'post' | 'review'`, and the only new work is a Server Action + minimal UI. No schema migration is needed for reports.

**Primary recommendation:** Use a single DB transaction for review writes — insert into `reviews`, then upsert into `rating_summary` using a Postgres aggregate subquery. This guarantees consistency without triggers. Drizzle's `onConflictDoUpdate` makes the upsert clean.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 (installed) | `reviews` + `rating_summary` table definitions, query builder | Already used for all prior schema; array-syntax indexes required |
| zod | ^4.3.6 (installed) | Validate `stars` (1–5 integer), optional `body` | Project standard; `.issues[0].message` for error extraction |
| Next.js Server Actions | 16.1.6 (installed) | `createReview`, `deleteReview`, `reportContent` mutations | Project standard for all mutations |
| @supabase/ssr | ^0.9.0 (installed) | `requireAuth()` guard — all review/report actions gated | Auth standard |
| shadcn/ui | ^4.0.8 (installed) | Buttons, form structure | UI standard; `--defaults` flag, base-nova preset |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 (installed) | Star icon (`Star`, `StarOff`) for rating display | Use for star rendering — no additional install needed |
| react-hook-form | ^7.71.2 (installed) | Form state in `ReviewForm` client component | Already used in PlaceForm/EventForm; consistent pattern |
| @hookform/resolvers | ^5.2.2 (installed) | Zod resolver for react-hook-form | Paired with react-hook-form |
| date-fns | ^4.1.0 (installed) | Format review timestamps | Already used in EventPage |

### No New Installs Required

All required libraries are already present in `package.json`. Phase 4 adds zero new dependencies.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── lib/db/
│   ├── schema.ts                      # Add: reviews table, rating_summary table
│   └── queries/
│       └── ratings.ts                 # getReviewsForPost, getRatingSummary
├── actions/
│   └── reviews.ts                     # createReview, deleteReview, reportContent
└── components/
    └── ratings/
        ├── StarRating.tsx             # Read-only star display (n stars filled)
        ├── RatingBadge.tsx            # Inline "4.2 (17 reviews)" for feed cards
        └── ReviewForm.tsx             # 'use client' — star picker + optional text
```

### Pattern 1: Transactional Write-Through to rating_summary

**What:** `createReview` inserts a review row and upserts `rating_summary` in one `db.transaction()`. The summary row holds pre-computed `avg_rating` and `review_count` so feed queries never aggregate on the fly.

**When to use:** Every review insert or delete must use this pattern. Never let the two tables diverge.

```typescript
// Source: established pattern from src/actions/posts.ts — db.transaction()
export async function createReview(input: CreateReviewInput) {
  const user = await requireAuth()
  const parsed = createReviewSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.transaction(async (tx) => {
    await tx.insert(reviews).values({
      postId:     parsed.data.postId,
      authorId:   user.id,
      stars:      parsed.data.stars,
      body:       parsed.data.body ?? null,
    })

    // Recalculate aggregate from source-of-truth reviews table
    const [agg] = await tx
      .select({
        avg:   sql<string>`AVG(stars)::numeric(3,2)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.postId, parsed.data.postId))

    await tx
      .insert(ratingSummary)
      .values({
        postId:      parsed.data.postId,
        avgRating:   agg.avg,
        reviewCount: agg.count,
        updatedAt:   new Date(),
      })
      .onConflictDoUpdate({
        target: ratingSummary.postId,
        set: {
          avgRating:   agg.avg,
          reviewCount: agg.count,
          updatedAt:   new Date(),
        },
      })
  })

  return { success: true }
}
```

**Confidence:** HIGH — matches Drizzle `onConflictDoUpdate` API and established project transaction pattern.

### Pattern 2: One Review Per User Per Target (DB-Level Enforcement)

**What:** `uniqueIndex` on `(post_id, author_id)` in the `reviews` table prevents duplicate reviews at the DB level, matching how `eventRsvps` enforces one RSVP per user per event.

**Why:** Application-level checks race. DB constraint is authoritative and returns a clear error.

```typescript
// Source: established pattern from schema.ts eventRsvps uniqueIndex
(table) => [
  uniqueIndex('reviews_post_author_unique').on(table.postId, table.authorId),
  index('reviews_post_idx').on(table.postId),
  index('reviews_author_idx').on(table.authorId),
]
```

### Pattern 3: Read rating_summary in Feed Queries (Join, Not Subquery)

**What:** `getFeedForCity` and `getPlaceById`/`getEventById` join `rating_summary` on `post_id` to include `avgRating` and `reviewCount` in the result. No aggregation at read time.

**When to use:** Everywhere a rating display is needed — feed cards, detail pages.

```typescript
// Extend FeedPost type to include rating fields
export type FeedPost = {
  // ...existing fields...
  avgRating:   string | null   // null = no reviews yet
  reviewCount: number | null
}
```

### Pattern 4: reportContent Server Action

**What:** The `reports` table already exists from Phase 1. The action calls `requireAuth()` then inserts a report row. `targetType` is `'post' | 'review'` (already in schema varchar).

**No schema migration needed.** Only new work: the Server Action and a "Report" button/modal.

```typescript
// Source: schema.ts reports table
export async function reportContent(input: ReportInput) {
  const user = await requireAuth()
  // insert into reports table — already exists
}
```

### Pattern 5: StarRating Display Component

**What:** A simple presentational component that renders N filled stars and (5-N) empty stars. Read-only variant for display; interactive variant (`RadioGroup` hidden inputs) for the review form.

**Use lucide-react `Star` icon** — already installed, avoids adding a star-rating library.

```tsx
// Source: lucide-react Star icon, project shadcn/ui button conventions
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={i < value ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
          size={16}
        />
      ))}
    </span>
  )
}
```

### Anti-Patterns to Avoid

- **Aggregate query on every feed render:** Never run `AVG(stars) GROUP BY post_id` inside `getFeedForCity`. Always read from `rating_summary`.
- **Optimistic update for avgRating on feed cards:** The avg changes on every new review — optimistic update would be wrong. Accept the ~60 second stale window from `export const revalidate = 60` already set on CityPage.
- **Storing star rating as float in reviews table:** Store as `integer` (1–5). Average is computed in the summary table, not per-row.
- **targetType as enum:** The existing `reports` schema uses `varchar(20)` for `targetType`. Do not change it to a DB enum — the varchar already works and changing it requires a migration with no benefit.

---

## Schema Changes Required

### New Table: reviews

```sql
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body        TEXT,
  status      content_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (post_id, author_id)
);

CREATE INDEX reviews_post_idx   ON reviews (post_id);
CREATE INDEX reviews_author_idx ON reviews (author_id);
CREATE INDEX reviews_status_idx ON reviews (status);
```

### New Table: rating_summary

```sql
CREATE TABLE rating_summary (
  post_id      UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  avg_rating   NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### No Changes to Existing Tables

- `reports` table already handles `targetType = 'review'` via varchar
- `posts` table needs NO new columns — aggregates live in `rating_summary`
- `FeedPost` type in `feed.ts` needs two new fields added to the SELECT and the type definition

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique constraint | Application-level check before insert | DB `uniqueIndex` on `(post_id, author_id)` | Race conditions; same pattern as `eventRsvps` |
| Rating aggregate | In-query `AVG()` on feed render | `rating_summary` denormalized table | N+1 at scale; feed shows 20 cards simultaneously |
| Star icon rendering | Custom SVG star | `lucide-react Star` | Already installed, accessible, consistent with icon set |
| Form validation | Manual checks | Zod schema + react-hook-form resolver | Project standard; consistent error UX |
| Optimistic avg update | Client-side recalculate | Accept revalidate=60 stale window | Average depends on all reviews, not just the new one |

---

## Common Pitfalls

### Pitfall 1: Forgetting to Join rating_summary in Feed Query

**What goes wrong:** Feed cards show no rating data even though reviews exist.

**Why it happens:** `getFeedForCity` SELECT list is not updated to include the join.

**How to avoid:** Update `FeedPost` type first (TypeScript will catch missing fields), then add the `leftJoin(ratingSummary, eq(ratingSummary.postId, posts.id))` and add `avgRating`/`reviewCount` to the select object.

**Warning signs:** `avgRating` is always `null` on every card.

### Pitfall 2: Decimal Column Type for avgRating

**What goes wrong:** `drizzle-orm` `decimal` columns return `string` not `number` (same as `posts.lat`/`posts.lng`). Arithmetic on it without parsing will produce `NaN`.

**Why it happens:** Postgres `NUMERIC` is returned as string to avoid JS float precision loss.

**How to avoid:** In `RatingBadge.tsx`, parse with `parseFloat(avgRating).toFixed(1)` before display. Document the `string | null` type explicitly on `FeedPost`.

**Warning signs:** `"NaN"` appears in place of the rating badge.

### Pitfall 3: Missing onConflictDoUpdate Target

**What goes wrong:** Drizzle `onConflictDoUpdate` requires the `target` field. Omitting it causes a runtime error, not a TypeScript error.

**Why it happens:** The Drizzle API is not enforced at compile time when `target` is optional in older versions.

**How to avoid:** Always pass `target: ratingSummary.postId` explicitly.

### Pitfall 4: Report Already Flagged Content

**What goes wrong:** A user reports content that is already `status: 'hidden'` or `status: 'removed'`. The report succeeds but is noise.

**Why it happens:** No guard against reporting already-moderated content.

**How to avoid:** In `reportContent` action, query the target's current status before inserting. If `status !== 'active'`, return early with a user-friendly message.

### Pitfall 5: Zod v4 Issues Array (Known Project Decision)

**What goes wrong:** Error extraction from failed Zod parse uses `.errors[0].message` instead of `.issues[0].message`.

**Why it happens:** Zod v4 changed the API. Documented in STATE.md.

**How to avoid:** Always use `parsed.error.issues[0].message`. This is a project-wide invariant.

### Pitfall 6: review_count vs. COUNT(*) Drift

**What goes wrong:** `rating_summary.review_count` drifts from the actual number of active reviews if soft-delete is not accounted for.

**Why it happens:** `deletedAt IS NOT NULL` reviews should not count. The aggregate subquery must filter: `WHERE deleted_at IS NULL AND status = 'active'`.

**How to avoid:** The recalculation query in the transaction must always filter on `isNull(reviews.deletedAt)` and `eq(reviews.status, 'active')`.

---

## Code Examples

### Drizzle Schema — reviews table

```typescript
// src/lib/db/schema.ts additions
export const reviews = pgTable(
  'reviews',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    authorId:  uuid('author_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    stars:     integer('stars').notNull(),           // 1–5, enforced by Zod + DB CHECK
    body:      text('body'),                          // optional written review
    status:    contentStatusEnum('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('reviews_post_author_unique').on(table.postId, table.authorId),
    index('reviews_post_idx').on(table.postId),
    index('reviews_author_idx').on(table.authorId),
    index('reviews_status_idx').on(table.status),
  ]
)

export const ratingSummary = pgTable('rating_summary', {
  postId:      uuid('post_id').primaryKey().references(() => posts.id, { onDelete: 'cascade' }),
  avgRating:   decimal('avg_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### Zod Validation Schema

```typescript
// src/actions/reviews.ts
const createReviewSchema = z.object({
  postId: z.string().uuid(),
  stars:  z.number().int().min(1).max(5),
  body:   z.string().max(2000).optional(),
})
```

### Feed Query Extension (adding rating join)

```typescript
// src/lib/db/queries/feed.ts — extend the select and leftJoin
const rows = await db
  .select({
    // ...existing fields...
    avgRating:   ratingSummary.avgRating,
    reviewCount: ratingSummary.reviewCount,
  })
  .from(posts)
  .leftJoin(profiles, eq(profiles.id, posts.authorId))
  .leftJoin(postImages, and(
    eq(postImages.postId, posts.id),
    eq(postImages.displayOrder, 0)
  ))
  .leftJoin(ratingSummary, eq(ratingSummary.postId, posts.id))  // NEW
  .where(and(...conditions))
  .orderBy(desc(posts.createdAt), desc(posts.id))
  .limit(fetchLimit)
```

### RatingBadge Component

```tsx
// src/components/ratings/RatingBadge.tsx
type Props = { avgRating: string | null; reviewCount: number | null }

export function RatingBadge({ avgRating, reviewCount }: Props) {
  if (!reviewCount || reviewCount === 0) return null
  return (
    <span aria-label={`${parseFloat(avgRating ?? '0').toFixed(1)} stars from ${reviewCount} reviews`}>
      ★ {parseFloat(avgRating ?? '0').toFixed(1)}
      <span className="text-neutral-500 ml-1">({reviewCount})</span>
    </span>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Postgres trigger to maintain aggregate | In-transaction recalculation via `AVG()` subquery | Triggers are opaque and hard to test; transactional recalculation is explicit, testable, and consistent with project patterns |
| Separate rating column on posts table | Dedicated `rating_summary` table | Avoids polluting the unified posts table; easier to invalidate/recalculate |
| Five separate `star_1_count` ... `star_5_count` columns | Single `avg_rating` + `review_count` | v1 only needs average display; histogram is a v2 feature |

**Deprecated/outdated:**
- Database triggers for aggregate maintenance: Not used in this project — hard to test with Drizzle mocking patterns, opaque to the application layer.

---

## Existing Infrastructure Inventory

The following is confirmed present from reading the codebase — no new installs needed:

| Need | Already Exists | Location |
|------|---------------|----------|
| Auth guard | `requireAuth()` | `src/lib/guards.ts` |
| DB transaction pattern | `db.transaction(async tx => {...})` | `src/actions/posts.ts` |
| Reports table | `reports` pgTable | `src/lib/db/schema.ts` line 149 |
| `reportReasonEnum` | `pgEnum('report_reason', ['spam','inappropriate','fake','other'])` | `src/lib/db/schema.ts` line 18 |
| Soft-delete pattern | `deletedAt` in shared `timestamps` | `src/lib/db/schema.ts` line 21 |
| `contentStatusEnum` | `pgEnum('content_status', ['active','hidden','removed'])` | `src/lib/db/schema.ts` line 17 |
| Feed card component | `FeedCard` | `src/components/feed/FeedCard.tsx` |
| Place detail page | `PlacePage` | `src/app/places/[id]/page.tsx` |
| Event detail page | `EventPage` | `src/app/events/[id]/page.tsx` |
| `getPlaceById` | returns `place` with images | `src/lib/db/queries/posts.ts` |
| `getEventById` | returns `event` with attendees | `src/lib/db/queries/posts.ts` |

---

## Open Questions

1. **One review per user: hard block or replace?**
   - What we know: DB `uniqueIndex` prevents second insert — it will throw a unique violation.
   - What's unclear: Should the UX let a user update their existing review, or show "You already reviewed this"?
   - Recommendation: For v1 simplicity, block with a friendly error message. `deleteReview` then `createReview` is the edit path. Avoids upsert complexity. If ROADMAP changes this, add an `updateReview` action.

2. **Flag count increment on posts.flagCount**
   - What we know: `posts.flagCount` column exists (line 115 of schema.ts).
   - What's unclear: Should `reportContent` increment `flagCount` on the target post in addition to inserting a `reports` row?
   - Recommendation: Yes — increment `posts.flagCount` (or the review's `flagCount` if we add it) in the same transaction. This enables future automated soft-hiding at a threshold (e.g. `flagCount >= 5 → status: 'hidden'`) without a dashboard. Keep simple: just increment; do not auto-hide in Phase 4 (that is a v2 moderation feature per MODR-V2-01).

3. **Reviews table needs its own flagCount?**
   - What we know: The `posts` table has `flagCount`. Reviews are a separate table.
   - What's unclear: Whether reports targeting `targetType = 'review'` should also increment a counter on the review row.
   - Recommendation: Add `flagCount integer NOT NULL DEFAULT 0` to the `reviews` table. Mirrors the posts pattern. Small cost, avoids a schema migration later.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library (vitest ^4.1.0, @testing-library/react ^16.3.2) |
| Config file | `vitest.config.ts` (exists from Phase 1, no changes needed) |
| Quick run command | `npx vitest run tests/ratings/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RATE-01 | `createReview` action inserts with stars 1–5 | unit | `npx vitest run tests/ratings/create-review.test.ts` | ❌ Wave 0 |
| RATE-01 | Rejects stars outside 1–5 range | unit | `npx vitest run tests/ratings/create-review.test.ts` | ❌ Wave 0 |
| RATE-01 | Blocks duplicate review (unique constraint) | unit | `npx vitest run tests/ratings/create-review.test.ts` | ❌ Wave 0 |
| RATE-02 | Review body is optional (null allowed) | unit | `npx vitest run tests/ratings/create-review.test.ts` | ❌ Wave 0 |
| RATE-02 | Review body max 2000 chars enforced by Zod | unit | `npx vitest run tests/ratings/create-review.test.ts` | ❌ Wave 0 |
| RATE-03 | `reportContent` inserts a reports row | unit | `npx vitest run tests/ratings/report.test.ts` | ❌ Wave 0 |
| RATE-03 | Report button renders on place and event detail pages | component | `npx vitest run tests/ratings/report.test.ts` | ❌ Wave 0 |
| RATE-04 | `ratingSummary` is upserted in same transaction as review | unit | `npx vitest run tests/ratings/create-review.test.ts` | ❌ Wave 0 |
| RATE-04 | `RatingBadge` renders avg and count from summary | component | `npx vitest run tests/ratings/rating-badge.test.tsx` | ❌ Wave 0 |
| RATE-04 | Feed query joins `rating_summary` — fields present on FeedPost | unit | `npx vitest run tests/feed/feed-service.test.ts` | ✅ (extend existing) |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/ratings/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/ratings/create-review.test.ts` — covers RATE-01, RATE-02, RATE-04 (transaction)
- [ ] `tests/ratings/report.test.ts` — covers RATE-03
- [ ] `tests/ratings/rating-badge.test.tsx` — covers RATE-04 display component

*(No new framework install needed — Vitest + RTL already present)*

---

## Sources

### Primary (HIGH confidence)

- Existing codebase: `src/lib/db/schema.ts` — confirmed reports table, contentStatusEnum, soft-delete pattern
- Existing codebase: `src/actions/posts.ts` — confirmed db.transaction pattern, requireAuth usage, Zod v4 `.issues` extraction
- Existing codebase: `src/lib/db/queries/feed.ts` — confirmed leftJoin pattern, FeedPost type shape
- Existing codebase: `src/components/events/RsvpButton.tsx` — confirmed Server Action + useState pattern for interactive buttons
- `.planning/STATE.md` — confirmed all key decisions: Zod v4, Drizzle array syntax, requireAuth returns `user.id`, `onConflictDoUpdate` availability

### Secondary (MEDIUM confidence)

- `.planning/ROADMAP.md` — plan outline (04-01: review model + rating_summary; 04-02: UI; 04-03: feed display) — authoritative roadmap intent
- Prior phase PLAN.md files — established Wave 0 stub pattern with `test.todo()` and zero src imports

### Tertiary (LOW confidence)

- None — all critical claims are verified from the live codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed in package.json
- Schema design: HIGH — directly parallels existing eventRsvps and reports tables in schema.ts
- Architecture: HIGH — transaction pattern verified from posts.ts; join pattern verified from feed.ts
- Pitfalls: HIGH — several derived directly from STATE.md decisions (Zod v4, decimal-as-string, Drizzle array syntax)

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; no fast-moving dependencies)
