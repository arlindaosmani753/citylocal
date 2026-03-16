'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/actions/auth'

type LoginState = {
  error?: {
    email?: string[]
    password?: string[]
    _form?: string[]
  }
} | undefined

export function LoginForm() {
  const [state, action, isPending] = useActionState<LoginState, FormData>(
    signIn as unknown as (state: LoginState, formData: FormData) => Promise<LoginState>,
    undefined
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error?._form && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error._form[0]}
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
        {state?.error?.email && (
          <p className="text-sm text-destructive">{state.error.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state?.error?.password && (
          <p className="text-sm text-destructive">{state.error.password[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <Link href="/reset-password" className="hover:text-foreground underline underline-offset-4">
          Forgot your password?
        </Link>
        <span>
          No account?{' '}
          <Link href="/register" className="hover:text-foreground underline underline-offset-4">
            Create one
          </Link>
        </span>
      </div>
    </form>
  )
}
