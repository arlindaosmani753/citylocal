import { notFound } from 'next/navigation'
import { getPlaceById } from '@/lib/db/queries/posts'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_LABELS: Record<string, string> = {
  restaurant:         'Restaurant',
  cafe:               'Café',
  bar:                'Bar',
  activity:           'Activity',
  sport:              'Sport',
  tourist_attraction: 'Tourist Attraction',
  shopping:           'Shopping',
  other:              'Other',
}

type Props = { params: Promise<{ id: string }> }

export default async function PlacePage({ params }: Props) {
  const { id } = await params
  const place = await getPlaceById(id)
  if (!place) notFound()

  const supabase = createClient()
  const photoUrls = place.images.map(img =>
    supabase.storage.from('post-images').getPublicUrl(img.storagePath).data.publicUrl
  )

  // Use named label map to preserve accented characters (e.g. Café)
  const categoryLabel = place.category
    ? (CATEGORY_LABELS[place.category] ?? place.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : 'Other'

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{place.title}</h1>
      <span className="inline-block text-sm font-medium bg-neutral-100 text-neutral-700 px-2 py-1 rounded mb-4">
        {categoryLabel}
      </span>
      {place.body && <p className="text-neutral-700 mb-6">{place.body}</p>}
      {photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Photo ${i + 1} of ${place.title}`}
              className="w-full aspect-square object-cover rounded"
            />
          ))}
        </div>
      )}
    </main>
  )
}
