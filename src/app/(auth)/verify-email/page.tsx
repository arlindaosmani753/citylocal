import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Verify your email — CityLocal',
}

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center gap-6 text-center py-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent you an email with a verification link. Click the link in your email to activate
          your account.
        </p>
      </div>

      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground w-full">
        <p>Didn&apos;t receive an email? Check your spam folder, or make sure you entered the right
        address.</p>
      </div>

      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </div>
  )
}
