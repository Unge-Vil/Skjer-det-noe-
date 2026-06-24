"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Listing } from "@/lib/types";
import { categoryDef } from "@/components/ds/categories";

function pinIcon(color: string, active: boolean) {
  const size = active ? 34 : 26;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid var(--surface-card,#fff);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:var(--shadow-md,0 2px 8px rgba(0,0,0,.4));
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;background:var(--fjord-500,#2563eb);border:3px solid #fff;
    border-radius:50%;box-shadow:0 0 0 4px rgba(14,116,114,.25);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function ListingMap({
  center,
  listings,
  activeId,
  onHover,
  onSelect,
}: {
  center: { lat: number; lng: number };
  listings: Listing[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsytere'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />

      <Marker position={[center.lat, center.lng]} icon={userIcon} />

      {listings.map((l) => {
        const isActive = l.id === activeId;
        return (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={pinIcon(categoryDef(l.categorySlug).fg, isActive)}
            zIndexOffset={isActive ? 1000 : 0}
            eventHandlers={{
              mouseover: () => onHover?.(l.id),
              mouseout: () => onHover?.(null),
              click: () => onSelect?.(l.id),
            }}
          >
            <Popup>
              <strong>{l.title}</strong>
              {l.organizationName && <div>{l.organizationName}</div>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
