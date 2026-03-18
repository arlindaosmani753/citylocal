import { db } from '@/lib/db'
import { reviews, ratingSummary, profiles } from '@/lib/db/schema'
import { eq, isNull, and, desc } from 'drizzle-orm'

export type ReviewRow = {
  id: string
  authorId: string
  authorUsername: string | null
  stars: number
  body: string | null
  createdAt: Date
}

export type RatingSummary = {
  avgRating: string | null
  reviewCount: number | null
}

export async function getReviewsForPost(postId: string): Promise<ReviewRow[]> {
  return db
    .select({
      id: reviews.id,
      authorId: reviews.authorId,
      authorUsername: profiles.username,
      stars: reviews.stars,
      body: reviews.body,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .leftJoin(profiles, eq(profiles.id, reviews.authorId))
    .where(
      and(
        eq(reviews.postId, postId),
        isNull(reviews.deletedAt),
        eq(reviews.status, 'active')
      )
    )
    .orderBy(desc(reviews.createdAt))
}

export async function getRatingSummary(postId: string): Promise<RatingSummary> {
  const rows = await db
    .select({
      avgRating: ratingSummary.avgRating,
      reviewCount: ratingSummary.reviewCount,
    })
    .from(ratingSummary)
    .where(eq(ratingSummary.postId, postId))
    .limit(1)

  return rows[0] ?? { avgRating: null, reviewCount: null }
}
