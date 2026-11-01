"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { post, usePoll } from "../../lib/api";
import { Bus, FleetItem, OCC_COLOR } from "../../lib/types";

export default function Conductor() {
  const fleet = usePoll<FleetItem[]>("/fleet", 5000) ?? [];
  const live = usePoll<Bus[]>("/buses/live", 1000) ?? [];
  const [busId, setBusId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      const v = localStorage.getItem("busId");
      if (v) setBusId(Number(v));
    } catch {}
  }, []);

  const bus = live.find((b) => b.bus_id === busId);
  const item = fleet.find((f) => f.bus_id === busId);

  function choose(id: number) {
    setBusId(id);
    try {
      localStorage.setItem("busId", String(id));
    } catch {}
  }

  async function adjust(n: number) {
    if (!busId) return;
    await post("/ingest/boardings", [
      { bus_id: busId, boarded: n > 0 ? n : 0, alighted: n < 0 ? -n : 0 },
    ]);
    flash(n > 0 ? `+${n} boarded` : `${n} alighted`);
  }

  async function report(kind: string, label: string) {
    if (!busId) return;
    await post("/ingest/incident", {
      bus_id: busId,
      kind,
      note: "Reported from conductor app",
    });
    flash(label + " reported to control room ✓");
  }

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <div className="wrap">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: "6px 0 14px" }}>🎫 Conductor</h2>
        <Link href="/" className="pill">
          Passenger ↗
        </Link>
      </div>

      <div className="card">
        <select
          value={busId ?? ""}
          onChange={(e) => choose(Number(e.target.value))}
        >
          <option value="" disabled>
            Select your bus…
          </option>
          {fleet.map((f) => (
            <option key={f.bus_id} value={f.bus_id}>
              {f.reg_no} · Route {f.route_id}
            </option>
          ))}
        </select>
        {item && (
          <p className="muted" style={{ marginBottom: 0, marginTop: 8 }}>
            Route {item.route_id}: {item.route_name}
          </p>
        )}
      </div>

      {bus && (
        <>
          <div className="card">
            <div className="muted">Passengers on board</div>
            <div className="big" style={{ color: OCC_COLOR[bus.occupancy] }}>
              {bus.onboard}
              <span className="muted" style={{ fontSize: 24 }}> / {bus.capacity}</span>
            </div>
            <div className="bar" style={{ margin: "12px 0 6px" }}>
              <i
                style={{
                  width: Math.min(100, bus.load_pct) + "%",
                  background: OCC_COLOR[bus.occupancy],
                }}
              />
            </div>
            <b style={{ color: OCC_COLOR[bus.occupancy] }}>
              {bus.occupancy} · {bus.load_pct}%
            </b>
            <span className="muted">
              {" "}· {bus.speed_kmh} km/h · towards {bus.towards}
            </span>
          </div>

          <div className="card">
            <div className="btns">
              <button className="btn" onClick={() => adjust(1)}>
                +1 Boarded
              </button>
              <button className="btn minus" onClick={() => adjust(-1)}>
                −1 Got off
              </button>
              <button className="btn" onClick={() => adjust(5)}>
                +5
              </button>
              <button className="btn minus" onClick={() => adjust(-5)}>
                −5
              </button>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <button
                className="btn red"
                onClick={() => report("breakdown", "Breakdown")}
              >
                💥 Breakdown
              </button>
              <button
                className="btn red"
                onClick={() => report("sos", "Emergency")}
              >
                🚨 Emergency
              </button>
              <button
                className="btn amber"
                onClick={() => report("accident", "Accident")}
              >
                ⚠ Accident
              </button>
            </div>
          </div>
        </>
      )}

      {!bus && busId && (
        <p className="muted">Waiting for GPS from this bus…</p>
      )}

      {msg && (
        <div
          className="pill"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            color: "#fff",
            zIndex: 100,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
