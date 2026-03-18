import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCityBySlug } from '@/lib/db/queries/cities'
import { getFeedForCity } from '@/lib/db/queries/feed'
import CategoryFilterTabs from '@/components/feed/CategoryFilterTabs'
import FeedList from '@/components/feed/FeedList'
import CityMapLoader from '@/components/map/CityMapLoader'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; cursor?: string; cursorAt?: string }>
}

export default async function CityPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { category, cursor, cursorAt } = await searchParams

  const city = await getCityBySlug(slug)
  if (!city) {
    notFound()
  }

  const parsedCursor =
    cursor && cursorAt
      ? { id: cursor, createdAt: new Date(cursorAt) }
      : undefined

  const { posts, nextCursor } = await getFeedForCity(city.id, {
    category,
    cursor: parsedCursor,
  })

  return (
    <main>
      <h1>{city.name}</h1>
      <CategoryFilterTabs
        activeCategory={category ?? 'all'}
        citySlug={slug}
      />
      <FeedList
        posts={posts}
        nextCursor={nextCursor}
        citySlug={slug}
        activeCategory={category}
      />
      <Suspense fallback={<div>Loading map...</div>}>
        <CityMapLoader cityId={city.id} />
      </Suspense>
    </main>
  )
}
