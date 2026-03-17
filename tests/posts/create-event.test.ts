import { describe, test } from 'vitest'

describe('createEvent Server Action', () => {
  // EVNT-01
  test.todo('validates startsAt, endsAt, locationName fields')
  test.todo('applies GPS verification (same path as createPlace)')
  test.todo('rejects non-locals')
  test.todo('creates post row with contentType=event')
  // EVNT-04
  test.todo('stores recurrenceInterval=1 week for weekly recurring event')
  test.todo('stores recurrenceInterval=1 month for monthly recurring event')
  test.todo('stores null recurrenceInterval for non-recurring event')
})
