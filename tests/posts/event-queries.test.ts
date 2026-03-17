import { describe, test, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => {
  const mockDb = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn().mockResolvedValue([]),
  }
  mockDb.select.mockReturnValue(mockDb)
  mockDb.from.mockReturnValue(mockDb)
  mockDb.where.mockReturnValue(mockDb)
  mockDb.orderBy.mockReturnValue(mockDb)
  return { db: mockDb }
})

import { getActiveEventsForCity } from '@/lib/db/queries/posts'
import { db } from '@/lib/db'

describe('Active events query (EVNT-02)', () => {
  test('calls db.select and returns results', async () => {
    const mockEvents = [{ id: 'e1', title: 'Future Event', endsAt: new Date(Date.now() + 3_600_000) }]
    // @ts-expect-error - mock type
    vi.mocked(db.select)().from().where().orderBy().limit.mockResolvedValueOnce(mockEvents)
    const result = await getActiveEventsForCity('city-paris')
    expect(result).toEqual(mockEvents)
    expect(db.select).toHaveBeenCalled()
  })

  test('getActiveEventsForCity accepts a cityId parameter', async () => {
    const result = await getActiveEventsForCity('city-paris')
    expect(Array.isArray(result)).toBe(true)
    expect(db.select).toHaveBeenCalled()
  })
})
