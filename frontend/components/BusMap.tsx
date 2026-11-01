"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import type { LayerProps, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Bus, OCC_COLOR, Route, Stop } from "../lib/types";

type LngLat = [number, number];

/** Makes buses glide to their new position smoothly instead of jumping */
function useSmooth(buses: Bus[]) {
  const [pos, setPos] = useState<Record<string, LngLat>>({});
  const target = useRef<Record<string, LngLat>>({});

  useEffect(() => {
    const t: Record<string, LngLat> = {};
    buses.forEach((b) => (t[String(b.bus_id)] = [b.lng, b.lat]));
    target.current = t;
  }, [buses]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 33) {
        last = now;
        setPos((prev) => {
          const next: Record<string, LngLat> = {};
          let changed = false;
          for (const id of Object.keys(target.current)) {
            const [tx, ty] = target.current[id];
            const p = prev[id];
            if (!p) {
              next[id] = [tx, ty];
              changed = true;
              continue;
            }
            const nx = p[0] + (tx - p[0]) * 0.14;
            const ny = p[1] + (ty - p[1]) * 0.14;
            if (Math.abs(nx - p[0]) > 1e-9 || Math.abs(ny - p[1]) > 1e-9) changed = true;
            next[id] = [nx, ny];
          }
          return changed ? next : prev;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return pos;
}

// Uber Route Casing (White outer halo)
const casing: LayerProps = {
  id: "route-casing",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.95 },
};

// Uber Route Line (Black / Charcoal route path)
const line: LayerProps = {
  id: "route-line",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: { "line-color": "#18181b", "line-width": 4.5, "line-opacity": 0.95 },
};

interface Props {
  routes: Route[];
  buses: Bus[];
  stops?: Stop[];
  selectedStop?: string | null;
  selectedBusId?: number | null;
  onStopClick?: (id: string) => void;
  onBusClick?: (bus: Bus) => void;
  mapStyle?: string;
  lang?: "en" | "hi";
  center?: LngLat;
  zoom?: number;
}

export default function BusMap({
  routes,
  buses,
  stops = [],
  selectedStop = null,
  selectedBusId = null,
  onStopClick,
  onBusClick,
  mapStyle = "https://tiles.openfreemap.org/styles/positron",
  lang = "en",
  center = [77.215, 28.605],
  zoom = 11.6,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const pos = useSmooth(buses);

  useEffect(() => {
    if (selectedStop) {
      const s = stops.find((x) => x.id === selectedStop);
      if (s) mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 14.5, duration: 800 });
    }
  }, [selectedStop, stops]);

  useEffect(() => {
    if (selectedBusId) {
      const b = buses.find((x) => x.bus_id === selectedBusId);
      if (b) mapRef.current?.flyTo({ center: [b.lng, b.lat], zoom: 14.5, duration: 800 });
    }
  }, [selectedBusId, buses]);

  const geo = {
    type: "FeatureCollection" as const,
    features: routes.map((r) => ({
      type: "Feature" as const,
      properties: { color: r.color },
      geometry: { type: "LineString" as const, coordinates: r.path },
    })),
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
    >
      <Source id="routes" type="geojson" data={geo}>
        <Layer {...casing} />
        <Layer {...line} />
      </Source>

      {/* Uber monochrome stop markers */}
      {stops.map((s) => (
        <Marker key={s.id} longitude={s.lng} latitude={s.lat}>
          <div
            className={`uber-stop-marker ${s.id === selectedStop ? "sel" : ""}`}
            title={lang === "hi" ? s.name_hi : s.name}
            onClick={(e) => {
              e.stopPropagation();
              onStopClick?.(s.id);
            }}
          />
        </Marker>
      ))}

      {/* Uber black pill bus markers with route numbers */}
      {buses.map((b) => {
        const p = pos[String(b.bus_id)] ?? [b.lng, b.lat];
        const isSelected = b.bus_id === selectedBusId;
        return (
          <Marker key={b.bus_id} longitude={p[0]} latitude={p[1]} anchor="center">
            <div
              className={`uber-bus-marker ${isSelected ? "selected" : ""}`}
              style={{
                background: b.broken ? "#52525b" : "var(--primary)",
                border: isSelected ? "3px solid #fff" : "2px solid #fff",
              }}
              title={`${b.reg_no} · ${b.load_pct}% full · ${b.speed_kmh} km/h`}
              onClick={(e) => {
                e.stopPropagation();
                onBusClick?.(b);
              }}
            >
              Route {b.route_id}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
