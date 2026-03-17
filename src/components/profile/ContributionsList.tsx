// ContributionsList stays synchronous — parent profile page fetches via listContributionsForUser
// and passes results as a prop. This avoids the async RSC / react-dom/client incompatibility
// established in Phase 1 (STATE.md decision).

import type { ContributionSummary } from '@/lib/db/queries/posts'
import { format } from 'date-fns'
import Link from 'next/link'

type Props = { posts: ContributionSummary[] }

export function ContributionsList({ posts }: Props) {
  if (posts.length === 0) {
    return <p className="text-neutral-500 text-sm">No contributions yet.</p>
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        Contributions ({posts.length})
      </h2>
      <ul className="space-y-2">
        {posts.map(post => (
          <li key={post.id}>
            <Link
              href={post.contentType === 'place' ? `/places/${post.id}` : `/events/${post.id}`}
              className="flex items-center justify-between text-sm hover:underline"
            >
              <span>{post.title}</span>
              <span className="text-neutral-400 ml-4 shrink-0">
                {format(post.createdAt, 'MMM d, yyyy')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
