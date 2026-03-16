import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isUserLocalInCity } from '@/lib/db/queries/roles'

/**
 * Call at the top of any Server Component or Server Action that requires authentication.
 * Uses getUser() (not getSession()) to validate JWT against Supabase servers.
 * Redirects to /login if user is null.
 *
 * Usage in Server Component:
 *   const user = await requireAuth()
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
}

/**
 * Call in Server Actions that require local status in a specific city.
 * requireAuth() is called first — user is guaranteed non-null.
 * Returns the user if they are a local in cityId, redirects to / otherwise.
 *
 * ROLE-03: Any authenticated user can rate/review (use requireAuth only).
 * ROLE-02: Local can post places/events (use requireLocalInCity).
 */
export async function requireLocalInCity(cityId: string) {
  const user = await requireAuth()
  const isLocal = await isUserLocalInCity(user.id, cityId)

  if (!isLocal) {
    // Not a local in this city — redirect to city page
    redirect('/')
  }

  return user
}
