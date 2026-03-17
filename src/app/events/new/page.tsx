import { requireLocalInCity } from '@/lib/guards'
import { EventForm } from '@/components/posts/EventForm'

type Props = { searchParams: Promise<{ cityId?: string }> }

export default async function NewEventPage({ searchParams }: Props) {
  const { cityId } = await searchParams
  if (!cityId) return <p>No city specified.</p>

  await requireLocalInCity(cityId)

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Post a Community Event</h1>
      <EventForm cityId={cityId} />
    </main>
  )
}
