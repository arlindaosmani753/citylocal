import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock requireAuth to return a known userId
vi.mock('@/lib/guards', () => ({
  requireAuth: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { getSignedUploadUrl } from '@/actions/storage'
import { requireAuth } from '@/lib/guards'
import { createClient } from '@/lib/supabase/server'

const mockUserId = 'user-uuid-1234'
const mockPostId = 'post-uuid-5678'

describe('getSignedUploadUrl Server Action (PLAC-03)', () => {
  const mockStorage = {
    from: vi.fn().mockReturnThis(),
    createSignedUploadUrl: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // requireAuth returns a Supabase User object — user.id is the identifier
    vi.mocked(requireAuth).mockResolvedValue({ id: mockUserId } as any)
    vi.mocked(createClient).mockResolvedValue({ storage: mockStorage } as any)
    mockStorage.from.mockReturnValue(mockStorage)
  })

  test('returns signedUrl, path, and token for authenticated user', async () => {
    mockStorage.createSignedUploadUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://storage.example.com/signed', token: 'tok_abc' },
      error: null,
    })
    const result = await getSignedUploadUrl('photo.jpg', mockPostId)
    expect(result.signedUrl).toBe('https://storage.example.com/signed')
    expect(result.token).toBe('tok_abc')
    expect(result.path).toBeDefined()
  })

  test('path includes postId and userId segments', async () => {
    mockStorage.createSignedUploadUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://example.com/url', token: 'tok' },
      error: null,
    })
    const result = await getSignedUploadUrl('image.png', mockPostId)
    expect(result.path).toContain(mockPostId)
    expect(result.path).toContain(mockUserId)
    expect(result.path).toMatch(/^posts\//)
  })

  test('throws when Supabase storage returns error', async () => {
    mockStorage.createSignedUploadUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'bucket not found' },
    })
    await expect(getSignedUploadUrl('photo.jpg', mockPostId)).rejects.toThrow('Failed to create upload URL')
  })

  test('rejects unauthenticated callers', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Not authenticated'))
    await expect(getSignedUploadUrl('photo.jpg', mockPostId)).rejects.toThrow()
  })
})
