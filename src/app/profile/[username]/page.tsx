import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { profiles, cities } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ContributionsList } from '@/components/profile/ContributionsList'
import { listContributionsForUser } from '@/lib/db/queries/posts'
import type { Metadata } from 'next'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username} — CityLocal` }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params

  const result = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      createdAt: profiles.createdAt,
      homeCityName: cities.name,
    })
    .from(profiles)
    .leftJoin(cities, eq(profiles.homeCityId, cities.id))
    .where(eq(profiles.username, username))
    .limit(1)

  const profile = result[0]
  if (!profile) notFound()

  const contributions = await listContributionsForUser(profile.id)

  return (
    <main className="container mx-auto max-w-2xl py-8 px-4">
      <ProfileHeader profile={profile} />
      <ContributionsList posts={contributions} />
    </main>
  )
}
