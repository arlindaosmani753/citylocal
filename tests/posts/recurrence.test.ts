import { describe, test, expect } from 'vitest'
import { getNextOccurrence } from '@/lib/db/queries/posts'

describe('Recurring event occurrence logic (EVNT-04)', () => {
  test('returns null for non-recurring event (no recurrenceInterval)', () => {
    const result = getNextOccurrence({
      startsAt: new Date('2026-03-01T10:00:00Z'),
      recurrenceInterval: null,
      recurrenceEndsAt: null,
    })
    expect(result).toBeNull()
  })

  test('returns a future Date for a weekly event that started in the past', () => {
    const pastStart = new Date(Date.now() - 14 * 24 * 3_600_000) // 2 weeks ago
    const result = getNextOccurrence({
      startsAt: pastStart,
      recurrenceInterval: '1 week',
      recurrenceEndsAt: null,
    })
    expect(result).toBeInstanceOf(Date)
    expect(result!.getTime()).toBeGreaterThan(Date.now())
  })

  test('returns null when recurrenceEndsAt has already passed', () => {
    const pastStart = new Date(Date.now() - 30 * 24 * 3_600_000)
    const pastEnd = new Date(Date.now() - 7 * 24 * 3_600_000)
    const result = getNextOccurrence({
      startsAt: pastStart,
      recurrenceInterval: '1 week',
      recurrenceEndsAt: pastEnd,
    })
    expect(result).toBeNull()
  })

  test('returns a future Date for a monthly event', () => {
    const pastStart = new Date(Date.now() - 35 * 24 * 3_600_000) // ~35 days ago
    const result = getNextOccurrence({
      startsAt: pastStart,
      recurrenceInterval: '1 month',
      recurrenceEndsAt: null,
    })
    expect(result).toBeInstanceOf(Date)
    expect(result!.getTime()).toBeGreaterThan(Date.now())
  })
})
