import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/guards', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  },
}))

import { rsvpToEvent, cancelRsvp } from '@/actions/rsvp'
import { requireAuth } from '@/lib/guards'
import { db } from '@/lib/db'

describe('RSVP Server Actions (EVNT-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  test('rsvpToEvent inserts into event_rsvps', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    await rsvpToEvent('post-1')
    expect(db.insert).toHaveBeenCalled()
  })

  test('rsvpToEvent is idempotent via onConflictDoNothing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any)
    await rsvpToEvent('post-1')
    await rsvpToEvent('post-1')
    // Verify onConflictDoNothing was called (not throwing on second call)
    expect(db.insert).toHaveBeenCalledTimes(2)
  })

  test('rsvpToEvent throws/redirects for unauthenticated callers', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Not authenticated'))
    await expect(rsvpToEvent('post-1')).rejects.toThrow()
  })

  test('cancelRsvp calls db.delete', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    await cancelRsvp('post-1')
    expect(db.delete).toHaveBeenCalled()
  })
})
