"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Bus as BusIcon,
  CheckCircle2,
  Flame,
  Minus,
  Plus,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { post, usePoll } from "../../lib/api";
import { Bus, FleetItem, OCC_COLOR } from "../../lib/types";

export default function ConductorPage() {
  const fleet = usePoll<FleetItem[]>("/fleet", 5000) ?? [];
  const live = usePoll<Bus[]>("/buses/live", 1000) ?? [];
  const [busId, setBusId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmIncident, setConfirmIncident] = useState<{
    kind: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("conductor_bus_id");
      if (saved) setBusId(Number(saved));
    } catch {}
  }, []);

  const bus = live.find((b) => b.bus_id === busId);
  const item = fleet.find((f) => f.bus_id === busId);

  function handleSelectBus(id: number) {
    setBusId(id);
    try {
      localStorage.setItem("conductor_bus_id", String(id));
    } catch {}
  }

  function triggerHaptic() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  }

  async function handleAdjustPassenger(count: number) {
    if (!busId) return;
    triggerHaptic();

    // High frequency interaction: instant feedback
    await post("/ingest/boardings", [
      {
        bus_id: busId,
        boarded: count > 0 ? count : 0,
        alighted: count < 0 ? -count : 0,
      },
    ]);

    showToast(count > 0 ? `+${count} boarded` : `${count} alighted`);
  }

  async function handleConfirmReport() {
    if (!busId || !confirmIncident) return;
    triggerHaptic();

    await post("/ingest/incident", {
      bus_id: busId,
      kind: confirmIncident.kind,
      note: `Reported by conductor on ${item?.reg_no || "bus " + busId}`,
    });

    setConfirmIncident(null);
    showToast("Reported. Control room has been notified.");
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <div
      style={{
        maxWidth: 540,
        margin: "0 auto",
        padding: "16px 16px 100px",
        minHeight: "100vh",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/"
            className="pill"
            style={{ minHeight: 40, padding: "8px 12px" }}
            aria-label="Back to passenger map"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-title" style={{ margin: 0 }}>
            Conductor Console
          </h1>
        </div>
        <Link href="/" className="pill" style={{ minHeight: 40 }}>
          Passenger ↗
        </Link>
      </header>

      {/* Bus Selector Card */}
      <section className="card" style={{ marginBottom: 14 }}>
        <label
          htmlFor="bus-selector"
          className="text-caption"
          style={{ display: "block", color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}
        >
          SELECT ASSIGNED VEHICLE
        </label>
        <select
          id="bus-selector"
          value={busId ?? ""}
          onChange={(e) => handleSelectBus(Number(e.target.value))}
          style={{ width: "100%" }}
        >
          <option value="" disabled>
            Choose your bus…
          </option>
          {fleet.map((f) => (
            <option key={f.bus_id} value={f.bus_id}>
              {f.reg_no} · Route {f.route_id} ({f.route_name})
            </option>
          ))}
        </select>
        {item && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>
              Assigned corridor:
            </span>
            <span className="badge" style={{ background: "var(--accent)" }}>
              Route {item.route_id}
            </span>
          </div>
        )}
      </section>

      {/* Active Bus Telemetry & Load Ring */}
      {bus && (
        <>
          <section className="card" style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <div>
                <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                  CURRENT OCCUPANCY
                </span>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    lineHeight: 1.05,
                    color: OCC_COLOR[bus.occupancy],
                    marginTop: 2,
                  }}
                >
                  {bus.onboard}
                  <span
                    className="text-title"
                    style={{ color: "var(--text-muted)", fontWeight: 500, marginLeft: 6 }}
                  >
                    / {bus.capacity}
                  </span>
                </div>
              </div>
              <Badge
                occupancy={bus.occupancy}
                loadPct={bus.load_pct}
                label={bus.occupancy}
              />
            </div>

            {/* Giant Dynamic Capacity Bar */}
            <div
              style={{
                height: 18,
                background: "var(--surface-muted)",
                borderRadius: 999,
                overflow: "hidden",
                margin: "12px 0 8px",
                border: "1px solid var(--border-subtle)",
              }}
              role="progressbar"
              aria-valuenow={bus.onboard}
              aria-valuemin={0}
              aria-valuemax={bus.capacity}
              aria-label="Bus capacity level"
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, bus.load_pct)}%`,
                  background: OCC_COLOR[bus.occupancy],
                  borderRadius: 999,
                  transition: "width 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s ease-out",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <span className="text-caption tabular-nums" style={{ color: "var(--text-muted)" }}>
                Speed: {bus.speed_kmh} km/h
              </span>
              <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                Heading: {bus.towards}
              </span>
            </div>
          </section>

          {/* Large Thumb-Friendly Passenger Counter Buttons (>= 56px height) */}
          <section className="card" style={{ marginBottom: 14 }}>
            <span
              className="text-caption"
              style={{ display: "block", color: "var(--text-muted)", marginBottom: 10, fontWeight: 600 }}
            >
              TICKETING / PASSENGER FLOW
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={() => handleAdjustPassenger(1)}
                style={{ minHeight: 64, fontSize: 20 }}
                aria-label="Add 1 boarded passenger"
              >
                <Plus size={22} /> +1 Boarded
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleAdjustPassenger(-1)}
                style={{ minHeight: 64, fontSize: 20 }}
                aria-label="Subtract 1 alighted passenger"
              >
                <Minus size={22} /> −1 Alighted
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleAdjustPassenger(5)}
                style={{ minHeight: 58, fontSize: 18 }}
                aria-label="Add 5 boarded passengers"
              >
                <Plus size={20} /> +5 Rapid
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleAdjustPassenger(-5)}
                style={{ minHeight: 58, fontSize: 18 }}
                aria-label="Subtract 5 alighted passengers"
              >
                <Minus size={20} /> −5 Rapid
              </button>
            </div>
          </section>

          {/* Incident Reporting Section */}
          <section className="card">
            <span
              className="text-caption"
              style={{ display: "block", color: "var(--text-muted)", marginBottom: 10, fontWeight: 600 }}
            >
              INCIDENT / ASSISTANCE REPORT
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmIncident({ kind: "breakdown", label: "Breakdown" })}
                style={{
                  minHeight: 54,
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 13,
                  borderColor: "var(--border-subtle)",
                }}
              >
                <AlertOctagon size={18} style={{ color: "var(--red-600)" }} />
                Breakdown
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmIncident({ kind: "sos", label: "Emergency SOS" })}
                style={{
                  minHeight: 54,
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 13,
                  borderColor: "var(--border-subtle)",
                }}
              >
                <ShieldAlert size={18} style={{ color: "var(--red-600)" }} />
                Emergency
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmIncident({ kind: "accident", label: "Accident" })}
                style={{
                  minHeight: 54,
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 13,
                  borderColor: "var(--border-subtle)",
                }}
              >
                <AlertTriangle size={18} style={{ color: "var(--amber-600)" }} />
                Accident
              </button>
            </div>
          </section>
        </>
      )}

      {!bus && busId && (
        <div className="card" style={{ textAlign: "center", padding: "32px 16px" }}>
          <p className="text-body" style={{ color: "var(--text-muted)" }}>
            Waiting for real-time telemetry from vehicle {item?.reg_no || busId}…
          </p>
        </div>
      )}

      {/* Incident Confirmation Sheet */}
      {confirmIncident && (
        <div
          className="dialog-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={() => setConfirmIncident(null)}
        >
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title" className="text-title" style={{ margin: "0 0 10px" }}>
              Confirm {confirmIncident.label}
            </h2>
            <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Report {confirmIncident.label.toLowerCase()} for vehicle {item?.reg_no || `bus #${busId}`} to Delhi Transport Command Centre?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmIncident(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmReport}
                autoFocus
              >
                Report incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {toastMessage && (
        <div
          className="glass"
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 999,
            background: "var(--text)",
            color: "var(--surface)",
            boxShadow: "var(--ring-sheet)",
          }}
        >
          <CheckCircle2 size={16} style={{ color: "var(--crowd-low)" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
