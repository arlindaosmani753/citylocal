import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
const mockSignUp = vi.fn()
const mockCreateClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

// Mock DB for profile insertion
const mockInsert = vi.fn()
const mockValues = vi.fn()
vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
  },
}))

// Mock next/navigation redirect
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// AUTH-01: User can create an account with email and password
// ROLE-01: home_city_id is set during registration
describe('registerUser Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({
      auth: {
        signUp: mockSignUp,
      },
    })
    mockInsert.mockReturnValue({ values: mockValues })
    mockValues.mockResolvedValue([])
    // Default: redirect throws (Next.js redirect throws internally)
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
  })

  test('AUTH-01: returns field errors when email is invalid', async () => {
    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'not-an-email')
    formData.set('password', 'password123')
    formData.set('username', 'testuser')

    const result = await registerUser(formData)

    expect(result && 'error' in result && result.error?.email).toBeDefined()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  test('AUTH-01: returns field errors when password is shorter than 8 characters', async () => {
    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')
    formData.set('password', 'short')
    formData.set('username', 'testuser')

    const result = await registerUser(formData)

    expect(result && 'error' in result && result.error?.password).toBeDefined()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  test('AUTH-01: returns field errors when username contains invalid characters', async () => {
    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')
    formData.set('password', 'password123')
    formData.set('username', 'Invalid_User!')

    const result = await registerUser(formData)

    expect(result && 'error' in result && result.error?.username).toBeDefined()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  test('AUTH-01: returns field errors when username is shorter than 3 characters', async () => {
    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')
    formData.set('password', 'password123')
    formData.set('username', 'ab')

    const result = await registerUser(formData)

    expect(result && 'error' in result && result.error?.username).toBeDefined()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  test('ROLE-01: accepts optional homeCityId UUID and includes it in validated output', async () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000'
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-uuid-123' } },
      error: null,
    })

    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')
    formData.set('password', 'password123')
    formData.set('username', 'testuser')
    formData.set('homeCityId', validUUID)

    try {
      await registerUser(formData)
    } catch (e) {
      // redirect throws
    }

    expect(mockSignUp).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  test('AUTH-01: returns _form error when Supabase signUp fails', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    })

    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')
    formData.set('password', 'password123')
    formData.set('username', 'testuser')

    const result = await registerUser(formData)

    expect(result && 'error' in result && result.error?._form).toBeDefined()
    expect(result && 'error' in result && result.error?._form?.[0]).toContain('Email already registered')
  })

  test('AUTH-01: redirects to /verify-email on success', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-uuid-123' } },
      error: null,
    })

    const { registerUser } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')
    formData.set('password', 'password123')
    formData.set('username', 'testuser')

    let redirected = false
    try {
      await registerUser(formData)
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('/verify-email')) {
        redirected = true
      }
    }

    expect(redirected).toBe(true)
  })
})
