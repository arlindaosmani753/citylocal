import { db } from '@/lib/db'
import { posts, profiles, postImages } from '@/lib/db/schema'
import { and, or, eq, isNull, isNotNull, lt, desc, gt, sql } from 'drizzle-orm'

// ── Types ─────────────────────────────────────────────────────────────────────

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

export type FeedCursor = {
  id: string
  createdAt: Date
}

export type MapPin = {
  id: string
  title: string
  lat: string
  lng: string
}

// ── getFeedForCity ─────────────────────────────────────────────────────────────

type FeedOptions = {
  category?: string
  cursor?: FeedCursor
  limit?: number
}

export async function getFeedForCity(
  cityId: string,
  options: FeedOptions
): Promise<{ posts: FeedPost[]; nextCursor: FeedCursor | null }> {
  const { category, cursor, limit: rawLimit = 20 } = options
  const fetchLimit = rawLimit + 1

  // Build where conditions
  const conditions = [
    eq(posts.cityId, cityId),
    isNull(posts.deletedAt),
    eq(posts.status, 'active'),
    // Exclude past events: keep places always; keep events only if endsAt is null OR endsAt > NOW()
    or(
      eq(posts.contentType, 'place'),
      isNull(posts.endsAt),
      gt(posts.endsAt, sql`NOW()`)
    ),
  ]

  // Category filter
  if (category && category !== 'all') {
    if (category === 'event') {
      conditions.push(eq(posts.contentType, 'event'))
    } else {
      conditions.push(eq(posts.category, category as any))
    }
  }

  // Compound cursor (descending order: older rows have smaller createdAt)
  if (cursor) {
    conditions.push(
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
      id:            posts.id,
      title:         posts.title,
      contentType:   posts.contentType,
      category:      posts.category,
      body:          posts.body,
      lat:           posts.lat,
      lng:           posts.lng,
      authorUsername: profiles.username,
      createdAt:     posts.createdAt,
      startsAt:      posts.startsAt,
      endsAt:        posts.endsAt,
      firstImagePath: postImages.storagePath,
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(postImages, and(
      eq(postImages.postId, posts.id),
      eq(postImages.displayOrder, 0)
    ))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(fetchLimit)

  const hasMore = rows.length > rawLimit
  const resultRows = hasMore ? rows.slice(0, rawLimit) : rows

  const nextCursor: FeedCursor | null = hasMore
    ? { id: resultRows[resultRows.length - 1].id, createdAt: resultRows[resultRows.length - 1].createdAt }
    : null

  return {
    posts: resultRows as FeedPost[],
    nextCursor,
  }
}

// ── getPostsForMap ────────────────────────────────────────────────────────────

export async function getPostsForMap(cityId: string): Promise<MapPin[]> {
  const rows = await db
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
        eq(posts.status, 'active'),
        isNull(posts.deletedAt),
        isNotNull(posts.lat),
        isNotNull(posts.lng)
      )
    )
    .limit(200)

  return rows as MapPin[]
}
