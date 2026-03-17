import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'

vi.mock('@/lib/db/queries/posts', () => ({ getPlaceById: vi.fn() }))
vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example.com/${path}` } })),
      })),
    },
  })),
}))

import PlacePage from '@/app/places/[id]/page'
import { getPlaceById } from '@/lib/db/queries/posts'

const mockPlace = {
  id: 'place-1',
  title: 'Le Marais Café',
  body: 'A wonderful café in the Marais district.',
  category: 'cafe',
  lat: '48.8566',
  lng: '2.3522',
  cityId: 'city-paris',
  authorId: 'user-1',
  createdAt: new Date('2026-03-16'),
  images: [
    { storagePath: 'posts/place-1/img1.jpg', displayOrder: 0 },
    { storagePath: 'posts/place-1/img2.jpg', displayOrder: 1 },
  ],
}

describe('Place detail page (/places/[id])', () => {
  test('renders place title', async () => {
    vi.mocked(getPlaceById).mockResolvedValueOnce(mockPlace)
    const page = await PlacePage({ params: Promise.resolve({ id: 'place-1' }) })
    await act(async () => { render(page) })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Le Marais Café')
  })

  test('renders category badge', async () => {
    vi.mocked(getPlaceById).mockResolvedValueOnce(mockPlace)
    const page = await PlacePage({ params: Promise.resolve({ id: 'place-1' }) })
    await act(async () => { render(page) })
    // Use getAllByText because title "Le Marais Café" also contains "café"
    const cafeMentions = screen.getAllByText(/café/i)
    expect(cafeMentions.length).toBeGreaterThanOrEqual(1)
    // The badge (span) must be among the matches
    const badge = cafeMentions.find(el => el.tagName.toLowerCase() === 'span')
    expect(badge).toBeInTheDocument()
  })

  test('renders img elements for each photo', async () => {
    vi.mocked(getPlaceById).mockResolvedValueOnce(mockPlace)
    const page = await PlacePage({ params: Promise.resolve({ id: 'place-1' }) })
    await act(async () => { render(page) })
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
  })

  test('calls notFound() when place does not exist', async () => {
    vi.mocked(getPlaceById).mockResolvedValueOnce(null)
    await expect(
      PlacePage({ params: Promise.resolve({ id: 'nonexistent' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
