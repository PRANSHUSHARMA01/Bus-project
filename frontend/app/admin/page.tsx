"use client";

import React, { useState, useEffect } from "react";
import {
  fetchLiveBuses,
  fetchAlerts,
  fetchAdvice,
  fetchForecast,
  fetchWhatIf,
  BusLive,
  AlertItem,
  AdviceResponse,
  ForecastResponse,
  WhatIfResponse,
} from "../lib/api";

export default function AdminDashboardPage() {
  const [buses, setBuses] = useState<BusLive[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastRoute, setForecastRoute] = useState<string>("A");
  const [forecastHour, setForecastHour] = useState<number>(9);

  // What-If Simulation State
  const [whatIfRoute, setWhatIfRoute] = useState<string>("A");
  const [addBuses, setAddBuses] = useState<number>(2);
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.2);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Initial & Periodic Synchronization Loop
  useEffect(() => {
    const syncAdminData = async () => {
      try {
        const [liveBuses, liveAlerts, liveAdvice] = await Promise.all([
          fetchLiveBuses(),
          fetchAlerts(),
          fetchAdvice(),
        ]);
        setBuses(liveBuses);
        setAlerts(liveAlerts);
        setAdvice(liveAdvice);
      } catch (err) {
        console.error("Admin synchronization error:", err);
      }
    };

    syncAdminData();
    const interval = setInterval(syncAdminData, 2000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Demand Forecast when parameters change
  useEffect(() => {
    fetchForecast(forecastRoute, forecastHour)
      .then((data) => setForecast(data))
      .catch((e) => console.error(e));
  }, [forecastRoute, forecastHour]);

  // 3. Trigger What-If Simulation
  useEffect(() => {
    fetchWhatIf(whatIfRoute, addBuses, demandMultiplier)
      .then((res) => setWhatIfResult(res))
      .catch((e) => console.error(e));
  }, [whatIfRoute, addBuses, demandMultiplier]);

  // Network Aggregate Metrics
  const totalPassengers = buses.reduce((acc, b) => acc + (b.passengers || 0), 0);
  const overcrowdedCount = buses.filter((b) => b.occupancy_rate >= 90).length;
  const overcrowdingRate = buses.length > 0 ? Math.round((overcrowdedCount / buses.length) * 100) : 0;

  // Filter buses table
  const filteredBuses = buses.filter(
    (b) =>
      b.bus_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.next_stop_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <span>📊</span> Central Fleet Operations Headquarters
        </h2>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Real-time network telemetry, autonomous rebalancing directives & machine learning scenario analysis
        </p>
      </div>

      {/* Network KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Active Fleet Size
          </span>
          <div className="text-2xl md:text-3xl font-black text-white mt-1">
            {buses.length} <span className="text-xs text-emerald-400 font-semibold">/ 18 Live</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">100% Operational Readiness</span>
        </div>

        <div className="glass-panel p-5">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Commuters in Transit
          </span>
          <div className="text-2xl md:text-3xl font-black text-blue-400 mt-1">
            {totalPassengers} <span className="text-xs text-gray-400 font-normal">riders</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">Across 3 Delhi Corridors</span>
        </div>

        <div className="glass-panel p-5">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Network Overcrowding
          </span>
          <div
            className={`text-2xl md:text-3xl font-black mt-1 ${
              overcrowdingRate > 15 ? "text-red-400" : "text-yellow-400"
            }`}
          >
            {overcrowdingRate}%
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            {overcrowdedCount} of {buses.length} buses &gt; 90% load
          </span>
        </div>

        <div className="glass-panel p-5">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Active System Incidents
          </span>
          <div
            className={`text-2xl md:text-3xl font-black mt-1 ${
              alerts.length > 0 ? "text-yellow-400" : "text-emerald-400"
            }`}
          >
            {alerts.length}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">Bunching & Overcrowding</span>
        </div>
      </div>

      {/* Incident Stream & Autonomous Rebalancer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Incident Feed */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>⚠️</span> Priority Network Alert Feed
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
              {alerts.length} Active
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                All corridors operating within nominal headway and capacity tolerances.
              </p>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg border text-xs flex justify-between items-start ${
                    a.type === "BUNCHING"
                      ? "bg-yellow-950/30 border-yellow-700/50 text-yellow-300"
                      : a.type === "SOS"
                      ? "bg-red-950/50 border-red-600 text-red-200"
                      : "bg-orange-950/30 border-orange-700/50 text-orange-300"
                  }`}
                >
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] block opacity-80">
                      [{a.type}] Route {a.route} · {a.bus_id}
                    </span>
                    <p className="mt-0.5 text-gray-200">{a.message}</p>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 ml-2 whitespace-nowrap">
                    {a.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Autonomous Rebalancing Advisory Engine */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🤖</span> Autonomous Fleet Rebalancer
            </h3>
            <span className="text-[11px] text-blue-400 font-semibold">AI Dispatch Engine</span>
          </div>

          {/* Average Corridor Loads */}
          {advice && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-800/60 p-2.5 rounded-lg border border-red-500/30">
                <span className="text-[10px] text-gray-400 block">Route A (NW)</span>
                <span className="text-base font-extrabold text-red-400">
                  {advice.fleet_averages.Route_A_occupancy_pct}%
                </span>
              </div>
              <div className="bg-gray-800/60 p-2.5 rounded-lg border border-blue-500/30">
                <span className="text-[10px] text-gray-400 block">Route B (CE)</span>
                <span className="text-base font-extrabold text-blue-400">
                  {advice.fleet_averages.Route_B_occupancy_pct}%
                </span>
              </div>
              <div className="bg-gray-800/60 p-2.5 rounded-lg border border-emerald-500/30">
                <span className="text-[10px] text-gray-400 block">Route C (South)</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {advice.fleet_averages.Route_C_occupancy_pct}%
                </span>
              </div>
            </div>
          )}

          {/* Rebalancing Recommendation Cards */}
          <div className="space-y-3">
            {advice?.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-gray-800/70 p-3.5 rounded-xl border border-gray-700/80 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[11px]">
                    {rec.type.replace(/_/g, " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 text-[10px] font-bold">
                    -{rec.projected_wait_reduction_min} min wait
                  </span>
                </div>
                <p className="text-gray-300">{rec.rationale}</p>
                <div className="bg-gray-900/60 p-2 rounded text-gray-200 font-mono text-[11px] border border-gray-700/40">
                  👉 <strong>Action:</strong> {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Machine Learning Demand Forecast & What-If Simulator Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Demand Forecasting Panel */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📈</span> ML Demand Prediction (6-Week Model)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Ridge Regressor</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Transit Route:</label>
              <select
                value={forecastRoute}
                onChange={(e) => setForecastRoute(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white font-bold"
              >
                <option value="A">Route A (North-West Line)</option>
                <option value="B">Route B (Central-East Line)</option>
                <option value="C">Route C (South Delhi Line)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Forecast Hour:</label>
              <select
                value={forecastHour}
                onChange={(e) => setForecastHour(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white font-bold"
              >
                {[8, 9, 10, 12, 14, 17, 18, 19, 21].map((h) => (
                  <option key={h} value={h}>
                    {h}:00 ({h <= 11 ? "Morning Rush" : h >= 17 ? "Evening Rush" : "Off-Peak"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {forecast && (
            <div className="bg-gray-800/80 p-5 rounded-xl border border-gray-700 text-center space-y-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider block">
                Predicted Hourly Boarding Demand
              </span>
              <div className="text-4xl font-black text-emerald-400">
                {forecast.predicted_passengers_per_hour}{" "}
                <span className="text-sm font-medium text-gray-300">commuters/hr</span>
              </div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  forecast.peak_status === "PEAK"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                }`}
              >
                {forecast.peak_status} TRAFFIC CYCLE
              </span>
              <p className="text-[10px] text-gray-500 pt-1">
                Trained on 3,024 records from historical CSV with One-Hot Route encodings
              </p>
            </div>
          )}
        </div>

        {/* What-If Scenario Simulator Panel */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🔬</span> What-If Scenario Simulator
            </h3>
            <span className="text-[10px] font-mono text-purple-400">Headway Physics</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Corridor:</span>
                <span className="font-bold text-white">Route {whatIfRoute}</span>
              </div>
              <div className="flex gap-2">
                {["A", "B", "C"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setWhatIfRoute(r)}
                    className={`flex-1 py-1 text-xs rounded font-bold cursor-pointer ${
                      whatIfRoute === r ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    Route {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 1: Add/Remove Buses */}
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Fleet Adjustment (Buses):</span>
                <span className="font-bold text-emerald-400">
                  {addBuses > 0 ? `+${addBuses}` : addBuses} Buses
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="6"
                step="1"
                value={addBuses}
                onChange={(e) => setAddBuses(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Slider 2: Demand Surge Multiplier */}
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Commuter Demand Surge:</span>
                <span className="font-bold text-yellow-400">{demandMultiplier}x Demand</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={demandMultiplier}
                onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* What-If Projected Outcomes */}
          {whatIfResult && (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-gray-800/80 p-2.5 rounded-lg border border-gray-700">
                <span className="text-[10px] text-gray-400 block">Projected Headway</span>
                <span className="text-base font-extrabold text-white">
                  {whatIfResult.projected_headway_minutes} min{" "}
                  <span className="text-[10px] font-normal text-emerald-400">
                    (was {whatIfResult.baseline_headway_minutes}m)
                  </span>
                </span>
              </div>
              <div className="bg-gray-800/80 p-2.5 rounded-lg border border-gray-700">
                <span className="text-[10px] text-gray-400 block">Wait Time Saved</span>
                <span className="text-base font-extrabold text-emerald-400">
                  -{whatIfResult.wait_time_reduction_minutes} min / rider
                </span>
              </div>
              <div className="bg-gray-800/80 p-2.5 rounded-lg border border-gray-700">
                <span className="text-[10px] text-gray-400 block">Peak Bus Occupancy</span>
                <span className="text-base font-extrabold text-blue-400">
                  {whatIfResult.projected_bus_occupancy_pct}%
                </span>
              </div>
              <div className="bg-gray-800/80 p-2.5 rounded-lg border border-gray-700">
                <span className="text-[10px] text-gray-400 block">Hourly Cost Delta</span>
                <span className="text-base font-extrabold text-yellow-400">
                  ₹{whatIfResult.hourly_operational_cost_delta_inr}/hr
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Real-Time Fleet Status Data Grid */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚍</span> Real-Time Fleet Telemetry Data Grid
            </h3>
            <p className="text-xs text-gray-400">
              Live coordinates, GPS speed, passenger loads, and destination progress
            </p>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bus ID, route, stop..."
            className="w-full sm:w-64 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Bus ID</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3">Crowd Status</th>
                <th className="py-2.5 px-3">Next Stop</th>
                <th className="py-2.5 px-3 text-right">Last GPS Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {filteredBuses.map((bus) => (
                <tr key={bus.bus_id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white font-mono">{bus.bus_id}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bus.route === "A"
                          ? "badge-route-a"
                          : bus.route === "B"
                          ? "badge-route-b"
                          : "badge-route-c"
                      }`}
                    >
                      Route {bus.route}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{bus.speed} km/h</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{bus.passengers}/50</span>
                      <div className="w-16 bg-gray-700 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${Math.min(100, bus.occupancy_rate)}%` }}
                          className={`h-full ${
                            bus.occupancy_rate >= 90
                              ? "bg-red-500"
                              : bus.occupancy_rate >= 60
                              ? "bg-yellow-400"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        bus.occupancy_rate >= 90
                          ? "text-red-400 bg-red-950/40"
                          : bus.occupancy_rate >= 60
                          ? "text-yellow-400 bg-yellow-950/40"
                          : "text-emerald-400 bg-emerald-950/40"
                      }`}
                    >
                      {bus.crowd_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">{bus.next_stop_name || "En Route"}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-500">
                    {bus.last_updated ? new Date(bus.last_updated).toLocaleTimeString() : "Just now"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
