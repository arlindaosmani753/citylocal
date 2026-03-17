'use server'

import { db } from '@/lib/db'
import { eventRsvps } from '@/lib/db/schema'
import { requireAuth } from '@/lib/guards'
import { and, eq } from 'drizzle-orm'

export async function rsvpToEvent(postId: string): Promise<void> {
  const user = await requireAuth()
  // ON CONFLICT DO NOTHING — uniqueIndex(userId, postId) makes this idempotent and race-safe
  await db.insert(eventRsvps).values({ userId: user.id, postId }).onConflictDoNothing()
}

export async function cancelRsvp(postId: string): Promise<void> {
  const user = await requireAuth()
  await db.delete(eventRsvps).where(
    and(
      eq(eventRsvps.userId, user.id),
      eq(eventRsvps.postId, postId)
    )
  )
}
