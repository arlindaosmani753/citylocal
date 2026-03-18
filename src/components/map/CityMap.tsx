'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { MapPin } from '@/lib/db/queries/feed'

const markerIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type Props = {
  places: MapPin[]
}

export default function CityMap({ places }: Props) {
  const center: [number, number] =
    places.length > 0
      ? [parseFloat(places[0].lat), parseFloat(places[0].lng)]
      : [48.8566, 2.3522] // Paris fallback

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[parseFloat(place.lat), parseFloat(place.lng)]}
          icon={markerIcon}
        >
          <Popup>{place.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
