import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">CityLocal</h1>
          <p className="text-sm text-muted-foreground">Community-powered city guide</p>
        </div>
        {children}
      </div>
    </div>
  )
}
