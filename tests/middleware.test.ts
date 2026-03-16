import { describe, test } from 'vitest'

// AUTH-04: Session persists across browser refresh (middleware refreshes tokens)
// ROLE-03: requireAuth redirects unauthenticated users
describe('Next.js middleware (session refresh)', () => {
  test.todo('AUTH-04: calls supabase.auth.getUser() on every non-static request')
  test.todo('AUTH-04: sets updated session cookies on response')
  test.todo('ROLE-03: redirects unauthenticated user to /login for protected route')
  test.todo('ROLE-03: allows unauthenticated user to access /cities routes')
  test.todo('ROLE-03: allows unauthenticated user to access /login and /register routes')
  test.todo('ROLE-03: does not redirect authenticated user away from protected route')
})
