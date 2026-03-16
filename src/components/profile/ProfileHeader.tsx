import { MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'

type ProfileData = {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  createdAt: Date
  homeCityName: string | null
}

type Props = {
  profile: ProfileData
}

function getInitials(displayName: string | null, username: string): string {
  const name = displayName || username
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileHeader({ profile }: Props) {
  const initials = getInitials(profile.displayName, profile.username)
  const displayName = profile.displayName || profile.username
  const memberSince = format(new Date(profile.createdAt), 'MMMM yyyy')

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold text-neutral-700"
              aria-label={`Avatar for ${displayName}`}
            >
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.homeCityName && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {profile.homeCityName}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">Member since {memberSince}</p>
            {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
