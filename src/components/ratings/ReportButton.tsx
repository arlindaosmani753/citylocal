'use client'

import { useState } from 'react'
import { reportContent } from '@/actions/reviews'

type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'other'

type Props = {
  targetType: 'post' | 'review'
  targetId: string
}

export function ReportButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('spam')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleConfirm() {
    setPending(true)
    setMessage(null)

    const result = await reportContent({ targetType, targetId, reason })

    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Reported' })
      setOpen(false)
    }

    setPending(false)
  }

  if (message?.type === 'success') {
    return <span className="text-xs text-neutral-400">Reported</span>
  }

  return (
    <div className="inline-block">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Report
        </button>
      ) : (
        <div className="inline-flex items-center gap-2">
          <select
            value={reason}
            onChange={e => setReason(e.target.value as ReportReason)}
            className="text-xs border border-neutral-300 rounded px-1 py-0.5"
            disabled={pending}
          >
            <option value="spam">Spam</option>
            <option value="inappropriate">Inappropriate</option>
            <option value="fake">Fake</option>
            <option value="other">Other</option>
          </select>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="text-xs px-2 py-0.5 bg-red-600 text-white rounded disabled:opacity-40"
          >
            {pending ? '...' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            Cancel
          </button>
          {message?.type === 'error' && (
            <span className="text-xs text-red-600">{message.text}</span>
          )}
        </div>
      )}
    </div>
  )
}
