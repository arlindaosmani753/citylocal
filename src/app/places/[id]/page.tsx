import { notFound } from 'next/navigation'
import { getPlaceById } from '@/lib/db/queries/posts'
import { getRatingSummary, getReviewsForPost } from '@/lib/db/queries/ratings'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { RatingBadge } from '@/components/ratings/RatingBadge'
import { StarRating } from '@/components/ratings/StarRating'
import { ReviewForm } from '@/components/ratings/ReviewForm'
import { ReportButton } from '@/components/ratings/ReportButton'

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

  const categoryLabel = place.category
    ? (CATEGORY_LABELS[place.category] ?? place.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : 'Other'

  const [summary, reviewList] = await Promise.all([
    getRatingSummary(place.id),
    getReviewsForPost(place.id),
  ])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{place.title}</h1>
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-block text-sm font-medium bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
          {categoryLabel}
        </span>
        <RatingBadge avgRating={summary.avgRating} reviewCount={summary.reviewCount} />
        <ReportButton targetType="post" targetId={place.id} />
      </div>

      {place.body && <p className="text-neutral-700 mb-6">{place.body}</p>}

      {photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-6">
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

      <ReviewForm postId={place.id} />

      {reviewList.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          <ul className="space-y-4">
            {reviewList.map(review => (
              <li key={review.id} className="border-b border-neutral-100 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.stars} />
                    <span className="text-sm font-medium">
                      {review.authorUsername ?? 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <time className="text-xs text-neutral-400">
                      {format(review.createdAt, 'MMM d, yyyy')}
                    </time>
                    <ReportButton targetType="review" targetId={review.id} />
                  </div>
                </div>
                {review.body && (
                  <p className="text-sm text-neutral-700 mt-1">{review.body}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
