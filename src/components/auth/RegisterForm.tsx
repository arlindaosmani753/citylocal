'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerUser } from '@/actions/auth'

type City = {
  id: string
  name: string
  slug: string
}

type RegisterState = {
  error?: {
    email?: string[]
    password?: string[]
    username?: string[]
    homeCityId?: string[]
    _form?: string[]
  }
} | undefined

type Props = {
  cities: City[]
}

export function RegisterForm({ cities }: Props) {
  const [state, action, isPending] = useActionState<RegisterState, FormData>(
    registerUser as (state: RegisterState, formData: FormData) => Promise<RegisterState>,
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
          autoComplete="new-password"
          required
        />
        {state?.error?.password && (
          <p className="text-sm text-destructive">{state.error.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="lowercase_only"
          autoComplete="username"
          required
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, underscores, and hyphens only.
        </p>
        {state?.error?.username && (
          <p className="text-sm text-destructive">{state.error.username[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="homeCityId">Home city (optional)</Label>
        <select
          id="homeCityId"
          name="homeCityId"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue=""
        >
          <option value="">Select your home city...</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {state?.error?.homeCityId && (
          <p className="text-sm text-destructive">{state.error.homeCityId[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>

      <div className="flex justify-center text-sm text-muted-foreground">
        <span>
          Already have an account?{' '}
          <Link href="/login" className="hover:text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </span>
      </div>
    </form>
  )
}
