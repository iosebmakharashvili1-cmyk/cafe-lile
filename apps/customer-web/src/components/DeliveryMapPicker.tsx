import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

// Free MapTiler API key — public by design (used client-side), scoped to this domain
// in the MapTiler dashboard for production. Free tier: 5,000 map sessions/month.
maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY ?? "";

// Cafe Lile sits in the village of Mukhrani (Mtskheta municipality) —
// the map always opens centered there.
const MUKHRANI_CENTER: [number, number] = [44.57667, 41.93389]; // [lng, lat] for MapTiler
const DEFAULT_ZOOM = 14;

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
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markerRef = useRef<maptilersdk.Marker | null>(null);
  const [isLocating, setLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">("satellite");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.HYBRID, // satellite + labels
      center: MUKHRANI_CENTER,
      zoom: DEFAULT_ZOOM,
      navigationControl: true,
      geolocateControl: false,
    });

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      placeMarker(lat, lng);
      onChange({ latitude: lat, longitude: lng });
    });

    mapRef.current = map;

    if (value) {
      placeMarker(value.latitude, value.longitude);
      // Still open on Mukhrani, but make sure a previously picked pin stays visible.
      map.once("load", () => {
        const bounds = new maptilersdk.LngLatBounds();
        bounds.extend(MUKHRANI_CENTER);
        bounds.extend([value.longitude, value.latitude]);
        map.fitBounds(bounds, { padding: 70, maxZoom: 15 });
      });
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
      markerRef.current.setLngLat([lng, lat]);
    } else {
      markerRef.current = new maptilersdk.Marker({ color: "#F5B700" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
        }
        placeMarker(latitude, longitude);
        onChange({ latitude, longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function toggleStyle() {
    if (!mapRef.current) return;
    const next = mapStyle === "satellite" ? "streets" : "satellite";
    mapRef.current.setStyle(
      next === "satellite" ? maptilersdk.MapStyle.HYBRID : maptilersdk.MapStyle.STREETS
    );
    setMapStyle(next);
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div
          ref={containerRef}
          style={{
            height: 260,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1.5px solid var(--color-line)",
          }}
        />
        <button
          type="button"
          onClick={toggleStyle}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            border: "none",
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        >
          {mapStyle === "satellite" ? "Street view" : "Satellite view"}
        </button>
      </div>
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
