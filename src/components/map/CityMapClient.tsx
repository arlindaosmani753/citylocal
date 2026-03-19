'use client'

import dynamic from 'next/dynamic'
import type { MapPin } from '@/lib/db/queries/feed'

const CityMap = dynamic(() => import('./CityMap'), {
  loading: () => <div style={{ height: 400 }}>Loading map...</div>,
  ssr: false,
})

type Props = {
  places: MapPin[]
}

export default function CityMapClient({ places }: Props) {
  return <CityMap places={places} />
}
