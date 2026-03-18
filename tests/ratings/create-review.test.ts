import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/guards', () => ({ requireAuth: vi.fn() }))

// Shared mock tx object — supports all chaining patterns used by actions
const mockTx = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  values: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  limit: vi.fn(),
}

// Setup chaining: insert().values().onConflictDoUpdate()
mockTx.insert.mockReturnValue(mockTx)
mockTx.values.mockReturnValue(mockTx)
mockTx.onConflictDoUpdate.mockResolvedValue(undefined)
// select()...from()...where() — returns agg result
mockTx.select.mockReturnValue(mockTx)
mockTx.from.mockReturnValue(mockTx)
mockTx.where.mockResolvedValue([{ avgVal: '4.00', countVal: 1 }])
// update().set().where()
mockTx.update.mockReturnValue(mockTx)
mockTx.set.mockReturnValue(mockTx)
mockTx.limit.mockResolvedValue([])

vi.mock('@/lib/db', () => ({
  db: {
    transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}))

import { createReview, deleteReview } from '@/actions/reviews'
import { requireAuth } from '@/lib/guards'
import { db } from '@/lib/db'

const VALID_POST_ID = '123e4567-e89b-12d3-a456-426614174000'
const VALID_REVIEW_ID = '223e4567-e89b-12d3-a456-426614174001'

const makeReview = (overrides = {}) => ({
  id: VALID_REVIEW_ID,
  authorId: 'user-1',
  postId: VALID_POST_ID,
  stars: 4,
  body: null,
  status: 'active' as const,
  flagCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

describe('createReview (RATE-01 / RATE-02 / RATE-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.insert.mockReturnValue(mockTx)
    mockTx.values.mockReturnValue(mockTx)
    mockTx.onConflictDoUpdate.mockResolvedValue(undefined)
    mockTx.select.mockReturnValue(mockTx)
    mockTx.from.mockReturnValue(mockTx)
    mockTx.where.mockResolvedValue([{ avgVal: '4.00', countVal: 1 }])
    mockTx.update.mockReturnValue(mockTx)
    mockTx.set.mockReturnValue(mockTx)
    ;(vi.mocked(db.transaction).mockImplementation as any)((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
  })

  test('createReview inserts a review row with stars 1', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 1 })
    expect(result).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(mockTx.insert).toHaveBeenCalled()
  })

  test('createReview inserts a review row with stars 5', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 5 })
    expect(result).toEqual({ success: true })
  })

  test('createReview rejects stars = 0 (below minimum)', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 0 })
    expect(result).toHaveProperty('error')
  })

  test('createReview rejects stars = 6 (above maximum)', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 6 })
    expect(result).toHaveProperty('error')
  })

  test('createReview blocks duplicate review from same user on same post', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    vi.mocked(db.transaction).mockRejectedValueOnce(new Error('reviews_post_author_unique'))
    const result = await createReview({ postId: VALID_POST_ID, stars: 4 })
    expect(result).toEqual({ error: 'You have already reviewed this' })
  })

  test('createReview returns error for unauthenticated caller', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('NEXT_REDIRECT'))
    await expect(createReview({ postId: VALID_POST_ID, stars: 4 })).rejects.toThrow()
  })

  test('createReview accepts null body (review without text)', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 3 })
    expect(result).toEqual({ success: true })
  })

  test('createReview accepts body up to 2000 chars', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 3, body: 'x'.repeat(2000) })
    expect(result).toEqual({ success: true })
  })

  test('createReview rejects body longer than 2000 chars', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 3, body: 'x'.repeat(2001) })
    expect(result).toHaveProperty('error')
  })

  test('createReview upserts rating_summary with recalculated avg and count', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    await createReview({ postId: VALID_POST_ID, stars: 4 })
    // insert called at least twice: once for review, once for ratingSummary upsert
    expect(mockTx.insert).toHaveBeenCalledTimes(2)
    expect(mockTx.onConflictDoUpdate).toHaveBeenCalled()
  })

  test('second review from different user updates avgRating in rating_summary', async () => {
    mockTx.where.mockResolvedValue([{ avgVal: '4.50', countVal: 2 }])
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-2' } as any)
    const result = await createReview({ postId: VALID_POST_ID, stars: 5 })
    expect(result).toEqual({ success: true })
    expect(mockTx.onConflictDoUpdate).toHaveBeenCalled()
  })

  test('deleteReview recalculates rating_summary after removal', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    // Setup tx mock: where returns mockTx for .limit() chain; recalculate uses where that resolves agg
    ;(vi.mocked(db.transaction).mockImplementationOnce as any)((cb: (tx: typeof mockTx) => Promise<unknown>) => {
      let whereCallCount = 0
      mockTx.where.mockImplementation(() => {
        whereCallCount++
        if (whereCallCount <= 1) return mockTx // for .limit() chain in deleteReview
        return Promise.resolve([{ avgVal: '0.00', countVal: 0 }]) // recalculate
      })
      mockTx.limit.mockResolvedValue([makeReview()])
      mockTx.set.mockReturnValue(mockTx)
      return cb(mockTx)
    })
    const result = await deleteReview(VALID_REVIEW_ID)
    expect(result).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
  })
})

describe('deleteReview (RATE-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.insert.mockReturnValue(mockTx)
    mockTx.values.mockReturnValue(mockTx)
    mockTx.onConflictDoUpdate.mockResolvedValue(undefined)
    mockTx.select.mockReturnValue(mockTx)
    mockTx.from.mockReturnValue(mockTx)
    // where must return mockTx so .limit() can be chained; then recalculateSummary uses where too
    mockTx.where.mockReturnValue(mockTx)
    // First .limit() call returns the review; subsequent .where() in recalculate returns agg
    mockTx.limit.mockResolvedValue([makeReview()])
    mockTx.update.mockReturnValue(mockTx)
    mockTx.set.mockReturnValue(mockTx)
    // After limit resolves, recalculateSummary calls select/from/where again — where resolves with agg
    // We set where to resolve with agg on second call pattern via limit second call
    ;(vi.mocked(db.transaction).mockImplementation as any)((cb: (tx: typeof mockTx) => Promise<unknown>) => {
      // Reset where to return mockTx (for chaining), limit returns review on first call, agg on second
      let limitCallCount = 0
      mockTx.limit.mockImplementation(() => {
        limitCallCount++
        if (limitCallCount === 1) {
          return Promise.resolve([makeReview()])
        }
        return Promise.resolve([{ avgVal: '0.00', countVal: 0 }])
      })
      // where used in recalculateSummary resolves agg directly (no .limit)
      let whereCallCount = 0
      mockTx.where.mockImplementation(() => {
        whereCallCount++
        if (whereCallCount <= 1) {
          return mockTx // for .limit() chain
        }
        return Promise.resolve([{ avgVal: '0.00', countVal: 0 }]) // recalculate
      })
      return cb(mockTx)
    })
  })

  test('soft-deletes review and recalculates rating_summary', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await deleteReview(VALID_REVIEW_ID)
    expect(result).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(mockTx.update).toHaveBeenCalled()
  })

  test('returns error if review not found', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'user-1' } as any)
    ;(vi.mocked(db.transaction).mockImplementationOnce as any)((cb: (tx: typeof mockTx) => Promise<unknown>) => {
      mockTx.select.mockReturnValue(mockTx)
      mockTx.from.mockReturnValue(mockTx)
      mockTx.where.mockReturnValue(mockTx)
      mockTx.limit.mockResolvedValue([])
      return cb(mockTx)
    })
    const result = await deleteReview(VALID_REVIEW_ID)
    expect(result).toHaveProperty('error')
  })

  test('returns error if user does not own the review', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ id: 'other-user' } as any)
    ;(vi.mocked(db.transaction).mockImplementationOnce as any)((cb: (tx: typeof mockTx) => Promise<unknown>) => {
      mockTx.select.mockReturnValue(mockTx)
      mockTx.from.mockReturnValue(mockTx)
      mockTx.where.mockReturnValue(mockTx)
      mockTx.limit.mockResolvedValue([makeReview({ authorId: 'user-1' })])
      return cb(mockTx)
    })
    const result = await deleteReview(VALID_REVIEW_ID)
    expect(result).toHaveProperty('error')
  })
})
