import { describe, test } from 'vitest'

describe('RSVP Server Actions (EVNT-03)', () => {
  test.todo('rsvpToEvent inserts row into event_rsvps')
  test.todo('rsvpToEvent is idempotent — double call does not error or duplicate')
  test.todo('rsvpToEvent rejects unauthenticated callers')
  test.todo('cancelRsvp deletes the rsvp row for the calling user')
  test.todo('cancelRsvp does not error when no rsvp exists (idempotent)')
})
