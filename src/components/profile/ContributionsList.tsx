import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = { userId: string }

export function ContributionsList({ userId: _userId }: Props) {
  // Phase 2 will query posts here via a Server Action or parent page
  const posts: unknown[] = []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Contributions
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {posts.length} contributions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No contributions yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Posts will appear here once they&apos;re added in a future update.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
