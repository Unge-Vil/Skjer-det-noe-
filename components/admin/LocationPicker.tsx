"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const pin = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;background:var(--coral-600,#BF360F);border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:var(--shadow-md,0 2px 8px rgba(0,0,0,.4));"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Recenter the map only when an external target (e.g. a geocoded address)
// changes — not on every map click.
function Recenter({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!target) return;
    const key = `${target.lat},${target.lng}`;
    if (previous.current === key) return;
    previous.current = key;
    map.setView([target.lat, target.lng], Math.max(map.getZoom(), 15));
  }, [target, map]);
  return null;
}

export default function LocationPicker({
  value,
  center,
  flyTo = null,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
  flyTo?: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[value?.lat ?? center.lat, value?.lng ?? center.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: 260, width: "100%", borderRadius: "var(--radius-md)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      <Recenter target={flyTo} />
      {value && <Marker position={[value.lat, value.lng]} icon={pin} />}
    </MapContainer>
  );
}
