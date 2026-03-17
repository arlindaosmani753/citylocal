import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/guards', () => ({ requireLocalInCity: vi.fn() }))
vi.mock('@/lib/db/queries/gps', () => ({ verifyGpsProximity: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn() }) }),
    transaction: vi.fn(),
  },
}))

import { createPlace } from '@/actions/posts'
import { requireLocalInCity } from '@/lib/guards'
import { verifyGpsProximity } from '@/lib/db/queries/gps'
import { db } from '@/lib/db'

const validInput = {
  title: 'Le Marais Café',
  category: 'cafe' as const,
  body: 'A wonderful café in the Marais district.',
  cityId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  lat: 48.8566,
  lng: 2.3522,
  accuracy: 10,
  storagePaths: ['posts/post-123/user-456-1234567890.jpg'],
}

describe('createPlace Server Action', () => {
  beforeEach(() => vi.clearAllMocks())

  test('rejects unauthenticated callers with redirect', async () => {
    vi.mocked(requireLocalInCity).mockRejectedValueOnce(new Error('Not authenticated'))
    await expect(createPlace(validInput)).rejects.toThrow()
  })

  test('returns error when title is missing', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createPlace({ ...validInput, title: '' })
    expect(result).toHaveProperty('error')
  })

  test('returns error when GPS verification fails', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: false, reason: 'GPS accuracy insufficient' })
    const result = await createPlace(validInput)
    expect(result).toHaveProperty('error')
    expect((result as any).error).toMatch(/accuracy|location/i)
  })

  test('inserts posts row and returns success with postId', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: true })
    const mockPostId = 'new-post-uuid'
    vi.mocked(db.transaction).mockImplementationOnce(async (fn: any) => fn({
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: mockPostId }]),
        }),
      }),
    }))
    const result = await createPlace(validInput)
    expect(result).toEqual({ success: true, postId: mockPostId })
  })

  test('rejects category not in placeCategoryEnum', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createPlace({ ...validInput, category: 'invalid_cat' as any })
    expect(result).toHaveProperty('error')
  })

  test('accepts all 8 valid place categories', async () => {
    const categories = ['restaurant', 'cafe', 'bar', 'activity', 'sport', 'tourist_attraction', 'shopping', 'other'] as const
    for (const category of categories) {
      vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
      vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: true })
      vi.mocked(db.transaction).mockImplementationOnce(async (fn: any) => fn({
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'post-uuid' }]),
          }),
        }),
      }))
      const result = await createPlace({ ...validInput, category })
      expect(result).not.toHaveProperty('error')
    }
  })

  test('inserts post_images rows for each storagePath', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
    vi.mocked(verifyGpsProximity).mockResolvedValueOnce({ verified: true })
    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'post-uuid' }]),
      }),
    })
    vi.mocked(db.transaction).mockImplementationOnce(async (fn: any) => fn({ insert: insertMock }))
    await createPlace({ ...validInput, storagePaths: ['path/a.jpg', 'path/b.jpg'] })
    // insert called at least twice: once for posts, once (or more) for post_images
    expect(insertMock).toHaveBeenCalledTimes(2)
  })

  test('returns error when body is too short', async () => {
    vi.mocked(requireLocalInCity).mockResolvedValueOnce({ id: 'user-1' } as any)
    const result = await createPlace({ ...validInput, body: 'Short' })
    expect(result).toHaveProperty('error')
  })
})
