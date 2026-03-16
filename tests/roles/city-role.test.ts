import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock the db module — we test logic, not DB connection
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

// We must import after mocking
import { isUserLocalInCity, getUserCityRole } from '@/lib/db/queries/roles'
import { db } from '@/lib/db'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
}

// Helper: build a chainable mock that resolves to `rows`
function mockSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
  mockDb.select.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ROLE-02: isUserLocalInCity returns correct value based on user_city_roles table
describe('isUserLocalInCity', () => {
  test('ROLE-02: returns false when no user_city_roles row exists for (userId, cityId)', async () => {
    mockSelect([])
    const result = await isUserLocalInCity('user-1', 'city-1')
    expect(result).toBe(false)
  })

  test('ROLE-02: returns false when row exists but isLocal is false', async () => {
    mockSelect([{ isLocal: false }])
    const result = await isUserLocalInCity('user-1', 'city-1')
    expect(result).toBe(false)
  })

  test('ROLE-02: returns true when row exists and isLocal is true', async () => {
    mockSelect([{ isLocal: true }])
    const result = await isUserLocalInCity('user-1', 'city-1')
    expect(result).toBe(true)
  })

  test('ROLE-02: returns false when verifiedPostCount is 2 (isLocal still false)', async () => {
    mockSelect([{ isLocal: false }])
    const result = await isUserLocalInCity('user-1', 'city-1')
    expect(result).toBe(false)
  })
})

describe('getUserCityRole', () => {
  test('returns null when no row exists', async () => {
    mockSelect([])
    const result = await getUserCityRole('user-1', 'city-1')
    expect(result).toBeNull()
  })

  test('returns full role record when row exists', async () => {
    const row = { isLocal: true, verifiedPostCount: 3, localSince: new Date('2026-01-01') }
    mockSelect([row])
    const result = await getUserCityRole('user-1', 'city-1')
    expect(result).toEqual(row)
  })
})
