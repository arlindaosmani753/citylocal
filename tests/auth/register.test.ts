import { describe, test } from 'vitest'

// AUTH-01: User can create an account with email and password
// ROLE-01: home_city_id is set during registration
describe('registerUser Server Action', () => {
  test.todo('AUTH-01: returns field errors when email is invalid')
  test.todo('AUTH-01: returns field errors when password is shorter than 8 characters')
  test.todo('AUTH-01: returns field errors when username contains invalid characters')
  test.todo('AUTH-01: returns field errors when username is shorter than 3 characters')
  test.todo('ROLE-01: accepts optional homeCityId UUID and includes it in validated output')
  test.todo('AUTH-01: returns _form error when Supabase signUp fails')
  test.todo('AUTH-01: redirects to /verify-email on success')
})
