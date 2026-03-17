import { db } from '@/lib/db'
import { posts, postImages } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

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
