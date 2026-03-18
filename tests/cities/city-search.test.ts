import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

import { getCityBySlug, searchCitiesByName } from '@/lib/db/queries/cities'
import { db } from '@/lib/db'

// Chainable mock builder for db.select().from().where().limit()
function makeSelectChain(resolvedValue: unknown[]) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'where', 'limit']
  methods.forEach((m, i) => {
    chain[m] = i === methods.length - 1
      ? vi.fn().mockResolvedValue(resolvedValue)
      : vi.fn().mockReturnValue(chain)
  })
  return chain
}

const parisRow = {
  id: 'city-uuid-1',
  slug: 'paris-france',
  name: 'Paris',
  country: 'France',
  lat: '48.8566000',
  lng: '2.3522000',
}

describe('searchCitiesByName', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns cities matching partial name (case-insensitive)', async () => {
    const chain = makeSelectChain([parisRow])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await searchCitiesByName('paris')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Paris')
    expect(result[0].slug).toBe('paris-france')
  })

  test('returns empty array when no cities match', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await searchCitiesByName('zzznomatch')
    expect(result).toEqual([])
  })

  test('limits results to 10', async () => {
    const tenCities = Array.from({ length: 10 }, (_, i) => ({
      id: `city-${i}`,
      name: `City ${i}`,
      slug: `city-${i}`,
      country: 'Country',
    }))
    const chain = makeSelectChain(tenCities)
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await searchCitiesByName('city')
    expect(result).toHaveLength(10)
  })
})

describe('getCityBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns city for a valid slug', async () => {
    const chain = makeSelectChain([parisRow])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getCityBySlug('paris-france')
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('paris-france')
    expect(result?.name).toBe('Paris')
  })

  test('returns null for an unknown slug', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getCityBySlug('unknown-city')
    expect(result).toBeNull()
  })
})
