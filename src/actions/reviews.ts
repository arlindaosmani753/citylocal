'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { reviews, ratingSummary, reports, posts } from '@/lib/db/schema'
import { requireAuth } from '@/lib/guards'
import { eq, isNull, and, sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type * as schema from '@/lib/db/schema'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>

// ---- Schemas ----

const createReviewSchema = z.object({
  postId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
})

const reportContentSchema = z.object({
  targetType: z.enum(['post', 'review']),
  targetId: z.string().uuid(),
  reason: z.enum(['spam', 'inappropriate', 'fake', 'other']),
})

// ---- Helpers ----

async function recalculateSummary(tx: Tx, postId: string) {
  const [agg] = await tx
    .select({
      avgVal: sql<string>`COALESCE(AVG(stars)::numeric(3,2), 0)`,
      countVal: sql<number>`COUNT(*)::int`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.postId, postId),
        isNull(reviews.deletedAt),
        eq(reviews.status, 'active')
      )
    )

  await tx
    .insert(ratingSummary)
    .values({
      postId,
      avgRating: agg.avgVal,
      reviewCount: agg.countVal,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: ratingSummary.postId,
      set: {
        avgRating: agg.avgVal,
        reviewCount: agg.countVal,
        updatedAt: new Date(),
      },
    })
}

// ---- Exported Server Actions ----

export async function createReview(
  input: unknown
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth()

  const parsed = createReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(reviews).values({
        postId: parsed.data.postId,
        authorId: user.id,
        stars: parsed.data.stars,
        body: parsed.data.body ?? null,
      })
      await recalculateSummary(tx, parsed.data.postId)
    })
    return { success: true as const }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('reviews_post_author_unique')) {
      return { error: 'You have already reviewed this' }
    }
    throw e
  }
}

export async function deleteReview(
  reviewId: string
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth()

  try {
    await db.transaction(async (tx) => {
      // Find the review and verify ownership
      const [review] = await tx
        .select()
        .from(reviews)
        .where(eq(reviews.id, reviewId))
        .limit(1)

      if (!review) {
        throw new Error('REVIEW_NOT_FOUND')
      }

      if (review.authorId !== user.id) {
        throw new Error('REVIEW_NOT_OWNER')
      }

      // Soft-delete
      await tx
        .update(reviews)
        .set({ deletedAt: new Date(), status: 'hidden' })
        .where(eq(reviews.id, reviewId))

      // Recalculate summary
      await recalculateSummary(tx, review.postId)
    })
    return { success: true as const }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'REVIEW_NOT_FOUND') {
      return { error: 'Review not found' }
    }
    if (msg === 'REVIEW_NOT_OWNER') {
      return { error: 'You do not own this review' }
    }
    throw e
  }
}

export async function reportContent(
  input: unknown
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth()

  const parsed = reportContentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { targetType, targetId, reason } = parsed.data

  try {
    await db.transaction(async (tx) => {
      // Check target status
      let targetStatus: string | undefined
      if (targetType === 'post') {
        const [target] = await tx
          .select({ status: posts.status })
          .from(posts)
          .where(eq(posts.id, targetId))
          .limit(1)
        targetStatus = target?.status
      } else {
        const [target] = await tx
          .select({ status: reviews.status })
          .from(reviews)
          .where(eq(reviews.id, targetId))
          .limit(1)
        targetStatus = target?.status
      }

      if (targetStatus !== 'active') {
        throw new Error('CONTENT_NOT_ACTIVE')
      }

      // Insert report
      await tx.insert(reports).values({
        reporterId: user.id,
        targetType,
        targetId,
        reason,
      })

      // Increment flagCount on target
      if (targetType === 'post') {
        await tx
          .update(posts)
          .set({ flagCount: sql`flag_count + 1` })
          .where(eq(posts.id, targetId))
      } else {
        await tx
          .update(reviews)
          .set({ flagCount: sql`flag_count + 1` })
          .where(eq(reviews.id, targetId))
      }
    })
    return { success: true as const }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'CONTENT_NOT_ACTIVE') {
      return { error: 'Content is no longer active' }
    }
    throw e
  }
}
