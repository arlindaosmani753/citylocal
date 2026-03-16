import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// Mock the db module — we test logic, not DB connection
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
}

// Helper: build a chainable mock for .select().from().leftJoin().where().limit()
function mockSelectResult(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
  mockDb.select.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

// Import after mocking
import ProfilePage from '@/app/profile/[username]/page'

// ROLE-04: Public profile page shows user's contributions and received ratings
describe('Profile page (/profile/[username])', () => {
  test('ROLE-04: renders username in page heading', async () => {
    mockSelectResult([
      {
        id: 'user-uuid-1',
        username: 'alice',
        displayName: 'Alice Smith',
        bio: null,
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        homeCityName: 'Paris',
      },
    ])

    const jsx = await ProfilePage({ params: Promise.resolve({ username: 'alice' }) })
    await act(async () => {
      render(jsx)
    })

    expect(screen.getByRole('heading', { name: /alice smith/i })).toBeTruthy()
  })

  test('ROLE-04: renders home city name when homeCityId is set', async () => {
    mockSelectResult([
      {
        id: 'user-uuid-1',
        username: 'alice',
        displayName: 'Alice Smith',
        bio: null,
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        homeCityName: 'Paris',
      },
    ])

    const jsx = await ProfilePage({ params: Promise.resolve({ username: 'alice' }) })
    await act(async () => {
      render(jsx)
    })

    expect(screen.getByText(/paris/i)).toBeTruthy()
  })

  test('ROLE-04: renders "0 contributions" when user has no posts', async () => {
    mockSelectResult([
      {
        id: 'user-uuid-2',
        username: 'bob',
        displayName: 'Bob Jones',
        bio: null,
        avatarUrl: null,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        homeCityName: null,
      },
    ])

    const jsx = await ProfilePage({ params: Promise.resolve({ username: 'bob' }) })
    await act(async () => {
      render(jsx)
    })

    expect(screen.getByText(/0 contributions/i)).toBeTruthy()
  })

  test('ROLE-04: returns 404 when username does not exist in profiles table', async () => {
    mockSelectResult([])

    await expect(
      ProfilePage({ params: Promise.resolve({ username: 'unknown-user' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })
})
