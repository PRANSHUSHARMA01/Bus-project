"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bus as BusIcon,
  Check,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import BusMap from "../../components/BusMap";
import { post, usePoll } from "../../lib/api";
import { Alert, Bus, ForecastRoute, Kpis, Recommendation, Route } from "../../lib/types";

interface WhatIfResult {
  peak_passengers: number;
  buses_now: number;
  buses_after: number;
  load_now_pct: number;
  load_after_pct: number;
}

function ForecastChart({
  data,
  color,
  routeId,
}: {
  data: ForecastRoute["series"];
  color: string;
  routeId: string;
}) {
  const max = Math.max(...data.map((d) => d.passengers), 1);
  const peak = data.reduce((a, b) => (b.passengers > a.passengers ? b : a), data[0]);
  const width = 24 * 24;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} 140`}
        style={{ width: "100%", overflow: "visible" }}
        role="img"
        aria-label={`24 hour ridership forecast chart for Route ${routeId}`}
      >
        {data.map((d, i) => {
          const h = (d.passengers / max) * 95;
          const isPeak = d === peak;
          return (
            <g key={i}>
              <rect
                x={i * 24 + 2}
                y={105 - h}
                width={18}
                height={h}
                rx={4}
                fill={isPeak ? "var(--red-600)" : color}
                opacity={isPeak ? 1 : 0.8}
              />
              {i % 4 === 0 && (
                <text
                  x={i * 24 + 11}
                  y={126}
                  fontSize={10}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  className="text-mono"
                >
                  {String(d.hour).padStart(2, "0")}h
                </text>
              )}
            </g>
          );
        })}
        {peak && (
          <text
            x={data.indexOf(peak) * 24 + 11}
            y={98 - (peak.passengers / max) * 95}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            fill="var(--red-600)"
            className="text-mono"
          >
            {Math.round(peak.passengers)}
          </text>
        )}
      </svg>

      {/* Screen Reader Table Fallback (Accessibility 1.7 & 1.8) */}
      <table className="sr-only">
        <caption>Hourly passenger forecast for Route {routeId}</caption>
        <thead>
          <tr>
            <th scope="col">Hour</th>
            <th scope="col">Forecasted Passengers</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.hour}>
              <td>{d.hour}:00</td>
              <td>{Math.round(d.passengers)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const routes = usePoll<Route[]>("/routes", 3000) ?? [];
  const buses = usePoll<Bus[]>("/buses/live", 1000) ?? [];
  const kpis = usePoll<Kpis>("/admin/kpis", 2000);
  const alerts = usePoll<Alert[]>("/alerts", 2000) ?? [];
  const forecast = usePoll<Record<string, ForecastRoute>>("/admin/forecast", 5000);
  const recs = usePoll<Recommendation[]>("/admin/recommendations", 3000) ?? [];

  const [selectedRouteId, setSelectedRouteId] = useState("A");
  const [busesToAdd, setBusesToAdd] = useState(2);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [acceptedRecId, setAcceptedRecId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "simulation">("overview");

  const currentRouteColor = routes.find((r) => r.id === selectedRouteId)?.color ?? "#2563eb";
  const currentForecast = forecast?.[selectedRouteId];

  useEffect(() => {
    post<WhatIfResult>("/admin/whatif", {
      route_id: selectedRouteId,
      add_buses: busesToAdd,
    })
      .then(setWhatIfResult)
      .catch(() => {});
  }, [selectedRouteId, busesToAdd, forecast]);

  async function handleAcceptRecommendation(r: Recommendation) {
    await post("/admin/recommendations/accept", r);
    setAcceptedRecId(`${r.from_route}-${r.to_route}`);
    setTimeout(() => setAcceptedRecId(null), 4000);
  }

  function handleTriggerSimulation(type: string, route_id: string) {
    post("/sim/event", { type, route_id });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 390px",
        gridTemplateRows: "auto minmax(0, 1fr)",
        gap: 16,
        height: "100vh",
        padding: 16,
        background: "var(--bg)",
      }}
    >
      {/* 5 KPI CARDS with Staged Entrance (Section 1.4 & 1.7) */}
      <section
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
        aria-label="Key Performance Indicators"
      >
        {[
          {
            title: "Fleet Active",
            value: `${kpis?.active_buses ?? "–"} / ${kpis?.fleet ?? "–"}`,
            desc: "100% operational",
            icon: BusIcon,
            color: "var(--accent)",
          },
          {
            title: "On-Time Arrival",
            value: `${kpis?.on_time_pct ?? "–"}%`,
            desc: "Within 2 min schedule",
            icon: Clock,
            color: "var(--crowd-low)",
          },
          {
            title: "Average Fleet Speed",
            value: `${kpis?.avg_speed_kmh ?? "–"} km/h`,
            desc: "Urban corridor flow",
            icon: Gauge,
            color: "var(--accent)",
          },
          {
            title: "Crowded Buses",
            value: `${kpis?.crowded_buses ?? "–"}`,
            desc: ">75% capacity load",
            icon: Users,
            color: (kpis?.crowded_buses ?? 0) > 0 ? "var(--red-600)" : "var(--crowd-low)",
          },
          {
            title: "Boardings Today",
            value: kpis?.passengers_today?.toLocaleString() ?? "–",
            desc: "Total ticketed rides",
            icon: Activity,
            color: "var(--accent)",
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: idx * 0.08, duration: 0.3, ease: "easeOut" }}
            className="card"
            style={{ padding: "14px 18px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-caption" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                {kpi.title}
              </span>
              <kpi.icon size={16} style={{ color: kpi.color }} aria-hidden="true" />
            </div>
            <div
              className="tabular-nums text-title"
              style={{ fontSize: 26, margin: "6px 0 2px", color: kpi.color }}
            >
              {kpi.value}
            </div>
            <span className="text-caption" style={{ color: "var(--text-dim)" }}>
              {kpi.desc}
            </span>
          </motion.div>
        ))}
      </section>

      {/* Main Map Visualization Panel */}
      <section
        style={{
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          boxShadow: "var(--ring)",
          minHeight: 400,
        }}
        aria-label="Live fleet tracking map"
      >
        <BusMap
          routes={routes}
          buses={buses}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
        />
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 10, display: "flex", gap: 8 }}>
          <Link href="/" className="pill">
            Passenger View ↗
          </Link>
          <Link href="/conductor" className="pill">
            Conductor Console ↗
          </Link>
        </div>
      </section>

      {/* Control Room Sidebar (>= 1024px) */}
      <aside
        style={{
          overflowY: "auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
        aria-label="Operations sidebar"
      >
        {/* Live Alerts Feed (Newest First with Severity Icons) */}
        <section className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <b className="text-heading" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={17} style={{ color: "var(--amber-600)" }} />
              Live Incident Alerts
            </b>
            <span className="badge" style={{ background: "var(--surface-muted)", color: "var(--text)" }}>
              {alerts.length}
            </span>
          </div>
          <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {alerts.length === 0 && (
              <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                All corridors running normally · zero alerts
              </span>
            )}
            <AnimatePresence initial={false}>
              {alerts.slice(0, 10).map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="card"
                  style={{
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    background:
                      a.severity === "critical"
                        ? "oklch(0.55 0.2 27 / 0.12)"
                        : a.severity === "warning"
                        ? "oklch(0.65 0.16 70 / 0.12)"
                        : "var(--surface-muted)",
                    color:
                      a.severity === "critical"
                        ? "var(--red-600)"
                        : a.severity === "warning"
                        ? "var(--amber-600)"
                        : "var(--accent)",
                  }}
                >
                  {a.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* AI Fleet Allocation Recommendations */}
        <section className="card" style={{ padding: 16 }}>
          <b className="text-heading" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Zap size={17} style={{ color: "var(--accent)" }} />
            AI Fleet Allocation Advice
          </b>
          {recs.length === 0 && (
            <p className="text-caption" style={{ color: "var(--text-muted)", margin: 0 }}>
              Fleet distribution is optimal for current demand.
            </p>
          )}
          {recs.map((r) => {
            const isAccepted = acceptedRecId === `${r.from_route}-${r.to_route}`;
            return (
              <div
                key={`${r.from_route}-${r.to_route}`}
                style={{
                  background: "var(--surface-muted)",
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  Move {r.buses} buses: Route {r.from_route} → Route {r.to_route}
                </div>
                <div className="text-caption" style={{ color: "var(--text-muted)", margin: "4px 0 8px" }}>
                  {r.reason}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAcceptRecommendation(r)}
                  disabled={isAccepted}
                  style={{
                    width: "100%",
                    minHeight: 38,
                    fontSize: 13,
                    padding: "6px 12px",
                  }}
                >
                  {isAccepted ? (
                    <>
                      <CheckCircle2 size={16} /> Reallocated
                    </>
                  ) : (
                    "Accept & Reallocate"
                  )}
                </button>
              </div>
            );
          })}
        </section>

        {/* Demo Simulation Controls (Grouped in Simulation card per Section 1.7) */}
        <section className="card" style={{ padding: 16 }}>
          <b className="text-heading" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Sliders size={17} style={{ color: "var(--accent)" }} />
            Simulation Triggers
          </b>
          {routes.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span className="badge" style={{ background: r.color, width: 28, height: 28, justifyContent: "center" }}>
                {r.id}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleTriggerSimulation("jam", r.id)}
                  style={{ minHeight: 36, padding: "4px 10px", fontSize: 12 }}
                  title="Throttles buses on this route to 5-8 km/h"
                >
                  Jam
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleTriggerSimulation("surge", r.id)}
                  style={{ minHeight: 36, padding: "4px 10px", fontSize: 12 }}
                  title="Adds 20-25 passengers to bus"
                >
                  Surge
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleTriggerSimulation("breakdown", r.id)}
                  style={{ minHeight: 36, padding: "4px 10px", fontSize: 12 }}
                  title="Halts bus and triggers emergency dispatch"
                >
                  Break
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* 24-Hour Ridership Forecast & Interactive What-If Simulator */}
        <section className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <b className="text-heading">Demand Forecast (24h)</b>
            <div style={{ display: "flex", gap: 4 }}>
              {routes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className="pill"
                  style={{
                    minHeight: 32,
                    padding: "2px 10px",
                    fontSize: 12,
                    background: selectedRouteId === r.id ? r.color : "var(--surface-muted)",
                    color: selectedRouteId === r.id ? "#fff" : "var(--text)",
                  }}
                >
                  Route {r.id}
                </button>
              ))}
            </div>
          </div>

          {currentForecast && (
            <>
              <div className="text-caption" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                Peak: {Math.round(currentForecast.peak.passengers)} pax/h at{" "}
                {String(currentForecast.peak.hour).padStart(2, "0")}:00 · Buses needed:{" "}
                {currentForecast.needed} · assigned: {currentForecast.have}
              </div>
              <ForecastChart
                data={currentForecast.series}
                color={currentRouteColor}
                routeId={selectedRouteId}
              />
            </>
          )}

          {/* Interactive What-If Slider */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-caption" style={{ fontWeight: 600 }}>
                What-If Fleet Adjustment
              </span>
              <span className="text-caption tabular-nums" style={{ color: "var(--accent)", fontWeight: 700 }}>
                {busesToAdd >= 0 ? `+${busesToAdd}` : busesToAdd} buses
              </span>
            </div>
            <input
              type="range"
              min={-3}
              max={6}
              value={busesToAdd}
              onChange={(e) => setBusesToAdd(Number(e.target.value))}
              style={{ width: "100%", margin: "8px 0" }}
              aria-label="What-if bus fleet adjustment slider"
            />
            {whatIfResult && (
              <div
                className="text-caption tabular-nums"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "var(--surface-muted)",
                  padding: "8px 12px",
                  borderRadius: 10,
                }}
              >
                <span>Peak Load %:</span>
                <span>
                  <b style={{ color: whatIfResult.load_now_pct > 100 ? "var(--red-600)" : undefined }}>
                    {whatIfResult.load_now_pct}%
                  </b>{" "}
                  →{" "}
                  <b
                    style={{
                      color:
                        whatIfResult.load_after_pct > 100
                          ? "var(--red-600)"
                          : "var(--crowd-low)",
                    }}
                  >
                    {whatIfResult.load_after_pct}%
                  </b>
                </span>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
