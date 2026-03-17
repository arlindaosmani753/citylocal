import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/guards', () => ({ requireLocalInCity: vi.fn() }))
vi.mock('@/lib/db/queries/gps', () => ({ verifyGpsProximity: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn() }) }),
    transaction: vi.fn(),
  },
}))

import { createEvent } from '@/actions/posts'
import { requireLocalInCity } from '@/lib/guards'
import { verifyGpsProximity } from '@/lib/db/queries/gps'
import { db } from '@/lib/db'

const validEvent = {
  title:       'Marais Community Walk',
  body:        'A guided walk through the historic Marais neighborhood.',
  cityId:      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  lat:         48.8566,
  lng:         2.3522,
  accuracy:    10,
  locationName:'Place des Vosges',
  startsAt:    new Date('2026-04-01T10:00:00Z').toISOString(),
  endsAt:      new Date('2026-04-01T12:00:00Z').toISOString(),
  recurrence:  null as null | 'weekly' | 'monthly',
}

describe('createEvent Server Action', () => {
  beforeEach(() => vi.clearAllMocks())

  test('rejects non-locals', async () => {
    vi.mocked(requireLocalInCity).mockRejectedValueOnce(new Error('Not local'))
    await expect(createEvent(validEvent)).rejects.toThrow()
  })

  test('returns error when startsAt is missing', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'u1' } as any)
    const result = await createEvent({ ...validEvent, startsAt: '' })
    expect(result).toHaveProperty('error')
  })

  test('calls verifyGpsProximity and returns error when GPS fails', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'u1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: false, reason: 'GPS accuracy insufficient' })
    const result = await createEvent(validEvent)
    expect(result).toHaveProperty('error')
    expect(verifyGpsProximity).toHaveBeenCalled()
  })

  test('inserts event row and returns success with postId', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'u1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: true })
    vi.mocked(db.transaction).mockImplementationOnce(async (fn: any) => fn({
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'event-post-uuid' }]),
        }),
      }),
    }))
    const result = await createEvent(validEvent)
    expect(result).toEqual({ success: true, postId: 'event-post-uuid' })
  })

  test('stores recurrenceInterval=1 week for weekly recurrence', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'u1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: true })
    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation((vals: any) => {
        // Capture the values passed to insert for assertion
        ;(insertMock as any)._lastValues = vals
        return { returning: vi.fn().mockResolvedValue([{ id: 'evt-1' }]) }
      }),
    })
    vi.mocked(db.transaction).mockImplementationOnce(async (fn: any) => fn({ insert: insertMock }))
    await createEvent({ ...validEvent, recurrence: 'weekly' })
    const vals = (insertMock as any)._lastValues
    expect(vals?.recurrenceInterval).toBe('1 week')
  })

  test('stores null recurrenceInterval for non-recurring event', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'u1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: true })
    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation((vals: any) => {
        ;(insertMock as any)._lastValues = vals
        return { returning: vi.fn().mockResolvedValue([{ id: 'evt-2' }]) }
      }),
    })
    vi.mocked(db.transaction).mockImplementationOnce(async (fn: any) => fn({ insert: insertMock }))
    await createEvent({ ...validEvent, recurrence: null })
    const vals = (insertMock as any)._lastValues
    expect(vals?.recurrenceInterval).toBeNull()
  })
})
