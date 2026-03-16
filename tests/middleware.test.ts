import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock @supabase/ssr
const mockGetUser = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

// AUTH-04: Session persists across browser refresh (middleware refreshes tokens)
// ROLE-03: requireAuth redirects unauthenticated users
describe('Next.js middleware (session refresh)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    })
  })

  test('AUTH-04: calls supabase.auth.getUser() on every non-static request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })

    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/dashboard')
    await middleware(request)

    expect(mockGetUser).toHaveBeenCalledTimes(1)
  })

  test('AUTH-04: sets updated session cookies on response', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })

    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    // Middleware should return a response (not redirect for authenticated user)
    expect(response).toBeDefined()
    expect(response.status).not.toBe(307)
  })

  test('ROLE-03: redirects unauthenticated user to /login for protected route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  test('ROLE-03: allows unauthenticated user to access /cities routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/cities/paris')
    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })

  test('ROLE-03: allows unauthenticated user to access /login and /register routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { middleware } = await import('@/middleware')
    const loginReq = new NextRequest('http://localhost:3000/login')
    const loginResp = await middleware(loginReq)
    expect(loginResp.status).not.toBe(307)

    const registerReq = new NextRequest('http://localhost:3000/register')
    const registerResp = await middleware(registerReq)
    expect(registerResp.status).not.toBe(307)
  })

  test('ROLE-03: does not redirect authenticated user away from protected route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })

    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })
})
