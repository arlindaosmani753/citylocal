import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Leaflet calls window/document at import time — mock it fully before any imports
vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet', () => ({
  default: {
    Icon: vi.fn().mockImplementation(() => ({})),
  },
}))
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/lib/db/queries/feed', () => ({
  getPostsForMap: vi.fn(),
}))
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: unknown }>) => {
    // In tests, resolve the dynamic import synchronously
    let Component: React.ComponentType<unknown> | null = null
    fn().then((mod) => { Component = (mod as { default: React.ComponentType<unknown> }).default })
    return function DynamicComponent(props: Record<string, unknown>) {
      return Component ? React.createElement(Component, props) : null
    }
  },
}))

import CityMap from '@/components/map/CityMap'
import CityMapLoader from '@/components/map/CityMapLoader'
import { getPostsForMap } from '@/lib/db/queries/feed'

const samplePlaces = [
  { id: 'p1', title: 'Cafe de Flore', lat: '48.8540', lng: '2.3333' },
  { id: 'p2', title: 'Le Marais', lat: '48.8572', lng: '2.3546' },
]

describe('CityMap', () => {
  test('renders without throwing when passed an array of places', () => {
    render(<CityMap places={samplePlaces} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  test('renders a marker for each place', () => {
    render(<CityMap places={samplePlaces} />)
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
  })

  test('renders empty map when places array is empty (Paris fallback center)', () => {
    render(<CityMap places={[]} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.queryAllByTestId('marker')).toHaveLength(0)
  })
})

describe('CityMapLoader', () => {
  test('passes places from getPostsForMap to CityMap', async () => {
    vi.mocked(getPostsForMap).mockResolvedValue(samplePlaces)
    const jsx = await CityMapLoader({ cityId: 'city-uuid-1' })
    render(jsx)
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
  })
})
