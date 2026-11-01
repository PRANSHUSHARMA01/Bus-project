"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShieldAlert,
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
      note: `Reported by conductor on vehicle ${item?.reg_no || busId}`,
    });

    setConfirmIncident(null);
    showToast("Incident logged with Control Room.");
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "16px 20px 100px",
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            className="btn-pill-secondary"
            style={{ width: 44, height: 44, padding: 0, minHeight: 44 }}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-title" style={{ margin: 0, fontSize: 22 }}>
            Conductor
          </h1>
        </div>
        <Link href="/" className="btn-pill-secondary" style={{ minHeight: 40, padding: "0 14px", fontSize: 13 }}>
          Passenger ↗
        </Link>
      </header>

      {/* Vehicle Selector Card */}
      <section
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          boxShadow: "var(--ring)",
          padding: 18,
          border: "1px solid var(--line)",
          marginBottom: 16,
        }}
      >
        <span
          className="text-caption"
          style={{
            display: "block",
            color: "var(--text-muted)",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Assigned Bus
        </span>
        <select
          value={busId ?? ""}
          onChange={(e) => handleSelectBus(Number(e.target.value))}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "var(--surface-2)",
            color: "var(--text)",
            padding: "0 14px",
            fontSize: 15,
            fontWeight: 600,
            outline: 0,
          }}
        >
          <option value="" disabled>
            Select your bus…
          </option>
          {fleet.map((f) => (
            <option key={f.bus_id} value={f.bus_id}>
              {f.reg_no} · Route {f.route_id} ({f.route_name})
            </option>
          ))}
        </select>
      </section>

      {/* Active Telemetry & Huge Load Display */}
      {bus && (
        <>
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              boxShadow: "var(--ring)",
              padding: 22,
              border: "1px solid var(--line)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  className="text-caption"
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Onboard Count
                </span>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 56,
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: "6px 0 2px",
                  }}
                >
                  {bus.onboard}
                  <span style={{ fontSize: 22, color: "var(--text-muted)", fontWeight: 500, marginLeft: 6 }}>
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

            {/* Uber-style Clean Capacity Bar */}
            <div
              style={{
                height: 14,
                background: "var(--surface-2)",
                borderRadius: 999,
                overflow: "hidden",
                margin: "16px 0 10px",
              }}
              role="progressbar"
              aria-valuenow={bus.onboard}
              aria-valuemin={0}
              aria-valuemax={bus.capacity}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, bus.load_pct)}%`,
                  background:
                    bus.occupancy === "High"
                      ? "var(--accent-red)"
                      : bus.occupancy === "Moderate"
                      ? "var(--crowd-mod)"
                      : "var(--primary)",
                  borderRadius: 999,
                  transition: "width 0.25s ease-out",
                }}
              />
            </div>

            <div
              className="text-caption tabular-nums"
              style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}
            >
              <span>{bus.speed_kmh} km/h</span>
              <span>Heading towards {bus.towards}</span>
            </div>
          </section>

          {/* Large Black Pill Counter Buttons (>= 56px height) */}
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              boxShadow: "var(--ring)",
              padding: 18,
              border: "1px solid var(--line)",
              marginBottom: 16,
            }}
          >
            <span
              className="text-caption"
              style={{
                display: "block",
                color: "var(--text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Rapid Ticketing / Boarding
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                className="btn-pill-primary"
                onClick={() => handleAdjustPassenger(1)}
                style={{ minHeight: 64, fontSize: 19 }}
              >
                <Plus size={22} /> +1 Boarded
              </button>
              <button
                className="btn-pill-secondary"
                onClick={() => handleAdjustPassenger(-1)}
                style={{ minHeight: 64, fontSize: 19 }}
              >
                <Minus size={22} /> −1 Alighted
              </button>
              <button
                className="btn-pill-primary"
                onClick={() => handleAdjustPassenger(5)}
                style={{ minHeight: 56, fontSize: 17 }}
              >
                <Plus size={20} /> +5 Rapid
              </button>
              <button
                className="btn-pill-secondary"
                onClick={() => handleAdjustPassenger(-5)}
                style={{ minHeight: 56, fontSize: 17 }}
              >
                <Minus size={20} /> −5 Rapid
              </button>
            </div>
          </section>

          {/* Incident Report Actions (Grey Pills) */}
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              boxShadow: "var(--ring)",
              padding: 18,
              border: "1px solid var(--line)",
            }}
          >
            <span
              className="text-caption"
              style={{
                display: "block",
                color: "var(--text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Assistance & Incidents
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <button
                className="btn-pill-secondary"
                onClick={() => setConfirmIncident({ kind: "breakdown", label: "Breakdown" })}
                style={{
                  minHeight: 52,
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <AlertOctagon size={18} style={{ color: "var(--accent-red)" }} />
                Breakdown
              </button>
              <button
                className="btn-pill-secondary"
                onClick={() => setConfirmIncident({ kind: "sos", label: "Emergency SOS" })}
                style={{
                  minHeight: 52,
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <ShieldAlert size={18} style={{ color: "var(--accent-red)" }} />
                Emergency
              </button>
              <button
                className="btn-pill-secondary"
                onClick={() => setConfirmIncident({ kind: "accident", label: "Accident" })}
                style={{
                  minHeight: 52,
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <AlertTriangle size={18} style={{ color: "var(--crowd-mod)" }} />
                Accident
              </button>
            </div>
          </section>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmIncident && (
        <div
          className="dialog-backdrop"
          onClick={() => setConfirmIncident(null)}
        >
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <b className="text-title" style={{ fontSize: 18, display: "block", marginBottom: 10 }}>
              Confirm {confirmIncident.label}
            </b>
            <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Report {confirmIncident.label.toLowerCase()} for vehicle {item?.reg_no || busId} to Central Control Room?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn-pill-secondary"
                onClick={() => setConfirmIncident(null)}
              >
                Cancel
              </button>
              <button
                className="btn-pill-primary"
                style={{ background: "var(--accent-red)", color: "#fff" }}
                onClick={handleConfirmReport}
                autoFocus
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--primary)",
            color: "var(--on-primary)",
            padding: "10px 20px",
            borderRadius: 999,
            boxShadow: "var(--ring-elevated)",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
