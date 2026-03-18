import { db } from '@/lib/db'
import { cities } from '@/lib/db/schema'
import { eq, ilike } from 'drizzle-orm'

export async function getCityBySlug(slug: string) {
  const rows = await db
    .select()
    .from(cities)
    .where(eq(cities.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function searchCitiesByName(query: string) {
  return db
    .select({
      id:      cities.id,
      name:    cities.name,
      slug:    cities.slug,
      country: cities.country,
    })
    .from(cities)
    .where(ilike(cities.name, `%${query}%`))
    .limit(10)
}
