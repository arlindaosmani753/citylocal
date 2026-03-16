import { describe, test } from 'vitest'

// AUTH-03: Password reset request and update
describe('resetPassword Server Action', () => {
  test.todo('AUTH-03: calls resetPasswordForEmail with correct redirectTo URL')
  test.todo('AUTH-03: returns error when email is not valid format')
  test.todo('AUTH-03: returns success indicator when Supabase call succeeds')
})

describe('updatePassword Server Action', () => {
  test.todo('AUTH-03: calls supabase.auth.updateUser with new password')
  test.todo('AUTH-03: returns error when password is shorter than 8 characters')
  test.todo('AUTH-03: redirects to login on success')
})
