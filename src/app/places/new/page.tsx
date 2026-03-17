import { requireLocalInCity } from '@/lib/guards'
import { PlaceForm } from '@/components/posts/PlaceForm'

// Visitors arriving at /places/new must provide ?cityId= in the query
// If absent or user is not local, requireLocalInCity redirects them away
type Props = { searchParams: Promise<{ cityId?: string }> }

export default async function NewPlacePage({ searchParams }: Props) {
  const { cityId } = await searchParams
  if (!cityId) return <p>No city specified.</p>

  // requireLocalInCity throws redirect if not a confirmed local
  await requireLocalInCity(cityId)

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Post a Place</h1>
      <PlaceForm cityId={cityId} />
    </main>
  )
}
