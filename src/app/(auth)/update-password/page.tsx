'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/actions/auth'

type UpdateState =
  | {
      error?: {
        password?: string[]
        confirm?: string[]
        _form?: string[]
      }
    }
  | undefined

function UpdatePasswordForm() {
  const [state, action, isPending] = useActionState<UpdateState, FormData>(
    updatePassword as unknown as (state: UpdateState, formData: FormData) => Promise<UpdateState>,
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
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
        {state?.error?.confirm && (
          <p className="text-sm text-destructive">{state.error.confirm[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update password'}
      </Button>
    </form>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Set new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account</p>
      </div>
      <UpdatePasswordForm />
    </div>
  )
}
