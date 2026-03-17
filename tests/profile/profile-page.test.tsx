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

// Helper: build a chainable mock for profile query (.select().from().leftJoin().where().limit())
function mockProfileQuery(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
  mockDb.select.mockReturnValue(chain)
  return chain
}

// Helper: build a mock that handles two sequential select calls —
// first for profile query, second for listContributionsForUser
function mockProfileAndContributions(profileRows: unknown[], contributionRows: unknown[] = []) {
  let callCount = 0
  mockDb.select.mockImplementation(() => {
    callCount++
    const chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      // First call resolves with profileRows, second with contributionRows
      limit: vi.fn().mockResolvedValue(callCount === 1 ? profileRows : contributionRows),
    }
    // Re-set up chaining since each call returns a new chain object
    chain.from.mockReturnValue(chain)
    chain.leftJoin.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    chain.orderBy.mockReturnValue(chain)
    return chain
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// Import after mocking
import ProfilePage from '@/app/profile/[username]/page'

// ROLE-04: Public profile page shows user's contributions and received ratings
describe('Profile page (/profile/[username])', () => {
  test('ROLE-04: renders username in page heading', async () => {
    mockProfileAndContributions(
      [
        {
          id: 'user-uuid-1',
          username: 'alice',
          displayName: 'Alice Smith',
          bio: null,
          avatarUrl: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          homeCityName: 'Paris',
        },
      ],
      []
    )

    const jsx = await ProfilePage({ params: Promise.resolve({ username: 'alice' }) })
    await act(async () => {
      render(jsx)
    })

    expect(screen.getByRole('heading', { name: /alice smith/i })).toBeTruthy()
  })

  test('ROLE-04: renders home city name when homeCityId is set', async () => {
    mockProfileAndContributions(
      [
        {
          id: 'user-uuid-1',
          username: 'alice',
          displayName: 'Alice Smith',
          bio: null,
          avatarUrl: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          homeCityName: 'Paris',
        },
      ],
      []
    )

    const jsx = await ProfilePage({ params: Promise.resolve({ username: 'alice' }) })
    await act(async () => {
      render(jsx)
    })

    expect(screen.getByText(/paris/i)).toBeTruthy()
  })

  test('ROLE-04: renders "No contributions yet" when user has no posts', async () => {
    mockProfileAndContributions(
      [
        {
          id: 'user-uuid-2',
          username: 'bob',
          displayName: 'Bob Jones',
          bio: null,
          avatarUrl: null,
          createdAt: new Date('2026-02-01T00:00:00Z'),
          homeCityName: null,
        },
      ],
      []
    )

    const jsx = await ProfilePage({ params: Promise.resolve({ username: 'bob' }) })
    await act(async () => {
      render(jsx)
    })

    expect(screen.getByText(/no contributions yet/i)).toBeTruthy()
  })

  test('ROLE-04: returns 404 when username does not exist in profiles table', async () => {
    mockProfileAndContributions([])

    await expect(
      ProfilePage({ params: Promise.resolve({ username: 'unknown-user' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })
})
