'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { createReview } from '@/actions/reviews'

type Props = { postId: string }

export function ReviewForm({ postId }: Props) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (stars === 0 || pending) return

    setPending(true)
    setMessage(null)

    const result = await createReview({ postId, stars, body: body || undefined })

    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Review submitted!' })
      setStars(0)
      setBody('')
    }

    setPending(false)
  }

  const displayStars = hovered || stars

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Leave a Review</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-1" role="group" aria-label="Star rating">
          {Array.from({ length: 5 }, (_, i) => {
            const starValue = i + 1
            return (
              <button
                key={i}
                type="button"
                aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                onClick={() => setStars(starValue)}
                onMouseEnter={() => setHovered(starValue)}
                onMouseLeave={() => setHovered(0)}
                className="p-0.5"
              >
                <Star
                  size={24}
                  className={
                    starValue <= displayStars
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-neutral-300'
                  }
                />
              </button>
            )
          })}
        </div>

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Share your experience (optional)"
          rows={3}
          className="w-full border border-neutral-300 rounded px-3 py-2 text-sm resize-y"
        />

        <button
          type="submit"
          disabled={stars === 0 || pending}
          className="px-4 py-2 text-sm font-medium bg-black text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Submitting...' : 'Submit Review'}
        </button>

        {message && (
          <p
            className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
          >
            {message.text}
          </p>
        )}
      </form>
    </section>
  )
}
