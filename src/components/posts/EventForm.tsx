'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/actions/posts'

type Props = { cityId: string }
type GpsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string }

export function EventForm({ cityId }: Props) {
  const router = useRouter()
  const [gps, setGps] = useState<GpsState>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  async function captureGps() {
    setGps({ status: 'loading' })
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
        })
      )
      setGps({ status: 'ready', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
    } catch {
      setGps({ status: 'error', message: 'Could not get your location. Try outdoors.' })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (gps.status !== 'ready') return setServerError('Please capture your GPS location first.')

    const form = e.currentTarget
    const data = new FormData(form)
    const recurrenceValue = data.get('recurrence') as string

    setSubmitting(true)
    setServerError(null)

    const result = await createEvent({
      title:        data.get('title') as string,
      body:         data.get('body') as string,
      cityId,
      lat:          gps.lat,
      lng:          gps.lng,
      accuracy:     gps.accuracy,
      locationName: data.get('locationName') as string,
      startsAt:     data.get('startsAt') as string,
      endsAt:       data.get('endsAt') as string || undefined,
      recurrence:   recurrenceValue === 'weekly' || recurrenceValue === 'monthly'
                      ? recurrenceValue
                      : null,
    })

    setSubmitting(false)

    if ('error' in result) {
      setServerError(result.error)
    } else {
      router.push(`/events/${result.postId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Event name</label>
        <input id="title" name="title" required className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label htmlFor="locationName" className="block text-sm font-medium mb-1">Location name</label>
        <input id="locationName" name="locationName" required className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">Description</label>
        <textarea id="body" name="body" required rows={4} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium mb-1">Starts</label>
          <input id="startsAt" name="startsAt" type="datetime-local" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label htmlFor="endsAt" className="block text-sm font-medium mb-1">Ends (optional)</label>
          <input id="endsAt" name="endsAt" type="datetime-local" className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div>
        <label htmlFor="recurrence" className="block text-sm font-medium mb-1">Repeat</label>
        <select id="recurrence" name="recurrence" className="w-full border rounded px-3 py-2">
          <option value="">No repeat</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Your location</p>
        {gps.status === 'idle' && (
          <button type="button" onClick={captureGps} className="text-sm underline">Capture GPS location</button>
        )}
        {gps.status === 'loading' && <p className="text-sm text-neutral-500">Getting location...</p>}
        {gps.status === 'ready' && (
          <p className="text-sm text-green-700">Location captured ({gps.accuracy.toFixed(0)}m accuracy)</p>
        )}
        {gps.status === 'error' && <p className="text-sm text-red-600">{gps.message}</p>}
      </div>
      {serverError && <p className="text-red-600 text-sm">{serverError}</p>}
      <button
        type="submit"
        disabled={submitting || gps.status !== 'ready'}
        className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {submitting ? 'Posting...' : 'Post Event'}
      </button>
    </form>
  )
}
