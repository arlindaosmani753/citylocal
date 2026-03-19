import { getPostsForMap } from '@/lib/db/queries/feed'
import CityMapClient from './CityMapClient'

type Props = {
  cityId: string
}

export default async function CityMapLoader({ cityId }: Props) {
  const places = await getPostsForMap(cityId)
  return <CityMapClient places={places} />
}
