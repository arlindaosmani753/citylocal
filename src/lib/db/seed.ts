// src/lib/db/seed.ts
// Run: npm run db:seed
// Requires DATABASE_URL in environment (.env.local)

import { db } from './index'
import { cities } from './schema'

const PARIS: typeof cities.$inferInsert = {
  slug: 'paris-france',
  name: 'Paris',
  country: 'France',
  lat: '48.8566000',
  lng: '2.3522000',
  radiusKm: '25.00',
  timezone: 'Europe/Paris',
}

async function seed() {
  console.log('Seeding cities...')

  await db.insert(cities).values(PARIS).onConflictDoNothing({ target: cities.slug })

  console.log('Seeded: Paris, France (slug: paris-france)')
  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
