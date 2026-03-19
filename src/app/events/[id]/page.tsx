import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/queries/posts'
import { getRatingSummary, getReviewsForPost } from '@/lib/db/queries/ratings'
import { format } from 'date-fns'
import { RsvpButton } from '@/components/events/RsvpButton'
import { RatingBadge } from '@/components/ratings/RatingBadge'
import { StarRating } from '@/components/ratings/StarRating'
import { ReviewForm } from '@/components/ratings/ReviewForm'
import { ReportButton } from '@/components/ratings/ReportButton'

type Props = { params: Promise<{ id: string }> }

export default async function EventPage({ params }: Props) {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) notFound()

  const [summary, reviewList] = await Promise.all([
    getRatingSummary(event.id),
    getReviewsForPost(event.id),
  ])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{event.title}</h1>

      <div className="text-neutral-500 text-sm mb-4 space-y-1">
        {event.startsAt && (
          <p>{format(event.startsAt, 'EEEE, MMMM d, yyyy · h:mm a')}</p>
        )}
        {event.locationName && <p>{event.locationName}</p>}
      </div>

      {event.body && <p className="text-neutral-700 mb-6">{event.body}</p>}

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium">{event.rsvpCount} attending</span>
        <RsvpButton postId={event.id} initialCount={event.rsvpCount} />
        <RatingBadge avgRating={summary.avgRating} reviewCount={summary.reviewCount} />
        <ReportButton targetType="post" targetId={event.id} />
      </div>

      {event.attendees.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Attendees
          </h2>
          <ul className="space-y-1">
            {event.attendees.map(a => (
              <li key={a.userId} className="text-sm">
                {a.username ?? 'Unknown'}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ReviewForm postId={event.id} />

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
