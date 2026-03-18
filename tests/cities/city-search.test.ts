import { describe, test } from 'vitest'

describe('searchCitiesByName', () => {
  test.todo('returns cities matching partial name (case-insensitive)')
  test.todo('returns empty array when no cities match')
  test.todo('limits results to 10')
})

describe('getCityBySlug', () => {
  test.todo('returns city for a valid slug')
  test.todo('returns null for an unknown slug')
})
