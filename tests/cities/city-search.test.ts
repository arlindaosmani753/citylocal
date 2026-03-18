import { describe, test, expect, vi, beforeEach } from 'vitest'
import React from 'react'

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

// ── CitySearchPage UI ─────────────────────────────────────────────────────────
import { render, screen } from '@testing-library/react'
import CitySearchPage from '@/app/cities/search/page'

vi.mock('@/lib/db/queries/cities', () => ({
  searchCitiesByName: vi.fn(),
  getCityBySlug: vi.fn(),
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

describe('CitySearchPage', () => {
  test('renders search form when no query provided', async () => {
    const page = await CitySearchPage({ searchParams: Promise.resolve({}) })
    render(page)
    expect(screen.getByRole('form', { name: /search for a city/i })).toBeInTheDocument()
  })

  test('renders city links when query matches results', async () => {
    const { searchCitiesByName } = await import('@/lib/db/queries/cities')
    vi.mocked(searchCitiesByName).mockResolvedValue([
      { id: 'city-1', name: 'Paris', slug: 'paris-france', country: 'France' },
    ])
    const page = await CitySearchPage({ searchParams: Promise.resolve({ q: 'paris' }) })
    render(page)
    const link = screen.getByRole('link', { name: /paris/i })
    expect(link).toHaveAttribute('href', '/cities/paris-france')
  })

  test('renders no-match message when query returns empty array', async () => {
    const { searchCitiesByName } = await import('@/lib/db/queries/cities')
    vi.mocked(searchCitiesByName).mockResolvedValue([])
    const page = await CitySearchPage({ searchParams: Promise.resolve({ q: 'nowhere' }) })
    render(page)
    expect(screen.getByText(/no cities found/i)).toBeInTheDocument()
  })

  test('passes initialQuery to form input when query is present', async () => {
    const { searchCitiesByName } = await import('@/lib/db/queries/cities')
    vi.mocked(searchCitiesByName).mockResolvedValue([])
    const page = await CitySearchPage({ searchParams: Promise.resolve({ q: 'rome' }) })
    render(page)
    expect(screen.getByRole('textbox')).toHaveValue('rome')
  })
})
