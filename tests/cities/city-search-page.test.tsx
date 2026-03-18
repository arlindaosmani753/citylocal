import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

// ── CitySearchPage UI ─────────────────────────────────────────────────────────
// Separate file from city-search.test.ts because vi.mock is hoisted globally
// and would conflict with the real DB mock that the query unit tests require.

vi.mock('@/lib/db/queries/cities', () => ({
  searchCitiesByName: vi.fn(),
  getCityBySlug: vi.fn(),
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

import CitySearchPage from '@/app/cities/search/page'

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
