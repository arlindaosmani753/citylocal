import { formatDistanceToNow, format } from 'date-fns'
import type { FeedPost } from '@/lib/db/queries/feed'
import { RatingBadge } from '@/components/ratings/RatingBadge'

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  activity: 'Activity',
  sport: 'Sport',
  tourist_attraction: 'Attraction',
  shopping: 'Shopping',
  other: 'Other',
}

type Props = {
  post: FeedPost
}

export default function FeedCard({ post }: Props) {
  const isEvent = post.contentType === 'event'
  const bodyExcerpt = post.body
    ? post.body.slice(0, 120) + (post.body.length > 120 ? '...' : '')
    : null
  const relativeTime = formatDistanceToNow(post.createdAt, { addSuffix: true })
  const categoryLabel = post.category ? CATEGORY_LABELS[post.category] ?? post.category : null

  return (
    <article>
      <h3>{post.title}</h3>
      <span>{isEvent ? 'Event' : 'Place'}</span>
      {categoryLabel && <span>{categoryLabel}</span>}
      {bodyExcerpt && <p>{bodyExcerpt}</p>}
      {isEvent && post.startsAt && (
        <time dateTime={post.startsAt.toISOString()}>
          {format(post.startsAt, 'PPp')}
        </time>
      )}
      {post.authorUsername && <span>by {post.authorUsername}</span>}
      <time dateTime={post.createdAt.toISOString()}>{relativeTime}</time>
      <RatingBadge avgRating={post.avgRating} reviewCount={post.reviewCount} />
    </article>
  )
}
