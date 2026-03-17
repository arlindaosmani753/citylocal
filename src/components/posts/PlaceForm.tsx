'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUploader } from './PhotoUploader'
import { createPlace } from '@/actions/posts'
import { placeCategoryEnum } from '@/lib/db/schema'

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

type Props = { cityId: string }

type GpsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string }

export function PlaceForm({ cityId }: Props) {
  const router = useRouter()
  const formId = useId()
  const [gps, setGps] = useState<GpsState>({ status: 'idle' })
  const [storagePaths, setStoragePaths] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  // Use a stable postId for photo upload paths before the post is created
  const [draftPostId] = useState(() => crypto.randomUUID())

  async function captureGps() {
    setGps({ status: 'loading' })
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      )
      setGps({
        status: 'ready',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      })
    } catch {
      setGps({ status: 'error', message: 'Could not get your location. Try outdoors.' })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (gps.status !== 'ready') return setServerError('Please capture your GPS location first.')
    if (storagePaths.length === 0) return setServerError('Please upload at least one photo.')

    const form = e.currentTarget
    const data = new FormData(form)

    setSubmitting(true)
    setServerError(null)

    const result = await createPlace({
      title:        data.get('title') as string,
      category:     data.get('category') as any,
      body:         data.get('body') as string,
      cityId,
      lat:          gps.lat,
      lng:          gps.lng,
      accuracy:     gps.accuracy,
      storagePaths,
    })

    setSubmitting(false)

    if ('error' in result) {
      setServerError(result.error)
    } else {
      router.push(`/places/${result.postId}`)
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Place name</label>
        <input id="title" name="title" required className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
        <select id="category" name="category" required className="w-full border rounded px-3 py-2">
          {placeCategoryEnum.enumValues.map(v => (
            <option key={v} value={v}>{CATEGORY_LABELS[v] ?? v}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">Description</label>
        <textarea id="body" name="body" required rows={4} className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Your location</p>
        {gps.status === 'idle' && (
          <button type="button" onClick={captureGps} className="text-sm underline">
            Capture GPS location
          </button>
        )}
        {gps.status === 'loading' && <p className="text-sm text-neutral-500">Getting location...</p>}
        {gps.status === 'ready' && (
          <p className="text-sm text-green-700">
            Location captured ({gps.accuracy.toFixed(0)}m accuracy)
          </p>
        )}
        {gps.status === 'error' && <p className="text-sm text-red-600">{gps.message}</p>}
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Photos (required)</p>
        <PhotoUploader postId={draftPostId} onUploadComplete={setStoragePaths} />
        {storagePaths.length > 0 && (
          <p className="text-sm text-green-700 mt-1">{storagePaths.length} photo(s) ready</p>
        )}
      </div>

      {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

      <button
        type="submit"
        disabled={submitting || gps.status !== 'ready' || storagePaths.length === 0}
        className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {submitting ? 'Posting...' : 'Post Place'}
      </button>
    </form>
  )
}
