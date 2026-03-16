import { describe, test } from 'vitest'

// AUTH-02: Email verification callback exchanges token_hash for session
// AUTH-03: Password reset callback redirects to /update-password
describe('GET /auth/callback', () => {
  test.todo('AUTH-02: redirects to / when token_hash type=email and verifyOtp succeeds')
  test.todo('AUTH-02: redirects to /auth/error when token_hash is missing')
  test.todo('AUTH-02: redirects to /auth/error when verifyOtp returns error')
  test.todo('AUTH-03: redirects to /update-password when token_hash type=recovery and verifyOtp succeeds')
  test.todo('AUTH-03: redirects to next param path when next is provided and type=email')
})
