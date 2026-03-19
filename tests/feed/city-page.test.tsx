import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'

vi.mock('@/lib/db/queries/feed', () => ({
  getFeedForCity: vi.fn(),
  getPostsForMap: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/db/queries/cities', () => ({
  getCityBySlug: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

import CityPage from '@/app/cities/[slug]/page'
import { getFeedForCity } from '@/lib/db/queries/feed'
import { getCityBySlug } from '@/lib/db/queries/cities'

const mockCity = {
  id: 'city-uuid-paris',
  slug: 'paris-france',
  name: 'Paris',
  country: 'France',
  lat: '48.8566',
  lng: '2.3522',
  createdAt: new Date('2026-01-01'),
}

const mockPosts = [
  {
    id: 'post-1',
    title: 'Best Croissants in Paris',
    contentType: 'place' as const,
    category: 'cafe',
    body: 'A lovely spot near the Seine.',
    lat: '48.8566',
    lng: '2.3522',
    authorUsername: 'alice',
    createdAt: new Date('2026-03-10'),
    startsAt: null,
    endsAt: null,
    firstImagePath: null,
    avgRating: null,
    reviewCount: null,
  },
  {
    id: 'post-2',
    title: 'Jazz Night at Caveau',
    contentType: 'event' as const,
    category: null,
    body: 'Great live jazz every Friday.',
    lat: null,
    lng: null,
    authorUsername: 'bob',
    createdAt: new Date('2026-03-09'),
    startsAt: new Date('2026-04-01T20:00:00Z'),
    endsAt: new Date('2026-04-01T23:00:00Z'),
    firstImagePath: null,
    avgRating: null,
    reviewCount: null,
  },
]

describe('CityPage', () => {
  test('renders city name as heading', async () => {
    vi.mocked(getCityBySlug).mockResolvedValueOnce(mockCity)
    vi.mocked(getFeedForCity).mockResolvedValueOnce({ posts: [], nextCursor: null })
    const page = await CityPage({
      params: Promise.resolve({ slug: 'paris-france' }),
      searchParams: Promise.resolve({}),
    })
    await act(async () => { render(page) })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Paris')
  })

  test('renders post titles from feed in the page', async () => {
    vi.mocked(getCityBySlug).mockResolvedValueOnce(mockCity)
    vi.mocked(getFeedForCity).mockResolvedValueOnce({ posts: mockPosts, nextCursor: null })
    const page = await CityPage({
      params: Promise.resolve({ slug: 'paris-france' }),
      searchParams: Promise.resolve({}),
    })
    await act(async () => { render(page) })
    expect(screen.getByText('Best Croissants in Paris')).toBeInTheDocument()
    expect(screen.getByText('Jazz Night at Caveau')).toBeInTheDocument()
  })

  test('shows not found for unknown city slug', async () => {
    vi.mocked(getCityBySlug).mockResolvedValueOnce(null)
    await expect(
      CityPage({
        params: Promise.resolve({ slug: 'nowhere-land' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
