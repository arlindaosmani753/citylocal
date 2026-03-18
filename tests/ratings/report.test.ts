import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/guards', () => ({ requireAuth: vi.fn() }))

// Mock tx object for transactional operations
const mockTx = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  values: vi.fn(),
  limit: vi.fn(),
  onConflictDoUpdate: vi.fn(),
}

mockTx.insert.mockReturnValue(mockTx)
mockTx.values.mockResolvedValue(undefined)
mockTx.select.mockReturnValue(mockTx)
mockTx.from.mockReturnValue(mockTx)
mockTx.where.mockReturnValue(mockTx)
mockTx.update.mockReturnValue(mockTx)
mockTx.set.mockReturnValue(mockTx)
mockTx.limit.mockResolvedValue([{ id: 'post-1', status: 'active', flagCount: 0 }])

vi.mock('@/lib/db', () => ({
  db: {
    transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 'post-1', status: 'active', flagCount: 0 }]),
  },
}))

import { reportContent } from '@/actions/reviews'
import { requireAuth } from '@/lib/guards'
import { db } from '@/lib/db'

const VALID_POST_ID = '123e4567-e89b-12d3-a456-426614174000'
const VALID_REVIEW_ID = '223e4567-e89b-12d3-a456-426614174001'

describe('reportContent (RATE-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.insert.mockReturnValue(mockTx)
    mockTx.values.mockResolvedValue(undefined)
    mockTx.select.mockReturnValue(mockTx)
    mockTx.from.mockReturnValue(mockTx)
    mockTx.where.mockReturnValue(mockTx)
    mockTx.update.mockReturnValue(mockTx)
    mockTx.set.mockReturnValue(mockTx)
    mockTx.limit.mockResolvedValue([{ id: VALID_POST_ID, status: 'active', flagCount: 0 }])
    ;(vi.mocked(db.transaction).mockImplementation as any)((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
  })

  test('reportContent inserts a row into the reports table', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await reportContent({
      targetType: 'post',
      targetId: VALID_POST_ID,
      reason: 'spam',
    })
    expect(result).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(mockTx.insert).toHaveBeenCalled()
  })

  test('reportContent returns error for unauthenticated caller', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('NEXT_REDIRECT'))
    await expect(
      reportContent({ targetType: 'post', targetId: VALID_POST_ID, reason: 'spam' })
    ).rejects.toThrow()
  })

  test('reportContent increments flagCount on the target post', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    await reportContent({ targetType: 'post', targetId: VALID_POST_ID, reason: 'spam' })
    expect(mockTx.update).toHaveBeenCalled()
    expect(mockTx.set).toHaveBeenCalled()
  })

  test('reportContent increments flagCount on the target review', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    mockTx.limit.mockResolvedValue([{ id: VALID_REVIEW_ID, status: 'active', flagCount: 0 }])
    const result = await reportContent({
      targetType: 'review',
      targetId: VALID_REVIEW_ID,
      reason: 'inappropriate',
    })
    expect(result).toEqual({ success: true })
    expect(mockTx.update).toHaveBeenCalled()
  })

  test('reportContent returns early if target status is not active', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    mockTx.limit.mockResolvedValue([{ id: VALID_POST_ID, status: 'hidden', flagCount: 2 }])
    const result = await reportContent({
      targetType: 'post',
      targetId: VALID_POST_ID,
      reason: 'fake',
    })
    expect(result).toEqual({ error: 'Content is no longer active' })
    expect(mockTx.insert).not.toHaveBeenCalled()
  })

  test('reportContent validates targetType (rejects invalid)', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await reportContent({
      targetType: 'event' as any,
      targetId: VALID_POST_ID,
      reason: 'spam',
    })
    expect(result).toHaveProperty('error')
  })

  test('reportContent validates reason (rejects invalid)', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await reportContent({
      targetType: 'post',
      targetId: VALID_POST_ID,
      reason: 'bad_reason' as any,
    })
    expect(result).toHaveProperty('error')
  })
})
