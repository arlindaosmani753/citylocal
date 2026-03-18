import Link from 'next/link'
import type { FeedPost, FeedCursor } from '@/lib/db/queries/feed'
import FeedCard from './FeedCard'

type Props = {
  posts: FeedPost[]
  nextCursor: FeedCursor | null
  citySlug: string
  activeCategory?: string
}

function buildNextPageHref(
  citySlug: string,
  nextCursor: FeedCursor,
  activeCategory?: string
): string {
  const params = new URLSearchParams()
  params.set('cursor', nextCursor.id)
  params.set('cursorAt', nextCursor.createdAt.toISOString())
  if (activeCategory && activeCategory !== 'all') {
    params.set('category', activeCategory)
  }
  return `/cities/${citySlug}?${params.toString()}`
}

export default function FeedList({ posts, nextCursor, citySlug, activeCategory }: Props) {
  if (posts.length === 0) {
    return <p>No posts found for this city yet.</p>
  }

  return (
    <div>
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
      {nextCursor && (
        <Link href={buildNextPageHref(citySlug, nextCursor, activeCategory)}>
          Load more
        </Link>
      )}
    </div>
  )
}
