import Link from 'next/link'
import { searchCitiesByName } from '@/lib/db/queries/cities'
import CitySearchForm from '@/components/city/CitySearchForm'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function CitySearchPage({ searchParams }: Props) {
  const { q } = await searchParams

  if (!q) {
    return (
      <main>
        <h1>Find a city</h1>
        <CitySearchForm />
      </main>
    )
  }

  const results = await searchCitiesByName(q)

  return (
    <main>
      <h1>Find a city</h1>
      <CitySearchForm initialQuery={q} />
      {results.length === 0 ? (
        <p>No cities found for &ldquo;{q}&rdquo;</p>
      ) : (
        <ul>
          {results.map((city) => (
            <li key={city.id}>
              <Link href={`/cities/${city.slug}`}>
                {city.name}, {city.country}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
