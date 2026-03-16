import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock @supabase/ssr
const mockVerifyOtp = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

// AUTH-02: Email verification callback exchanges token_hash for session
// AUTH-03: Password reset callback redirects to /update-password
describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue({
      auth: {
        verifyOtp: mockVerifyOtp,
      },
    })
  })

  test('AUTH-02: redirects to / when token_hash type=email and verifyOtp succeeds', async () => {
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null })

    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=abc123&type=email'
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/')
  })

  test('AUTH-02: redirects to /auth/error when token_hash is missing', async () => {
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?type=email'
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/auth/error')
  })

  test('AUTH-02: redirects to /auth/error when verifyOtp returns error', async () => {
    mockVerifyOtp.mockResolvedValue({ data: {}, error: { message: 'Invalid token' } })

    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=bad_token&type=email'
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/auth/error')
  })

  test('AUTH-03: redirects to /update-password when token_hash type=recovery and verifyOtp succeeds', async () => {
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null })

    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=abc123&type=recovery'
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/update-password')
  })

  test('AUTH-03: redirects to next param path when next is provided and type=email', async () => {
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null })

    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=abc123&type=email&next=/profile'
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/profile')
  })
})
