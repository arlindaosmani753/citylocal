import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'

vi.mock('@/lib/db/queries/posts', () => ({ getEventById: vi.fn() }))
vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))

import EventPage from '@/app/events/[id]/page'
import { getEventById } from '@/lib/db/queries/posts'

const mockEvent = {
  id:                 'event-1',
  title:              'Marais Community Walk',
  body:               'A guided walk through the historic Marais.',
  locationName:       'Place des Vosges',
  startsAt:           new Date('2026-04-01T10:00:00Z'),
  endsAt:             new Date('2026-04-01T12:00:00Z'),
  recurrenceInterval: null,
  cityId:             'city-paris',
  authorId:           'user-1',
  createdAt:          new Date('2026-03-16'),
  rsvpCount:          2,
  attendees: [
    { userId: 'user-1', username: 'alice' },
    { userId: 'user-2', username: 'bob' },
  ],
}

describe('Event detail page (/events/[id])', () => {
  test('renders event title in h1', async () => {
    vi.mocked(getEventById).mockResolvedValueOnce(mockEvent)
    const page = await EventPage({ params: Promise.resolve({ id: 'event-1' }) })
    await act(async () => { render(page) })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Marais Community Walk')
  })

  test('renders attendee count', async () => {
    vi.mocked(getEventById).mockResolvedValueOnce(mockEvent)
    const page = await EventPage({ params: Promise.resolve({ id: 'event-1' }) })
    await act(async () => { render(page) })
    expect(screen.getByText(/2 attending/)).toBeInTheDocument()
  })

  test('renders attendee usernames', async () => {
    vi.mocked(getEventById).mockResolvedValueOnce(mockEvent)
    const page = await EventPage({ params: Promise.resolve({ id: 'event-1' }) })
    await act(async () => { render(page) })
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('bob')).toBeInTheDocument()
  })

  test('calls notFound() when event does not exist', async () => {
    vi.mocked(getEventById).mockResolvedValueOnce(null)
    await expect(
      EventPage({ params: Promise.resolve({ id: 'nonexistent' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
