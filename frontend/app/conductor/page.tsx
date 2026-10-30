"use client";

import React, { useState, useEffect } from "react";
import {
  fetchLiveBuses,
  fetchAlerts,
  ingestBoarding,
  triggerSosAlert,
  BusLive,
  AlertItem,
} from "../lib/api";

export default function ConductorPage() {
  const [buses, setBuses] = useState<BusLive[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>("A-01");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);
  const [sosType, setSosType] = useState<"BREAKDOWN" | "MEDICAL" | "ACCIDENT" | "SECURITY">("BREAKDOWN");
  const [sosMessage, setSosMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Poll Live Buses and Alerts
  useEffect(() => {
    const syncData = async () => {
      try {
        const [liveBuses, activeAlerts] = await Promise.all([fetchLiveBuses(), fetchAlerts()]);
        setBuses(liveBuses);
        setAlerts(activeAlerts);
      } catch (err) {
        console.error("Conductor console polling error:", err);
      }
    };

    syncData();
    const interval = setInterval(syncData, 1200);
    return () => clearInterval(interval);
  }, []);

  const currentBus = buses.find((b) => b.bus_id === selectedBusId) || buses[0];

  // 2. Rapid Passenger Count Adjustments
  const adjustPassengers = async (delta: number) => {
    if (!currentBus) return;
    const targetCount = Math.max(0, Math.min(75, currentBus.passengers + delta));

    // Optimistic local UI update
    setBuses((prev) =>
      prev.map((b) => (b.bus_id === selectedBusId ? { ...b, passengers: targetCount } : b))
    );

    try {
      await ingestBoarding({
        bus_id: selectedBusId,
        current_passengers: targetCount,
      });
    } catch (err) {
      console.error("Boarding synchronization error:", err);
    }
  };

  // 3. Dispatch Priority SOS Alert
  const handleSendSos = async () => {
    if (!sosMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await triggerSosAlert({
        bus_id: selectedBusId,
        alert_type: sosType,
        message: sosMessage,
        lat: currentBus?.lat,
        lng: currentBus?.lng,
      });
      setSosModalOpen(false);
      setSosMessage("");
      alert("🚨 SOS Emergency Alert Dispatched to Delhi Transit Central Command!");
    } catch (err) {
      alert("Failed to submit SOS alert. Check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const occupancyPct = currentBus ? Math.round((currentBus.passengers / 50) * 100) : 0;
  const isCrowded = occupancyPct >= 90;

  // Filter alerts relevant to this route
  const relevantAlerts = alerts.filter(
    (a) => a.bus_id.includes(selectedBusId) || a.route === currentBus?.route
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Console Header & Vehicle Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🎫</span> Conductor Onboard Console
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-Time Passenger Logging, Anti-Bunching Advisor & Emergency Dispatch
          </p>
        </div>

        {/* Bus Assignment Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium">Assigned Vehicle:</label>
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white font-bold rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {buses.map((b) => (
              <option key={b.bus_id} value={b.bus_id}>
                {b.bus_id} (Route {b.route})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Relevant Alerts Notification Bar */}
      {relevantAlerts.length > 0 && (
        <div className="space-y-2">
          {relevantAlerts.map((a) => (
            <div
              key={a.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                a.type === "BUNCHING"
                  ? "bg-yellow-950/40 border-yellow-700/60 text-yellow-300"
                  : a.type === "SOS"
                  ? "bg-red-950/60 border-red-600 text-red-200"
                  : "bg-orange-950/40 border-orange-700/60 text-orange-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{a.type === "BUNCHING" ? "⚠️" : "🚨"}</span>
                <span>{a.message}</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{a.timestamp}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Passenger Counter Card */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Load</span>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1">
              {currentBus?.passengers || 0}{" "}
              <span className="text-lg font-medium text-gray-400">/ 50 Seats</span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isCrowded
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : occupancyPct >= 60
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              {currentBus?.crowd_status || "Normal"}
            </span>
            <p className="text-xs text-gray-400 mt-1">{occupancyPct}% of nominal capacity</p>
          </div>
        </div>

        {/* Dynamic Capacity Progress Bar */}
        <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden p-0.5 border border-gray-700">
          <div
            style={{ width: `${Math.min(100, occupancyPct)}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              isCrowded ? "bg-red-500" : occupancyPct >= 60 ? "bg-yellow-400" : "bg-emerald-500"
            }`}
          />
        </div>

        {/* Rapid Touch Counter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={() => adjustPassengers(1)}
            className="h-16 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-lg rounded-xl shadow-lg transition-transform flex flex-col items-center justify-center cursor-pointer"
          >
            <span>+1 Board</span>
            <span className="text-[10px] font-normal text-blue-200">Single Passenger</span>
          </button>
          <button
            onClick={() => adjustPassengers(-1)}
            className="h-16 bg-gray-800 hover:bg-gray-700 active:scale-95 text-white font-extrabold text-lg rounded-xl border border-gray-700 transition-transform flex flex-col items-center justify-center cursor-pointer"
          >
            <span>-1 Alight</span>
            <span className="text-[10px] font-normal text-gray-400">Single Passenger</span>
          </button>
          <button
            onClick={() => adjustPassengers(5)}
            className="h-16 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-lg rounded-xl shadow-lg transition-transform flex flex-col items-center justify-center cursor-pointer"
          >
            <span>+5 Group</span>
            <span className="text-[10px] font-normal text-indigo-200">Terminal Stop</span>
          </button>
          <button
            onClick={() => adjustPassengers(-5)}
            className="h-16 bg-gray-800 hover:bg-gray-700 active:scale-95 text-white font-extrabold text-lg rounded-xl border border-gray-700 transition-transform flex flex-col items-center justify-center cursor-pointer"
          >
            <span>-5 Group</span>
            <span className="text-[10px] font-normal text-gray-400">Terminal Stop</span>
          </button>
        </div>
      </div>

      {/* Emergency Trigger & Driver Advisory Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Anti-Bunching Advisor Card */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-blue-500">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>⏱️</span> Headway & Bunching Advisor
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            Target corridor spacing is <strong>8 minutes</strong>. If trailing vehicle is within 500m,
            the system advises holding at stop for 60-90 seconds to restore proper headway.
          </p>
        </div>

        {/* SOS Emergency Trigger Button */}
        <div className="glass-panel p-5 flex flex-col justify-between space-y-3 border-l-4 border-l-red-500">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🚨</span> Priority Emergency Action
            </h4>
            <p className="text-xs text-gray-300">
              Immediate broadcast for mechanical breakdown, accident, or medical hazard.
            </p>
          </div>
          <button
            onClick={() => setSosModalOpen(true)}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-lg shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            Trigger Emergency SOS
          </button>
        </div>
      </div>

      {/* SOS Modal Dialog */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-4 border border-red-500/50 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-black text-red-400 flex items-center gap-2">
                <span>🚨</span> Transmit SOS Emergency
              </h3>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-semibold block mb-1">
                  Incident Category:
                </label>
                <select
                  value={sosType}
                  onChange={(e: any) => setSosType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white font-bold"
                >
                  <option value="BREAKDOWN">Mechanical Breakdown (Engine/Flat Tire)</option>
                  <option value="MEDICAL">Medical Emergency (Commuter Assistance)</option>
                  <option value="ACCIDENT">Road Collision / Traffic Accident</option>
                  <option value="SECURITY">Security / Disturbance Incident</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-semibold block mb-1">
                  Incident Details & Landmark:
                </label>
                <textarea
                  rows={3}
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  placeholder="e.g. Engine overheating near Sadar Bazaar flyover; right lane blocked."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSosModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !sosMessage.trim()}
                onClick={handleSendSos}
                className="px-5 py-2 rounded-lg text-xs font-black uppercase bg-red-600 hover:bg-red-500 text-white shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Transmitting..." : "Broadcast SOS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
