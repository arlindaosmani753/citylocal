'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/actions/auth'

type ResetState =
  | { success: true }
  | {
      error?: {
        email?: string[]
        _form?: string[]
      }
    }
  | undefined

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState<ResetState, FormData>(
    resetPassword as unknown as (state: ResetState, formData: FormData) => Promise<ResetState>,
    undefined
  )

  if (state && 'success' in state && state.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Check your inbox — we sent a password reset link to your email address.
        </div>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    )
  }

  const errorState = state as Exclude<ResetState, { success: true }>

  return (
    <form action={action} className="flex flex-col gap-4">
      {errorState?.error?._form && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorState.error._form[0]}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        {errorState?.error?.email && (
          <p className="text-sm text-destructive">{errorState.error.email[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send reset link'}
      </Button>

      <div className="flex justify-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
