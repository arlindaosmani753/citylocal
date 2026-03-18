import { describe, test } from 'vitest'

// Note: real tests use vi.mock('react-leaflet') and vi.mock('leaflet')
// because Leaflet calls window/document at import time — jsdom required.
// These mocks are added in Wave 2 when CityMap component exists.

describe('CityMap', () => {
  test.todo('renders without throwing when passed an array of places')
  test.todo('renders a marker for each place')
  test.todo('renders empty map when places array is empty (Paris fallback center)')
})

describe('CityMapLoader', () => {
  test.todo('passes places from getPostsForMap to CityMap')
})
