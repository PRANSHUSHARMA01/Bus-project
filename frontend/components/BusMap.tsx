"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import type { LayerProps, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Bus, OCC_COLOR, Route, Stop } from "../lib/types";

type LngLat = [number, number];

/** Makes buses glide to their new position instead of jumping once per second. */
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
            const nx = p[0] + (tx - p[0]) * 0.12;
            const ny = p[1] + (ty - p[1]) * 0.12;
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

const casing: LayerProps = {
  id: "route-casing",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.9 },
};

const line: LayerProps = {
  id: "route-line",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: { "line-color": ["get", "color"] as unknown as string, "line-width": 5, "line-opacity": 0.9 },
};

interface Props {
  routes: Route[];
  buses: Bus[];
  stops?: Stop[];
  selectedStop?: string | null;
  onStopClick?: (id: string) => void;
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
  onStopClick,
  mapStyle = "https://tiles.openfreemap.org/styles/liberty",
  lang = "en",
  center = [77.215, 28.605],
  zoom = 11.6,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const pos = useSmooth(buses);

  useEffect(() => {
    const s = stops.find((x) => x.id === selectedStop);
    if (s) mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 14, duration: 800 });
  }, [selectedStop, stops]);

  const geo = {
    type: "FeatureCollection" as const,
    features: routes.map((r) => ({
      type: "Feature" as const,
      properties: { color: r.color },
      geometry: { type: "LineString" as const, coordinates: r.path },
    })),
  };

  const routeColor = (id: string) => routes.find((r) => r.id === id)?.color ?? "#2563eb";

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
      {stops.map((s) => (
        <Marker key={s.id} longitude={s.lng} latitude={s.lat}>
          <div
            className={"stop" + (s.id === selectedStop ? " sel" : "")}
            title={lang === "hi" ? s.name_hi : s.name}
            onClick={(e) => {
              e.stopPropagation();
              onStopClick?.(s.id);
            }}
          />
        </Marker>
      ))}
      {buses.map((b) => {
        const p = pos[String(b.bus_id)] ?? [b.lng, b.lat];
        const bg = b.broken ? "#64748b" : OCC_COLOR[b.occupancy];
        return (
          <Marker key={b.bus_id} longitude={p[0]} latitude={p[1]} anchor="bottom">
            <div
              className={"bus" + (b.broken ? " broken" : "")}
              style={{ background: bg, outline: `3px solid ${routeColor(b.route_id)}` }}
              title={`${b.reg_no} - ${b.load_pct}% full - ${b.speed_kmh} km/h`}
            >
              {b.route_id}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
