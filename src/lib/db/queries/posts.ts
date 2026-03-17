import { db } from '@/lib/db'
import { posts, postImages, eventRsvps, profiles } from '@/lib/db/schema'
import { eq, and, isNull, or, gt, desc, sql, count } from 'drizzle-orm'

export type PlaceWithImages = {
  id: string
  title: string
  body: string | null
  category: string | null
  lat: string | null
  lng: string | null
  cityId: string
  authorId: string
  createdAt: Date
  images: Array<{ storagePath: string; displayOrder: number }>
}

export async function getPlaceById(id: string): Promise<PlaceWithImages | null> {
  const rows = await db
    .select({
      id:           posts.id,
      title:        posts.title,
      body:         posts.body,
      category:     posts.category,
      lat:          posts.lat,
      lng:          posts.lng,
      cityId:       posts.cityId,
      authorId:     posts.authorId,
      createdAt:    posts.createdAt,
      storagePath:  postImages.storagePath,
      displayOrder: postImages.displayOrder,
    })
    .from(posts)
    .leftJoin(postImages, eq(postImages.postId, posts.id))
    .where(
      and(
        eq(posts.id, id),
        eq(posts.contentType, 'place'),
        isNull(posts.deletedAt)
      )
    )

  if (rows.length === 0) return null

  const first = rows[0]
  return {
    id:        first.id,
    title:     first.title,
    body:      first.body,
    category:  first.category,
    lat:       first.lat,
    lng:       first.lng,
    cityId:    first.cityId,
    authorId:  first.authorId,
    createdAt: first.createdAt,
    images: rows
      .filter(r => r.storagePath !== null)
      .map(r => ({ storagePath: r.storagePath!, displayOrder: r.displayOrder! }))
      .sort((a, b) => a.displayOrder - b.displayOrder),
  }
}

// ── EVNT-02: Active events query ─────────────────────────────────────────────

export type ActiveEvent = {
  id: string
  title: string
  body: string | null
  locationName: string | null
  startsAt: Date | null
  endsAt: Date | null
  recurrenceInterval: string | null
  cityId: string
  authorId: string
  createdAt: Date
}

export async function getActiveEventsForCity(cityId: string): Promise<ActiveEvent[]> {
  return db
    .select({
      id:                 posts.id,
      title:              posts.title,
      body:               posts.body,
      locationName:       posts.locationName,
      startsAt:           posts.startsAt,
      endsAt:             posts.endsAt,
      recurrenceInterval: posts.recurrenceInterval,
      cityId:             posts.cityId,
      authorId:           posts.authorId,
      createdAt:          posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.cityId, cityId),
        eq(posts.contentType, 'event'),
        isNull(posts.deletedAt),
        eq(posts.status, 'active'),
        // EVNT-02: exclude events whose end time has passed
        or(
          isNull(posts.endsAt),
          gt(posts.endsAt, sql`NOW()`)
        )
      )
    )
    .orderBy(desc(posts.startsAt))
    .limit(50)
}

// ── EVNT-05: Event detail with attendee count and list ───────────────────────

export type EventWithAttendees = {
  id: string
  title: string
  body: string | null
  locationName: string | null
  startsAt: Date | null
  endsAt: Date | null
  recurrenceInterval: string | null
  cityId: string
  authorId: string
  createdAt: Date
  rsvpCount: number
  attendees: Array<{ userId: string; username: string | null }>
}

export async function getEventById(id: string): Promise<EventWithAttendees | null> {
  const eventRows = await db
    .select({
      id:                 posts.id,
      title:              posts.title,
      body:               posts.body,
      locationName:       posts.locationName,
      startsAt:           posts.startsAt,
      endsAt:             posts.endsAt,
      recurrenceInterval: posts.recurrenceInterval,
      cityId:             posts.cityId,
      authorId:           posts.authorId,
      createdAt:          posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.id, id),
        eq(posts.contentType, 'event'),
        isNull(posts.deletedAt)
      )
    )
    .limit(1)

  if (eventRows.length === 0) return null
  const event = eventRows[0]

  const attendeeRows = await db
    .select({
      userId:   eventRsvps.userId,
      username: profiles.username,
    })
    .from(eventRsvps)
    .leftJoin(profiles, eq(profiles.id, eventRsvps.userId))
    .where(eq(eventRsvps.postId, id))

  return {
    ...event,
    rsvpCount: attendeeRows.length,
    attendees: attendeeRows,
  }
}

// ── EVNT-04: Recurrence occurrence helper ────────────────────────────────────
// Pure function — no DB call. Computes next future occurrence from a stored interval.

type RecurringEventData = {
  startsAt: Date
  recurrenceInterval: string | null  // '1 week' | '1 month' | null
  recurrenceEndsAt: Date | null
}

export function getNextOccurrence(event: RecurringEventData): Date | null {
  if (!event.recurrenceInterval) return null

  const isWeekly  = event.recurrenceInterval === '1 week'
  const isMonthly = event.recurrenceInterval === '1 month'
  if (!isWeekly && !isMonthly) return null

  const now = Date.now()
  let occurrence = new Date(event.startsAt)

  // Advance until we find the next future occurrence (max 1200 iterations ≈ 100 years of weeks)
  for (let i = 0; i < 1200; i++) {
    if (occurrence.getTime() > now) {
      // Check recurrenceEndsAt — if this occurrence is past the series end, return null
      if (event.recurrenceEndsAt && occurrence > event.recurrenceEndsAt) return null
      return occurrence
    }
    // Advance by one interval
    if (isWeekly) {
      occurrence = new Date(occurrence.getTime() + 7 * 24 * 3_600_000)
    } else {
      // Monthly: increment month, preserve day
      const next = new Date(occurrence)
      next.setMonth(next.getMonth() + 1)
      occurrence = next
    }
  }
  return null
}

// ── Profile: ContributionsList data ──────────────────────────────────────────

export type ContributionSummary = {
  id: string
  title: string
  contentType: string
  createdAt: Date
}

export async function listContributionsForUser(userId: string): Promise<ContributionSummary[]> {
  return db
    .select({
      id:          posts.id,
      title:       posts.title,
      contentType: posts.contentType,
      createdAt:   posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, userId),
        isNull(posts.deletedAt),
        eq(posts.status, 'active')
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(20)
}
