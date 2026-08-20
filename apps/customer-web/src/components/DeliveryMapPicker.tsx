import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default marker icon URLs need explicit config in bundlers like Vite,
// since Leaflet's default asset paths assume a plain script-tag setup.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Tbilisi city center — reasonable default view for Cafe Lile's delivery area.
const DEFAULT_CENTER: [number, number] = [41.7151, 44.8271];
const DEFAULT_ZOOM = 13;

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

interface DeliveryMapPickerProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
}

export function DeliveryMapPicker({ value, onChange }: DeliveryMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLocating, setLocating] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: value ? [value.latitude, value.longitude] : DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });

    mapRef.current = map;

    if (value) {
      placeMarker(value.latitude, value.longitude);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker(lat: number, lng: number) {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
        placeMarker(latitude, longitude);
        onChange({ latitude, longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          height: 260,
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1.5px solid var(--color-line)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 12.5, color: "var(--color-ink-soft)" }}>
          {value ? "Tap the map to adjust the pin" : "Tap the map to drop a pin at your delivery location"}
        </span>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          style={{
            border: "none",
            background: "var(--color-yellow-tint)",
            color: "var(--color-ink)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 12px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: isLocating ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {isLocating ? "Locating…" : "Use my location"}
        </button>
      </div>
    </div>
  );
}
