"use client";

import React, { useEffect, useState, useMemo } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  fetchLiveBuses,
  fetchStops,
  fetchStopArrivals,
  BusLive,
  Stop,
  StopArrivalsResponse,
} from "./lib/api";

const ROUTE_COLORS: Record<string, string> = {
  A: "#ef4444", // Red - North-West Line
  B: "#3b82f6", // Blue - Central-East Line
  C: "#22c55e", // Green - South Delhi Line
};

export default function PassengerMapPage() {
  const [buses, setBuses] = useState<BusLive[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [selectedBus, setSelectedBus] = useState<BusLive | null>(null);
  const [selectedStopArrivals, setSelectedStopArrivals] = useState<StopArrivalsResponse | null>(null);
  const [loadingStops, setLoadingStops] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");

  // 1. Initial Load of Stops
  useEffect(() => {
    fetchStops()
      .then((data) => setStops(data))
      .catch((err) => console.error("Error loading stops:", err));
  }, []);

  // 2. High-Frequency 1-Second Telemetry Polling Loop
  useEffect(() => {
    const pollBuses = async () => {
      try {
        const liveData = await fetchLiveBuses();
        setBuses(liveData);
        setConnectionStatus(`Connected · ${liveData.length} Buses Tracked`);

        // If a bus is selected, refresh its reference
        if (selectedBus) {
          const fresh = liveData.find((b) => b.bus_id === selectedBus.bus_id);
          if (fresh) setSelectedBus(fresh);
        }
      } catch (err) {
        setConnectionStatus("Backend Connection Error");
      }
    };

    pollBuses();
    const intervalId = setInterval(pollBuses, 1000);
    return () => clearInterval(intervalId);
  }, [selectedBus]);

  // 3. Handle Stop Click to Fetch Route-Aware ETAs
  const handleStopClick = async (stop: Stop) => {
    setLoadingStops(true);
    setSelectedBus(null);
    try {
      const arrivals = await fetchStopArrivals(stop.id);
      setSelectedStopArrivals(arrivals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStops(false);
    }
  };

  // 4. Filter Buses by Selected Route
  const visibleBuses = useMemo(() => {
    if (selectedRoute === "ALL") return buses;
    return buses.filter((b) => b.route === selectedRoute);
  }, [buses, selectedRoute]);

  // 5. Build GeoJSON Line Strings for Routes A, B, and C
  const routeLinesGeoJSON = useMemo(() => {
    const makeCoords = (routeCode: string) =>
      stops
        .filter((s) => s.route === routeCode)
        .map((s) => [s.lng, s.lat]);

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: { route: "A", color: "#ef4444" },
          geometry: { type: "LineString" as const, coordinates: makeCoords("A") },
        },
        {
          type: "Feature" as const,
          properties: { route: "B", color: "#3b82f6" },
          geometry: { type: "LineString" as const, coordinates: makeCoords("B") },
        },
        {
          type: "Feature" as const,
          properties: { route: "C", color: "#22c55e" },
          geometry: { type: "LineString" as const, coordinates: makeCoords("C") },
        },
      ],
    };
  }, [stops]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-gray-950 overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 items-center">
        {/* Connection Status Pill */}
        <div className="glass-panel px-3.5 py-1.5 flex items-center space-x-2 text-xs font-semibold text-gray-200">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus.includes("Connected") ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span>{connectionStatus}</span>
        </div>

        {/* Route Filter Selector */}
        <div className="glass-panel p-1 flex items-center space-x-1 text-xs font-medium">
          {["ALL", "A", "B", "C"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoute(r)}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedRoute === r
                  ? "bg-blue-600 text-white font-bold shadow"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {r === "ALL" ? "All Routes" : `Route ${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main MapLibre Vector Map Canvas */}
      <Map
        initialViewState={{
          longitude: 77.2167,
          latitude: 28.625,
          zoom: 12.2,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >
        <NavigationControl position="bottom-right" />

        {/* Route Polyline Overlays */}
        <Source id="routes-source" type="geojson" data={routeLinesGeoJSON}>
          <Layer
            id="routes-line"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": 4,
              "line-opacity": 0.8,
            }}
          />
        </Source>

        {/* Stop Markers */}
        {stops.map((stop) => (
          <Marker
            key={`stop-${stop.id}`}
            longitude={stop.lng}
            latitude={stop.lat}
            anchor="center"
          >
            <div
              onClick={() => handleStopClick(stop)}
              className="cursor-pointer group relative flex flex-col items-center"
            >
              <div className="w-3.5 h-3.5 bg-gray-900 border-2 border-white rounded-full shadow-md group-hover:scale-125 transition-transform" />
              <span className="absolute top-4 bg-gray-900/90 text-[10px] text-gray-200 font-semibold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-gray-700">
                {stop.name}
              </span>
            </div>
          </Marker>
        ))}

        {/* Real-Time Live Bus Markers */}
        {visibleBuses.map((bus) => {
          const color = ROUTE_COLORS[bus.route] || "#3b82f6";
          const isSelected = selectedBus?.bus_id === bus.bus_id;

          return (
            <Marker
              key={bus.bus_id}
              longitude={bus.lng}
              latitude={bus.lat}
              anchor="center"
            >
              <div
                onClick={() => {
                  setSelectedBus(bus);
                  setSelectedStopArrivals(null);
                }}
                className="cursor-pointer group flex flex-col items-center"
              >
                {/* Vehicle Marker Pin */}
                <div
                  style={{ backgroundColor: color }}
                  className={`w-9 h-9 rounded-full border-2 border-white text-white font-extrabold text-xs flex items-center justify-center shadow-lg transition-transform ${
                    isSelected ? "ring-4 ring-yellow-400 scale-125 z-30" : "hover:scale-110"
                  } ${bus.occupancy_rate >= 90 ? "ring-2 ring-red-500" : ""}`}
                >
                  {bus.bus_id}
                </div>

                {/* Micro Telemetry Pill */}
                <div className="bg-gray-900/90 text-white text-[9px] px-1 rounded shadow mt-0.5 font-mono">
                  {Math.round(bus.speed)} km/h
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Selected Bus Telemetry Slide-Over Drawer */}
      {selectedBus && (
        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-30 glass-panel p-5 text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-start border-b border-gray-700/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{selectedBus.bus_id}</h3>
                <span
                  style={{ backgroundColor: ROUTE_COLORS[selectedBus.route] }}
                  className="text-[11px] font-bold px-2 py-0.5 rounded text-white"
                >
                  Route {selectedBus.route}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Next Depot / Stop: {selectedBus.next_stop_name || "En Route"}
              </p>
            </div>
            <button
              onClick={() => setSelectedBus(null)}
              className="text-gray-400 hover:text-white text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="bg-gray-800/60 p-2.5 rounded-lg border border-gray-700/50">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Speed</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {selectedBus.speed} <span className="text-xs font-normal text-gray-400">km/h</span>
              </span>
            </div>
            <div className="bg-gray-800/60 p-2.5 rounded-lg border border-gray-700/50">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Occupancy</span>
              <span className="text-lg font-extrabold text-blue-400">
                {selectedBus.passengers} <span className="text-xs font-normal text-gray-400">/ 50</span>
              </span>
            </div>
          </div>

          {/* Occupancy Meter Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Crowd Level</span>
              <span
                className={`font-semibold ${
                  selectedBus.occupancy_rate >= 90
                    ? "text-red-400"
                    : selectedBus.occupancy_rate >= 60
                    ? "text-yellow-400"
                    : "text-emerald-400"
                }`}
              >
                {selectedBus.crowd_status} ({selectedBus.occupancy_rate}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, selectedBus.occupancy_rate)}%` }}
                className={`h-full transition-all duration-300 ${
                  selectedBus.occupancy_rate >= 90
                    ? "bg-red-500"
                    : selectedBus.occupancy_rate >= 60
                    ? "bg-yellow-400"
                    : "bg-emerald-500"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Selected Stop Arrival Board Modal */}
      {selectedStopArrivals && (
        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-30 glass-panel p-5 text-white shadow-2xl">
          <div className="flex justify-between items-start border-b border-gray-700/60 pb-3">
            <div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                Live Arrivals Board
              </span>
              <h3 className="text-lg font-bold">{selectedStopArrivals.stop_name}</h3>
            </div>
            <button
              onClick={() => setSelectedStopArrivals(null)}
              className="text-gray-400 hover:text-white text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {selectedStopArrivals.arrivals.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No buses currently approaching.</p>
            ) : (
              selectedStopArrivals.arrivals.map((arr) => (
                <div
                  key={arr.bus_id}
                  className="bg-gray-800/70 p-2.5 rounded-lg border border-gray-700 flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: ROUTE_COLORS[arr.route] }}
                      className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                    >
                      {arr.bus_id}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-200">
                        {arr.distance_km} km away
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {arr.passengers}/{arr.capacity} passengers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-400">
                      {arr.eta_min} <span className="text-xs font-normal">min</span>
                    </span>
                    <p className="text-[10px] text-gray-400">ETA</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
