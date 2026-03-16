import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | null
  const next = searchParams.get('next') ?? '/'

  // If token_hash is missing, redirect to error page
  if (!token_hash) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* ignore in Server Components */
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({
    type: type ?? 'email',
    token_hash,
  })

  if (error) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  // Recovery type goes to /update-password
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/update-password`)
  }

  // Email verification goes to `next` param (default `/`)
  return NextResponse.redirect(`${origin}${next}`)
}
