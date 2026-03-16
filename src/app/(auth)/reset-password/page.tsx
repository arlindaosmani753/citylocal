import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset password — CityLocal',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
