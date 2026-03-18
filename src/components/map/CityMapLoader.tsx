import dynamic from 'next/dynamic'
import { getPostsForMap } from '@/lib/db/queries/feed'

const CityMap = dynamic(() => import('./CityMap'), {
  loading: () => <div style={{ height: 400 }}>Loading map...</div>,
  ssr: false,
})

type Props = {
  cityId: string
}

export default async function CityMapLoader({ cityId }: Props) {
  const places = await getPostsForMap(cityId)
  return <CityMap places={places} />
}
