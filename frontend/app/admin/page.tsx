"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

function Chart({ data, color }: { data: ForecastRoute["series"]; color: string }) {
  const max = Math.max(...data.map((d) => d.passengers), 1);
  const peak = data.reduce((a, b) => (b.passengers > a.passengers ? b : a), data[0]);
  const w = 24 * 26;

  return (
    <svg viewBox={`0 0 ${w} 150`} style={{ width: "100%" }}>
      {data.map((d, i) => {
        const h = (d.passengers / max) * 105;
        return (
          <g key={i}>
            <rect
              x={i * 26 + 3}
              y={115 - h}
              width={20}
              height={h}
              rx={5}
              fill={d === peak ? "#dc2626" : color}
              opacity={d === peak ? 1 : 0.75}
            />
            {i % 3 === 0 && (
              <text
                x={i * 26 + 13}
                y={138}
                fontSize={11}
                textAnchor="middle"
                fill="#64748b"
              >
                {String(d.hour).padStart(2, "0")}h
              </text>
            )}
          </g>
        );
      })}
      {peak && (
        <text
          x={data.indexOf(peak) * 26 + 13}
          y={108 - (peak.passengers / max) * 105}
          fontSize={11}
          fontWeight={700}
          textAnchor="middle"
          fill="#dc2626"
        >
          {Math.round(peak.passengers)}
        </text>
      )}
    </svg>
  );
}

export default function Admin() {
  const routes = usePoll<Route[]>("/routes", 3000) ?? [];
  const buses = usePoll<Bus[]>("/buses/live", 1000) ?? [];
  const kpis = usePoll<Kpis>("/admin/kpis", 2000);
  const alerts = usePoll<Alert[]>("/alerts", 2000) ?? [];
  const forecast = usePoll<Record<string, ForecastRoute>>("/admin/forecast", 5000);
  const recs = usePoll<Recommendation[]>("/admin/recommendations", 3000) ?? [];

  const [rid, setRid] = useState("A");
  const [add, setAdd] = useState(2);
  const [what, setWhat] = useState<WhatIfResult | null>(null);

  const color = routes.find((r) => r.id === rid)?.color ?? "#2563eb";
  const f = forecast?.[rid];

  useEffect(() => {
    post<WhatIfResult>("/admin/whatif", { route_id: rid, add_buses: add })
      .then(setWhat)
      .catch(() => {});
  }, [rid, add, forecast]);

  const accept = (r: Recommendation) => post("/admin/recommendations/accept", r);
  const fire = (type: string, route_id: string) => post("/sim/event", { type, route_id });

  return (
    <div className="admin">
      <div className="kpis">
        <div className="kpi">
          <b>
            {kpis?.active_buses ?? "–"}
            <span> / {kpis?.fleet ?? "–"}</span>
          </b>
          <span>Buses live</span>
        </div>
        <div className="kpi">
          <b>{kpis?.on_time_pct ?? "–"}%</b>
          <span>Running on time</span>
        </div>
        <div className="kpi">
          <b>
            {kpis?.avg_speed_kmh ?? "–"}
            <span> km/h</span>
          </b>
          <span>Average speed</span>
        </div>
        <div className="kpi">
          <b style={{ color: (kpis?.crowded_buses ?? 0) > 0 ? "#dc2626" : undefined }}>
            {kpis?.crowded_buses ?? "–"}
          </b>
          <span>Crowded buses (&gt;75%)</span>
        </div>
        <div className="kpi">
          <b>{kpis?.passengers_today?.toLocaleString() ?? "–"}</b>
          <span>Boardings today</span>
        </div>
      </div>

      <div className="mapbox">
        <BusMap
          routes={routes}
          buses={buses}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
        />
        <Link
          href="/"
          className="pill"
          style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}
        >
          Passenger ↗
        </Link>
        <Link
          href="/conductor"
          className="pill"
          style={{ position: "absolute", top: 12, left: 130, zIndex: 10 }}
        >
          Conductor ↗
        </Link>
      </div>

      <div className="side">
        <div className="card" style={{ margin: 0 }}>
          <b>⚠️ Live alerts</b>
          <div style={{ marginTop: 10, maxHeight: 120, overflow: "auto" }}>
            {alerts.length === 0 && <span className="muted">All clear</span>}
            {alerts.slice(0, 8).map((a) => (
              <div key={a.id} className={"alert " + a.severity}>
                {a.message}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <b>🤖 Fleet allocation advice</b>
          {recs.length === 0 && (
            <p className="muted" style={{ marginTop: 8 }}>Fleet matches forecast demand.</p>
          )}
          {recs.map((r) => (
            <div key={r.from_route + r.to_route} style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700 }}>
                Move {r.buses} bus{r.buses > 1 ? "es" : ""}: Route {r.from_route} → Route {r.to_route}
              </div>
              <div className="muted" style={{ margin: "4px 0 8px" }}>
                {r.reason}
              </div>
              <button className="act go" onClick={() => accept(r)}>
                Accept
              </button>
            </div>
          ))}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <b>🎮 Demo controls</b>
          <p className="muted" style={{ margin: "4px 0 8px" }}>
            Trigger a real-time scenario on a route.
          </p>
          {routes.map((r) => (
            <div key={r.id} style={{ marginBottom: 4 }}>
              <span className="muted" style={{ display: "inline-block", width: 52 }}>
                Route {r.id}
              </span>
              <button className="act" onClick={() => fire("jam", r.id)}>
                Traffic jam
              </button>
              <button className="act" onClick={() => fire("surge", r.id)}>
                Crowd surge
              </button>
              <button className="act" onClick={() => fire("breakdown", r.id)}>
                Breakdown
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ gridColumn: "1 / 3", margin: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <b>📈 Demand forecast, next 24 hours</b>
          <div className="tabs">
            {routes.map((r) => (
              <button
                key={r.id}
                className={r.id === rid ? "on" : ""}
                onClick={() => setRid(r.id)}
              >
                Route {r.id}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 20,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          {f ? <Chart data={f.series} color={color} /> : <span className="muted">Loading…</span>}
          <div>
            {f && (
              <p style={{ margin: "0 0 8px" }}>
                Peak <b>{Math.round(f.peak.passengers)}</b> passengers/hour at{" "}
                <b>{String(f.peak.hour).padStart(2, "0")}:00</b>.<br />
                Buses needed: <b>{f.needed}</b> · assigned: <b>{f.have}</b>
              </p>
            )}
            <div className="muted">
              What if we add <b>{add >= 0 ? "+" : ""}{add}</b> buses?
            </div>
            <input
              type="range"
              min={-3}
              max={4}
              value={add}
              onChange={(e) => setAdd(Number(e.target.value))}
              style={{ width: "100%", margin: "6px 0" }}
            />
            {what && (
              <div style={{ fontVariantNumeric: "tabular-nums" }}>
                Load at peak:{" "}
                <b
                  style={{
                    color: what.load_now_pct > 100 ? "#dc2626" : undefined,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {what.load_now_pct}%
                </b>{" "}
                →{" "}
                <b
                  style={{
                    color: what.load_after_pct > 100 ? "#dc2626" : "#16a34a",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {what.load_after_pct}%
                </b>
              </div>
            )}
            {kpis?.model?.mae_model !== undefined && (
              <div className="muted" style={{ marginTop: 8 }}>
                Model error: ±{kpis.model.mae_model} passengers/hour (held-out week)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
