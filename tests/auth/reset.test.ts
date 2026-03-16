import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()
const mockCreateClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

// Mock next/navigation redirect
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// AUTH-03: Password reset request and update
describe('resetPassword Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        updateUser: mockUpdateUser,
      },
    })
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
  })

  test('AUTH-03: calls resetPasswordForEmail with correct redirectTo URL', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

    const { resetPassword } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')

    await resetPassword(formData)

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/callback'),
      })
    )
  })

  test('AUTH-03: returns error when email is not valid format', async () => {
    const { resetPassword } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'not-an-email')

    const result = await resetPassword(formData)

    expect(result?.error).toBeDefined()
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  test('AUTH-03: returns success indicator when Supabase call succeeds', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

    const { resetPassword } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('email', 'user@example.com')

    const result = await resetPassword(formData)

    expect(result?.success).toBe(true)
  })
})

describe('updatePassword Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({
      auth: {
        updateUser: mockUpdateUser,
      },
    })
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
  })

  test('AUTH-03: calls supabase.auth.updateUser with new password', async () => {
    mockUpdateUser.mockResolvedValue({ data: {}, error: null })

    const { updatePassword } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('password', 'newpassword123')
    formData.set('confirm', 'newpassword123')

    try {
      await updatePassword(formData)
    } catch (e) {
      // redirect throws
    }

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
  })

  test('AUTH-03: returns error when password is shorter than 8 characters', async () => {
    const { updatePassword } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('password', 'short')
    formData.set('confirm', 'short')

    const result = await updatePassword(formData)

    expect(result?.error).toBeDefined()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  test('AUTH-03: redirects to login on success', async () => {
    mockUpdateUser.mockResolvedValue({ data: {}, error: null })

    const { updatePassword } = await import('@/actions/auth')
    const formData = new FormData()
    formData.set('password', 'newpassword123')
    formData.set('confirm', 'newpassword123')

    let redirectedToLogin = false
    try {
      await updatePassword(formData)
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('/login')) {
        redirectedToLogin = true
      }
    }

    expect(redirectedToLogin).toBe(true)
  })
})
