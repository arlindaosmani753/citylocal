'use client'

import { useState } from 'react'
import { rsvpToEvent, cancelRsvp } from '@/actions/rsvp'

type Props = {
  postId: string
  initialCount: number
  initialRsvped?: boolean
}

export function RsvpButton({ postId, initialCount, initialRsvped = false }: Props) {
  const [rsvped, setRsvped] = useState(initialRsvped)
  const [count, setCount]   = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (rsvped) {
      await cancelRsvp(postId)
      setCount(c => c - 1)
      setRsvped(false)
    } else {
      await rsvpToEvent(postId)
      setCount(c => c + 1)
      setRsvped(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-3 py-1 rounded border transition-colors ${
        rsvped
          ? 'bg-black text-white border-black'
          : 'bg-white text-black border-neutral-300 hover:border-black'
      }`}
    >
      {loading ? '...' : rsvped ? "I'm going" : 'RSVP'}
    </button>
  )
}
