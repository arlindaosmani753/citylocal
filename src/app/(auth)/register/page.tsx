import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { cities } from '@/lib/db/schema'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Create account — CityLocal',
}

export default async function RegisterPage() {
  // Fetch available cities for the home city dropdown
  let cityList: { id: string; name: string; slug: string }[] = []
  try {
    cityList = await db.select({ id: cities.id, name: cities.name, slug: cities.slug }).from(cities)
  } catch {
    // DB unavailable at build time — show empty list
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">Join CityLocal and share local knowledge</p>
      </div>
      <RegisterForm cities={cityList} />
    </div>
  )
}
