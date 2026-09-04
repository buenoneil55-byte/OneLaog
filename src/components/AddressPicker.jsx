import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Inline SVG pin — no external image, works in Android WebView
const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#10B981" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5" fill="#fff" stroke="none"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function MapController({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], 16)
  }, [lat, lng, map])
  return null
}

function MapClick({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng) } })
  return null
}

export default function AddressPicker({ lat, lng, onPick, landmark, onLandmark }) {
  const center = [lat || 14.5995, lng || 120.9842] // defaults to Manila
  return (
    <div>
      <div style={{ height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <MapContainer center={center} zoom={lat ? 16 : 12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <MapController lat={lat} lng={lng} />
          {lat && lng && <Marker position={[lat, lng]} icon={pinIcon} />}
          <MapClick onPick={onPick} />
        </MapContainer>
      </div>
      {lat && <p className="tiny muted">📍 Pinned at {lat.toFixed(5)}, {lng.toFixed(5)} — tap the map to move the pin.</p>}
      <label className="form-label" style={{ marginTop: 8 }}>Landmark (optional)
        <input className="input" value={landmark || ''} onChange={(e) => onLandmark(e.target.value)} placeholder="e.g. Beside the pink bakery, near barangay hall" />
      </label>
    </div>
  )
}