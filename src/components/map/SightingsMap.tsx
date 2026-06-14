import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Sighting } from "@/lib/types";

/**
 * OpenStreetMap (Leaflet) wrapper. Mounts only on the client because Leaflet
 * touches `window` at import time. Renders one marker per sighting and
 * auto-fits the map bounds.
 *
 * The parent owns loading state; this component just renders pins.
 */
export function SightingsMap({ sightings }: { sightings: Sighting[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    let cancelled = false;
    let map: any = null;

    (async () => {
      const L = (await import("leaflet")).default;

      // Default marker icons break under bundlers — the marker constructor
      // looks for iconUrl relative to its own URL, which gets mangled. Use
      // the public CDN copies bundled with Leaflet's package.
      // (Workaround documented in Leaflet README under "With bundlers".)
      const iconRetinaUrl = new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href;
      const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href;
      const shadowUrl = new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href;
      L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [20, 0],
        zoom: 2,
        worldCopyJump: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = { map, L };
    })();

    return () => {
      cancelled = true;
      const ref = mapRef.current as { map: any } | null;
      if (ref?.map) {
        ref.map.remove();
      }
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Render markers whenever sightings change.
  useEffect(() => {
    const ref = mapRef.current as { map: any; L: any } | null;
    if (!ref) return;
    const { map, L } = ref;

    for (const m of markersRef.current as any[]) {
      map.removeLayer(m);
    }
    markersRef.current = [];

    if (sightings.length === 0) return;

    const points: [number, number][] = [];
    for (const s of sightings) {
      if (typeof s.location_lat !== "number" || typeof s.location_lng !== "number") continue;
      if (Number.isNaN(s.location_lat) || Number.isNaN(s.location_lng)) continue;
      const marker = L.circleMarker([s.location_lat, s.location_lng], {
        radius: 8,
        color: "#2563eb",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 0.35,
      }).addTo(map);

      const detected = s.detected_at
        ? new Date(s.detected_at).toLocaleString()
        : "Unknown time";
      const popupHtml = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${escapeHtml(s.location_name ?? "Unknown location")}
          </div>
          <div style="font-size: 12px; color: #475569;">
            Similarity: <strong>${(s.similarity_score * 100).toFixed(1)}%</strong>
          </div>
          <div style="font-size: 12px; color: #475569;">
            Device: <code>${escapeHtml((s.device_hash ?? "unknown").slice(0, 14))}</code>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${escapeHtml(detected)}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      (markersRef.current as any[]).push(marker);
      points.push([s.location_lat, s.location_lng]);
    }

    if (points.length === 1) {
      map.setView(points[0], 6);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [sightings]);

  // Imperative zoom buttons: parent calls these via the public `window.__map`
  // shim? No — simpler: just call methods on the ref via a callback prop.
  // We expose them by listening to custom DOM events from the parent.
  useEffect(() => {
    function handleZoomIn() {
      const ref = mapRef.current as { map: any } | null;
      ref?.map?.zoomIn();
    }
    function handleZoomOut() {
      const ref = mapRef.current as { map: any } | null;
      ref?.map?.zoomOut();
    }
    window.addEventListener("vault:map:zoom-in", handleZoomIn);
    window.addEventListener("vault:map:zoom-out", handleZoomOut);
    return () => {
      window.removeEventListener("vault:map:zoom-in", handleZoomIn);
      window.removeEventListener("vault:map:zoom-out", handleZoomOut);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(37,99,235,0.04))" }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
