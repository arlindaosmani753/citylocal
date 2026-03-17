'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { posts, postImages, placeCategoryEnum } from '@/lib/db/schema'
import { requireLocalInCity } from '@/lib/guards'
import { verifyGpsProximity } from '@/lib/db/queries/gps'
import { sql } from 'drizzle-orm'

const placeCategoryValues = placeCategoryEnum.enumValues

const createPlaceSchema = z.object({
  title:        z.string().min(2).max(120),
  category:     z.enum(placeCategoryValues),
  body:         z.string().min(10).max(2000),
  cityId:       z.string().uuid(),
  lat:          z.number(),
  lng:          z.number(),
  accuracy:     z.number(),
  storagePaths: z.array(z.string()).min(1),
})

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>

export async function createPlace(
  input: CreatePlaceInput
): Promise<{ success: true; postId: string } | { error: string }> {
  // 1. Auth + local guard (throws redirect if not local)
  const user = await requireLocalInCity(input.cityId)

  // 2. Zod validation
  const parsed = createPlaceSchema.safeParse(input)
  if (!parsed.success) {
    // Zod v4 uses .issues instead of .errors
    return { error: parsed.error.issues?.[0]?.message ?? 'Invalid input' }
  }

  // 3. GPS proximity verification
  // For new place creation, user declares they are AT the place — same lat/lng for both
  const gps = await verifyGpsProximity(
    parsed.data.lat, parsed.data.lng, parsed.data.accuracy,
    parsed.data.lat, parsed.data.lng
  )
  if (!gps.verified) {
    return { error: gps.reason ?? 'Location verification failed' }
  }

  // 4. Transactional insert: posts row + post_images rows
  const postId = await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(posts)
      .values({
        cityId:      parsed.data.cityId,
        authorId:    user.id,
        contentType: 'place',
        title:       parsed.data.title,
        body:        parsed.data.body,
        category:    parsed.data.category,
        lat:         String(parsed.data.lat),
        lng:         String(parsed.data.lng),
        location:    sql`ST_SetSRID(ST_MakePoint(${parsed.data.lng}, ${parsed.data.lat}), 4326)::geography`,
        status:      'active',
      })
      .returning({ id: posts.id })

    if (!post) throw new Error('Failed to insert post')

    await tx.insert(postImages).values(
      parsed.data.storagePaths.map((storagePath, i) => ({
        postId:       post.id,
        storagePath,
        displayOrder: i,
      }))
    )

    return post.id
  })

  return { success: true, postId }
}
