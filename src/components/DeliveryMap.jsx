import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Inline SVG pin — no external image files, works in Android WebView
const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#10B981" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5" fill="#fff" stroke="none"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

export default function DeliveryMap({ lat, lng, height = 200 }) {
  if (lat == null || lng == null) return null
  return (
    <div>
      <div style={{ borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
        <MapContainer center={[lat, lng]} zoom={15} style={{ height, width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]} icon={pinIcon}><Popup>Delivery location</Popup></Marker>
        </MapContainer>
      </div>
      <a className="tiny muted" href__={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer">Open in Google Maps →</a>
    </div>
  )
}