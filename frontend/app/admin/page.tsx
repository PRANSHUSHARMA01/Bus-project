"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bus as BusIcon,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
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
        viewBox={`0 0 ${width} 130`}
        style={{ width: "100%", overflow: "visible" }}
        role="img"
        aria-label={`Ridership forecast chart for Route ${routeId}`}
      >
        {data.map((d, i) => {
          const h = (d.passengers / max) * 90;
          const isPeak = d === peak;
          return (
            <g key={i}>
              <rect
                x={i * 24 + 2}
                y={100 - h}
                width={18}
                height={h}
                rx={4}
                fill={isPeak ? "var(--accent-red)" : "var(--primary)"}
                opacity={isPeak ? 1 : 0.8}
              />
              {i % 4 === 0 && (
                <text
                  x={i * 24 + 11}
                  y={120}
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
            y={92 - (peak.passengers / max) * 90}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            fill="var(--accent-red)"
            className="text-mono"
          >
            {Math.round(peak.passengers)}
          </text>
        )}
      </svg>
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

  const currentRouteColor = routes.find((r) => r.id === selectedRouteId)?.color ?? "#000";
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
        gridTemplateColumns: "minmax(0, 1fr) 380px",
        gridTemplateRows: "auto minmax(0, 1fr)",
        gap: 16,
        height: "100vh",
        padding: 16,
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* 5 Uber KPI Cards */}
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
          },
          {
            title: "On-Time Arrival",
            value: `${kpis?.on_time_pct ?? "–"}%`,
            desc: "Schedule compliance",
            icon: Clock,
          },
          {
            title: "Average Fleet Speed",
            value: `${kpis?.avg_speed_kmh ?? "–"} km/h`,
            desc: "Delhi corridor flow",
            icon: Gauge,
          },
          {
            title: "Crowded Buses",
            value: `${kpis?.crowded_buses ?? "–"}`,
            desc: ">75% capacity load",
            icon: Users,
            alert: (kpis?.crowded_buses ?? 0) > 0,
          },
          {
            title: "Boardings Today",
            value: kpis?.passengers_today?.toLocaleString() ?? "–",
            desc: "Ticketed ridership",
            icon: Activity,
          },
        ].map((kpi) => (
          <div
            key={kpi.title}
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              boxShadow: "var(--ring)",
              border: "1px solid var(--line)",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-caption" style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                {kpi.title}
              </span>
              <kpi.icon size={16} style={{ color: kpi.alert ? "var(--accent-red)" : "var(--text)" }} />
            </div>
            <div
              className="tabular-nums text-title"
              style={{
                fontSize: 26,
                margin: "6px 0 2px",
                color: kpi.alert ? "var(--accent-red)" : "var(--text)",
              }}
            >
              {kpi.value}
            </div>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>
              {kpi.desc}
            </span>
          </div>
        ))}
      </section>

      {/* Main Map Panel */}
      <section
        style={{
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          boxShadow: "var(--ring)",
          border: "1px solid var(--line)",
          minHeight: 400,
        }}
      >
        <BusMap
          routes={routes}
          buses={buses}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
        />
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 10, display: "flex", gap: 8 }}>
          <Link href="/" className="btn-pill-secondary" style={{ minHeight: 38, padding: "0 14px", fontSize: 13 }}>
            Passenger View ↗
          </Link>
          <Link href="/conductor" className="btn-pill-secondary" style={{ minHeight: 38, padding: "0 14px", fontSize: 13 }}>
            Conductor Console ↗
          </Link>
        </div>
      </section>

      {/* Control Room Sidebar */}
      <aside
        style={{
          overflowY: "auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Incident Alerts */}
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            boxShadow: "var(--ring)",
            border: "1px solid var(--line)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <b style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />
              Live Incidents
            </b>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--surface-2)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {alerts.length}
            </span>
          </div>

          <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {alerts.length === 0 && (
              <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                Zero active corridor alerts
              </span>
            )}
            {alerts.slice(0, 8).map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "var(--surface-2)",
                  borderLeft: `3px solid ${
                    a.severity === "critical"
                      ? "var(--accent-red)"
                      : a.severity === "warning"
                      ? "var(--crowd-mod)"
                      : "var(--primary)"
                  }`,
                }}
              >
                {a.message}
              </div>
            ))}
          </div>
        </section>

        {/* AI Recommendations */}
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            boxShadow: "var(--ring)",
            border: "1px solid var(--line)",
            padding: 16,
          }}
        >
          <b style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Zap size={16} />
            Fleet Balancing Advice
          </b>
          {recs.length === 0 && (
            <p className="text-caption" style={{ color: "var(--text-muted)", margin: 0 }}>
              Corridor allocation is optimal.
            </p>
          )}
          {recs.map((r) => {
            const isAccepted = acceptedRecId === `${r.from_route}-${r.to_route}`;
            return (
              <div
                key={`${r.from_route}-${r.to_route}`}
                style={{
                  background: "var(--surface-2)",
                  padding: 12,
                  borderRadius: 14,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Shift {r.buses} buses: Route {r.from_route} → Route {r.to_route}
                </div>
                <div className="text-caption" style={{ color: "var(--text-muted)", margin: "4px 0 10px" }}>
                  {r.reason}
                </div>
                <button
                  className="btn-pill-primary"
                  onClick={() => handleAcceptRecommendation(r)}
                  disabled={isAccepted}
                  style={{
                    width: "100%",
                    minHeight: 38,
                    fontSize: 13,
                    padding: "6px 12px",
                  }}
                >
                  {isAccepted ? "Reallocated ✓" : "Accept & Shift"}
                </button>
              </div>
            );
          })}
        </section>

        {/* Simulation Controls */}
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            boxShadow: "var(--ring)",
            border: "1px solid var(--line)",
            padding: 16,
          }}
        >
          <b style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Sliders size={16} />
            Simulation Actions
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
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {r.id}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-pill-secondary"
                  onClick={() => handleTriggerSimulation("jam", r.id)}
                  style={{ minHeight: 34, padding: "0 10px", fontSize: 12 }}
                >
                  Jam
                </button>
                <button
                  className="btn-pill-secondary"
                  onClick={() => handleTriggerSimulation("surge", r.id)}
                  style={{ minHeight: 34, padding: "0 10px", fontSize: 12 }}
                >
                  Surge
                </button>
                <button
                  className="btn-pill-primary"
                  onClick={() => handleTriggerSimulation("breakdown", r.id)}
                  style={{
                    minHeight: 34,
                    padding: "0 10px",
                    fontSize: 12,
                    background: "var(--accent-red)",
                    color: "#fff",
                  }}
                >
                  Break
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* 24h Ridership Forecast & What-If */}
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            boxShadow: "var(--ring)",
            border: "1px solid var(--line)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b style={{ fontSize: 15 }}>24h Demand Forecast</b>
            <div style={{ display: "flex", gap: 4 }}>
              {routes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className="btn-pill-secondary"
                  style={{
                    minHeight: 30,
                    padding: "0 8px",
                    fontSize: 11,
                    background: selectedRouteId === r.id ? "var(--primary)" : "var(--surface-2)",
                    color: selectedRouteId === r.id ? "var(--on-primary)" : "var(--text)",
                  }}
                >
                  {r.id}
                </button>
              ))}
            </div>
          </div>

          {currentForecast && (
            <>
              <div className="text-caption" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                Peak: {Math.round(currentForecast.peak.passengers)} pax/h at{" "}
                {String(currentForecast.peak.hour).padStart(2, "0")}:00 · Needed:{" "}
                {currentForecast.needed} · Assigned: {currentForecast.have}
              </div>
              <ForecastChart
                data={currentForecast.series}
                color={currentRouteColor}
                routeId={selectedRouteId}
              />
            </>
          )}

          {/* What-If Slider */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-caption" style={{ fontWeight: 700 }}>
                What-If Fleet Adjustment
              </span>
              <span className="text-caption tabular-nums" style={{ fontWeight: 700 }}>
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
            />
            {whatIfResult && (
              <div
                className="text-caption tabular-nums"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "var(--surface-2)",
                  padding: "8px 12px",
                  borderRadius: 10,
                }}
              >
                <span>Peak Load %:</span>
                <span>
                  <b>{whatIfResult.load_now_pct}%</b> →{" "}
                  <b style={{ color: whatIfResult.load_after_pct > 100 ? "var(--accent-red)" : "var(--crowd-low)" }}>
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
