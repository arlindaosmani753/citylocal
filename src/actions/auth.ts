'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Username must be lowercase letters, numbers, underscores, or hyphens'),
  homeCityId: z.string().uuid().optional(),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
})

const updatePasswordSchema = z
  .object({
    password: z.string().min(8).max(72),
    confirm: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

// ─── Types ────────────────────────────────────────────────────────────────────

type RegisterInput = z.infer<typeof registerSchema>
type SignInInput = z.infer<typeof signInSchema>
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

type FieldErrors<T> = Partial<Record<keyof T, string[]>> & { _form?: string[] }
type ActionError<T> = { error: FieldErrors<T> }
type ActionSuccess = { success: true }

export type RegisterResult = ActionError<RegisterInput> | ActionSuccess | undefined
export type SignInResult = ActionError<SignInInput> | ActionSuccess | undefined
export type ResetPasswordResult = ActionError<ResetPasswordInput> | ActionSuccess | undefined
export type UpdatePasswordResult = ActionError<UpdatePasswordInput> | ActionSuccess | undefined

// ─── registerUser ─────────────────────────────────────────────────────────────

export async function registerUser(_prevState: RegisterResult, formData: FormData): Promise<RegisterResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
    homeCityId: formData.get('homeCityId') as string | null,
  }

  const parsed = registerSchema.safeParse({
    ...raw,
    homeCityId: raw.homeCityId || undefined,
  })

  if (!parsed.success) {
    const fieldErrors: FieldErrors<RegisterInput> = {}
    for (const [key, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key as keyof RegisterInput] = errors
    }
    return { error: fieldErrors }
  }

  const { email, password, username, homeCityId } = parsed.data

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error || !data.user) {
    return {
      error: {
        _form: [error?.message ?? 'Registration failed. Please try again.'],
      },
    }
  }

  // Create profile row with the same UUID as auth.users
  await db.insert(profiles).values({
    id: data.user.id,
    username,
    homeCityId: homeCityId ?? null,
  })

  redirect('/verify-email')
}

// ─── signIn ───────────────────────────────────────────────────────────────────

export async function signIn(_prevState: SignInResult, formData: FormData): Promise<SignInResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = signInSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: FieldErrors<SignInInput> = {}
    for (const [key, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key as keyof SignInInput] = errors
    }
    return { error: fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      error: {
        _form: [error.message],
      },
    }
  }

  redirect('/')
}

// ─── signOut ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── resetPassword ────────────────────────────────────────────────────────────

export async function resetPassword(_prevState: ResetPasswordResult, formData: FormData): Promise<ResetPasswordResult> {
  const raw = {
    email: formData.get('email') as string,
  }

  const parsed = resetPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: FieldErrors<ResetPasswordInput> = {}
    for (const [key, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key as keyof ResetPasswordInput] = errors
    }
    return { error: fieldErrors }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  })

  if (error) {
    return {
      error: {
        _form: [error.message],
      },
    }
  }

  return { success: true }
}

// ─── updatePassword ───────────────────────────────────────────────────────────

export async function updatePassword(formData: FormData): Promise<UpdatePasswordResult> {
  const raw = {
    password: formData.get('password') as string,
    confirm: formData.get('confirm') as string,
  }

  const parsed = updatePasswordSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: FieldErrors<UpdatePasswordInput> = {}
    for (const [key, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key as keyof UpdatePasswordInput] = errors
    }
    return { error: fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return {
      error: {
        _form: [error.message],
      },
    }
  }

  redirect('/login')
}
