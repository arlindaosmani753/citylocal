import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/queries/posts'
import { format } from 'date-fns'
import { RsvpButton } from '@/components/events/RsvpButton'

type Props = { params: Promise<{ id: string }> }

export default async function EventPage({ params }: Props) {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) notFound()

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{event.title}</h1>

      <div className="text-neutral-500 text-sm mb-4 space-y-1">
        {event.startsAt && (
          <p>{format(event.startsAt, 'EEEE, MMMM d, yyyy · h:mm a')}</p>
        )}
        {event.locationName && <p>{event.locationName}</p>}
      </div>

      {event.body && <p className="text-neutral-700 mb-6">{event.body}</p>}

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium">{event.rsvpCount} attending</span>
        <RsvpButton postId={event.id} initialCount={event.rsvpCount} />
      </div>

      {event.attendees.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Attendees
          </h2>
          <ul className="space-y-1">
            {event.attendees.map(a => (
              <li key={a.userId} className="text-sm">
                {a.username ?? 'Unknown'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
