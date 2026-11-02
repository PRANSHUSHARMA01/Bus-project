"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Disc,
  IndianRupee,
  LogOut,
  Minus,
  Navigation,
  Plus,
  QrCode,
  Radio,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { API, post, usePoll } from "../../lib/api";
import { Bus, FleetItem } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";

export default function ConductorPage() {
  const { user, token, signOut } = useAuth();
  const fleet = usePoll<FleetItem[]>("/fleet", 5000) ?? [];
  const live = usePoll<Bus[]>("/buses/live", 1000) ?? [];

  // Conductor Staff Gate State
  const [staffIdInput, setStaffIdInput] = useState("DTC-4021");
  const [pinInput, setPinInput] = useState("1234");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Duty State
  const [busId, setBusId] = useState<number | null>(null);
  const [activeDuty, setActiveDuty] = useState<any>(null);
  const [isStartingDuty, setIsStartingDuty] = useState(false);

  // Ticketing Counter State
  const [selectedFare, setSelectedFare] = useState<number>(10);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");
  const [shiftStats, setShiftStats] = useState({
    total_tickets: 0,
    total_collection: 0,
    cash_collection: 0,
    upi_collection: 0,
  });

  // Incident & UI State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmIncident, setConfirmIncident] = useState<{
    kind: string;
    label: string;
  } | null>(null);

  const isConductor =
    user?.role === "conductor" ||
    user?.role === "admin" ||
    (typeof window !== "undefined" &&
      (() => {
        try {
          const u = JSON.parse(localStorage.getItem("smart_bus_user") || "{}");
          return u.role === "conductor" || u.role === "admin";
        } catch {
          return false;
        }
      })());

  // Check saved bus
  useEffect(() => {
    try {
      const saved = localStorage.getItem("conductor_bus_id");
      if (saved) {
        setBusId(Number(saved));
      } else if (fleet.length > 0 && busId === null) {
        setBusId(fleet[0].bus_id);
      }
    } catch {}
  }, [fleet, busId]);

  // Load active duty and shift stats
  const fetchDutyStats = async () => {
    if (!token && !document.cookie.includes("access_token")) return;
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/v1/conductor/duty/active`, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDuty(data.active_duty);
        if (data.stats) {
          setShiftStats(data.stats);
        }
        if (data.active_duty && data.active_duty.bus_id) {
          setBusId(data.active_duty.bus_id);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isConductor) {
      fetchDutyStats();
    }
  }, [isConductor, token]);

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

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Staff PIN Login
  async function handlePinLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API}/v1/conductor/auth/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staff_id: staffIdInput.trim(),
          pin: pinInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || "Invalid Staff ID or PIN");
        setIsLoggingIn(false);
        return;
      }
      // Save in localStorage for auth context hydration
      localStorage.setItem("smart_bus_token", data.access_token);
      localStorage.setItem("smart_bus_user", JSON.stringify(data.user));
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate conductor");
      setIsLoggingIn(false);
    }
  }

  // Duty Toggle
  async function handleToggleDuty() {
    if (!busId) {
      showToast("Please select a bus first");
      return;
    }
    triggerHaptic();
    setIsStartingDuty(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (activeDuty) {
        // End Duty
        const res = await fetch(`${API}/v1/conductor/duty/end`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({}),
        });
        if (res.ok) {
          setActiveDuty(null);
          showToast("Duty Shift Ended.");
        }
      } else {
        // Start Duty
        const res = await fetch(`${API}/v1/conductor/duty/start`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ bus_id: busId }),
        });
        if (res.ok) {
          const duty = await res.json();
          setActiveDuty(duty);
          showToast(`Duty Started on Bus ${item?.reg_no || busId}`);
        }
      }
      fetchDutyStats();
    } catch {
      showToast("Duty update failed. Check connection.");
    } finally {
      setIsStartingDuty(false);
    }
  }

  // Rapid Boarding Adjustments (+1 / -1)
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

  // Crowd Presets (Empty, Seats Free, Standing, Packed)
  async function handleSetLoadPreset(preset: "empty" | "seats_free" | "standing" | "packed") {
    if (!busId) return;
    triggerHaptic();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/v1/conductor/load/preset`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ bus_id: busId, preset }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Crowd updated: ${preset.replace("_", " ").toUpperCase()} (${data.onboard} onboard)`);
      }
    } catch {
      showToast("Failed to update preset load.");
    }
  }

  // Issue Ticket (Cash / UPI)
  async function handleIssueTicket() {
    if (!busId) return;
    triggerHaptic();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/v1/conductor/ticket`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          bus_id: busId,
          fare: selectedFare,
          payment_method: paymentMode,
          stop_id: bus?.towards || undefined,
        }),
      });

      if (res.ok) {
        showToast(`Ticket ₹${selectedFare} (${paymentMode.toUpperCase()}) Issued!`);
        fetchDutyStats();
      } else {
        showToast("Error issuing ticket.");
      }
    } catch {
      showToast("Connection error while issuing ticket.");
    }
  }

  // Incident Dispatch
  async function handleConfirmReport() {
    if (!busId || !confirmIncident) return;
    triggerHaptic();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API}/v1/conductor/incident`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          bus_id: busId,
          kind: confirmIncident.kind,
          note: `Reported by conductor on vehicle ${item?.reg_no || busId}`,
        }),
      });

      setConfirmIncident(null);
      showToast(`Incident logged: ${confirmIncident.label}`);
    } catch {
      showToast("Incident report failed.");
    }
  }

  // One-Tap Driver SOS
  async function handleDriverSOS() {
    if (!busId) return;
    triggerHaptic();
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API}/v1/conductor/incident`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          bus_id: busId,
          kind: "sos",
          note: "EMERGENCY: One-tap driver SOS triggered from cabin!",
        }),
      });
      showToast("CRITICAL: Driver SOS Dispatched to Police & Central Control Room!");
    } catch {
      showToast("Failed to dispatch SOS.");
    }
  }

  // -------------------------------------------------------------
  // Render Staff PIN Gate if not logged in as Conductor/Admin
  // -------------------------------------------------------------
  if (!isConductor) {
    return (
      <div
        style={{
          maxWidth: 440,
          margin: "0 auto",
          padding: "24px 20px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "var(--ring)",
            }}
          >
            <Radio size={32} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-title" style={{ fontSize: 24, margin: "0 0 6px" }}>
            Conductor & Driver Portal
          </h1>
          <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Delhi Transport Corporation · Vehicle Operations
          </p>
        </div>

        <form
          onSubmit={handlePinLogin}
          style={{
            background: "var(--surface)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "var(--ring)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Staff Badge ID / परिचालक आईडी
            </label>
            <input
              type="text"
              value={staffIdInput}
              onChange={(e) => setStaffIdInput(e.target.value)}
              placeholder="e.g. DTC-4021"
              required
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: "0 14px",
                fontSize: 16,
                background: "var(--surface-2)",
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              4-Digit Duty PIN / पिन कोड
            </label>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              required
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: "0 14px",
                fontSize: 18,
                letterSpacing: 4,
                background: "var(--surface-2)",
                color: "var(--text)",
                outline: "none",
              }}
            />
            <p style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 6, marginInlineStart: 2 }}>
              Default access: Badge <strong>DTC-4021</strong> or <strong>DEMO</strong> &bull; PIN <strong>1234</strong> or <strong>demo</strong>
            </p>
          </div>

          {authError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--accent-red)",
                fontSize: 13,
              }}
            >
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="btn-pill-primary"
            style={{ height: 50, fontSize: 16, fontWeight: 600, marginTop: 4 }}
          >
            {isLoggingIn ? "Verifying Duty PIN…" : "Authenticate & Start Duty"}
          </button>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
              ← Return to Passenger Dashboard
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Conductor Operations Dashboard
  // -------------------------------------------------------------
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
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            className="btn-pill-secondary"
            style={{ width: 40, height: 40, padding: 0, minHeight: 40 }}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-title" style={{ margin: 0, fontSize: 20 }}>
              Crew Portal
            </h1>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {user?.full_name || "DTC Crew"}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            signOut();
            window.location.reload();
          }}
          className="btn-pill-secondary"
          style={{ height: 36, padding: "0 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
        >
          <LogOut size={14} /> End Session
        </button>
      </header>

      {/* 1. Duty Shift Status & Vehicle Assignment */}
      <section
        style={{
          background: activeDuty ? "rgba(16, 185, 129, 0.08)" : "var(--surface)",
          borderRadius: 20,
          boxShadow: "var(--ring)",
          padding: 18,
          border: activeDuty ? "1.5px solid var(--accent-green)" : "1px solid var(--line)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: activeDuty ? "var(--accent-green)" : "var(--text-muted)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {activeDuty ? "Duty Active · Shift Live" : "Duty Inactive"}
            </span>
          </div>

          <button
            onClick={handleToggleDuty}
            disabled={isStartingDuty}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeDuty ? "var(--accent-red)" : "var(--accent-green)",
              color: "#fff",
            }}
          >
            {activeDuty ? "End Duty" : "Start Shift"}
          </button>
        </div>

        <select
          value={busId ?? ""}
          onChange={(e) => handleSelectBus(Number(e.target.value))}
          disabled={!!activeDuty}
          style={{
            width: "100%",
            height: 46,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "var(--surface-2)",
            color: "var(--text)",
            padding: "0 14px",
            fontSize: 14,
            fontWeight: 600,
            outline: 0,
            opacity: activeDuty ? 0.8 : 1,
          }}
        >
          <option value="" disabled>
            Select vehicle…
          </option>
          {fleet.map((f) => (
            <option key={f.bus_id} value={f.bus_id}>
              {f.reg_no} · Route {f.route_id} ({f.route_name})
            </option>
          ))}
        </select>
      </section>

      {/* 2. Active Telemetry & Giant Load Counter */}
      {bus && (
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 20,
            boxShadow: "var(--ring)",
            padding: 20,
            border: "1px solid var(--line)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                Onboard Passengers
              </span>
              <div
                className="tabular-nums"
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  lineHeight: 1,
                  margin: "4px 0 2px",
                }}
              >
                {bus.onboard}
                <span style={{ fontSize: 20, color: "var(--text-muted)", fontWeight: 500, marginLeft: 6 }}>
                  / {bus.capacity}
                </span>
              </div>
            </div>
            <Badge occupancy={bus.occupancy} loadPct={bus.load_pct} label={bus.occupancy} />
          </div>

          {/* Clean Capacity Progress Bar */}
          <div
            style={{
              height: 12,
              background: "var(--surface-2)",
              borderRadius: 999,
              overflow: "hidden",
              margin: "14px 0 10px",
            }}
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
            className="tabular-nums"
            style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 12 }}
          >
            <span>{bus.speed_kmh} km/h</span>
            <span>Heading towards {bus.towards}</span>
          </div>

          {/* Crowd Presets */}
          <div style={{ marginTop: 16 }}>
            <span
              style={{
                display: "block",
                color: "var(--text-muted)",
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Crowd Presets
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              <button
                onClick={() => handleSetLoadPreset("empty")}
                className="btn-pill-secondary"
                style={{ padding: "8px 4px", fontSize: 11, fontWeight: 600, minHeight: 36 }}
              >
                Empty
              </button>
              <button
                onClick={() => handleSetLoadPreset("seats_free")}
                className="btn-pill-secondary"
                style={{ padding: "8px 4px", fontSize: 11, fontWeight: 600, minHeight: 36 }}
              >
                Seats Free
              </button>
              <button
                onClick={() => handleSetLoadPreset("standing")}
                className="btn-pill-secondary"
                style={{ padding: "8px 4px", fontSize: 11, fontWeight: 600, minHeight: 36 }}
              >
                Standing
              </button>
              <button
                onClick={() => handleSetLoadPreset("packed")}
                className="btn-pill-secondary"
                style={{ padding: "8px 4px", fontSize: 11, fontWeight: 600, minHeight: 36 }}
              >
                Packed
              </button>
            </div>
          </div>

          {/* Quick Boarding Increments */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <button
              className="btn-pill-primary"
              onClick={() => handleAdjustPassenger(1)}
              style={{ minHeight: 52, fontSize: 17 }}
            >
              <Plus size={20} /> +1 Boarded
            </button>
            <button
              className="btn-pill-secondary"
              onClick={() => handleAdjustPassenger(-1)}
              style={{ minHeight: 52, fontSize: 17 }}
            >
              <Minus size={20} /> −1 Alighted
            </button>
          </div>
        </section>
      )}

      {/* 3. Conductor Cash / UPI Ticketing Counter */}
      <section
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          boxShadow: "var(--ring)",
          padding: 20,
          border: "1px solid var(--line)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span
            style={{
              color: "var(--text-muted)",
              fontWeight: 700,
              fontSize: 12,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IndianRupee size={15} /> Ticketing Machine
          </span>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
            Shift: ₹{shiftStats.total_collection} ({shiftStats.total_tickets} tix)
          </div>
        </div>

        {/* Fare Stage Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[5, 10, 15, 25].map((fare) => (
            <button
              key={fare}
              onClick={() => setSelectedFare(fare)}
              style={{
                height: 44,
                borderRadius: 12,
                border: selectedFare === fare ? "2px solid var(--accent)" : "1px solid var(--line)",
                background: selectedFare === fare ? "var(--surface-2)" : "transparent",
                color: selectedFare === fare ? "var(--accent)" : "var(--text)",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ₹{fare}
            </button>
          ))}
        </div>

        {/* Payment Method Toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => setPaymentMode("cash")}
            style={{
              height: 42,
              borderRadius: 12,
              border: paymentMode === "cash" ? "2px solid var(--accent)" : "1px solid var(--line)",
              background: paymentMode === "cash" ? "var(--surface-2)" : "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Banknote size={16} /> Cash (नकद)
          </button>
          <button
            onClick={() => setPaymentMode("upi")}
            style={{
              height: 42,
              borderRadius: 12,
              border: paymentMode === "upi" ? "2px solid var(--accent)" : "1px solid var(--line)",
              background: paymentMode === "upi" ? "var(--surface-2)" : "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <QrCode size={16} /> UPI QR (ऑनलाइन)
          </button>
        </div>

        {/* Big Issue Ticket Action */}
        <button
          onClick={handleIssueTicket}
          className="btn-pill-primary"
          style={{ width: "100%", height: 54, fontSize: 17, fontWeight: 700 }}
        >
          Issue ₹{selectedFare} Ticket ({paymentMode.toUpperCase()})
        </button>

        {/* Shift Cash vs UPI breakdown */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
            padding: "8px 12px",
            background: "var(--surface-2)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <span>Cash: ₹{shiftStats.cash_collection}</span>
          <span>UPI: ₹{shiftStats.upi_collection}</span>
        </div>
      </section>

      {/* 4. Incident Reporting & Driver Emergency SOS */}
      <section
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          boxShadow: "var(--ring)",
          padding: 20,
          border: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            display: "block",
            color: "var(--text-muted)",
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Vehicle Incidents & Assistance
        </span>

        {/* One-Tap Driver SOS */}
        <button
          onClick={handleDriverSOS}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: "none",
            background: "var(--accent-red)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 12,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
          }}
        >
          <ShieldAlert size={22} /> ONE-TAP DRIVER SOS
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button
            className="btn-pill-secondary"
            onClick={() => setConfirmIncident({ kind: "breakdown", label: "Breakdown" })}
            style={{ minHeight: 48, flexDirection: "column", gap: 2, fontSize: 11 }}
          >
            <AlertOctagon size={16} style={{ color: "var(--accent-red)" }} />
            Breakdown
          </button>

          <button
            className="btn-pill-secondary"
            onClick={() => setConfirmIncident({ kind: "flat_tire", label: "Flat Tire" })}
            style={{ minHeight: 48, flexDirection: "column", gap: 2, fontSize: 11 }}
          >
            <Disc size={16} style={{ color: "var(--crowd-mod)" }} />
            Flat Tire
          </button>

          <button
            className="btn-pill-secondary"
            onClick={() => setConfirmIncident({ kind: "accident", label: "Accident" })}
            style={{ minHeight: 48, flexDirection: "column", gap: 2, fontSize: 11 }}
          >
            <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />
            Accident
          </button>

          <button
            className="btn-pill-secondary"
            onClick={() => setConfirmIncident({ kind: "route_deviation", label: "Route Deviation" })}
            style={{ minHeight: 48, flexDirection: "column", gap: 2, fontSize: 11 }}
          >
            <Navigation size={16} style={{ color: "var(--accent)" }} />
            Deviation
          </button>

          <button
            className="btn-pill-secondary"
            onClick={() => setConfirmIncident({ kind: "traffic_jam", label: "Heavy Traffic Jam" })}
            style={{ minHeight: 48, flexDirection: "column", gap: 2, fontSize: 11 }}
          >
            <Users size={16} style={{ color: "var(--crowd-mod)" }} />
            Heavy Jam
          </button>

          <button
            className="btn-pill-secondary"
            onClick={() => setConfirmIncident({ kind: "sos", label: "Medical SOS" })}
            style={{ minHeight: 48, flexDirection: "column", gap: 2, fontSize: 11 }}
          >
            <ShieldAlert size={16} style={{ color: "var(--accent-red)" }} />
            Medical SOS
          </button>
        </div>
      </section>

      {/* Confirmation Dialog */}
      {confirmIncident && (
        <div className="dialog-backdrop" onClick={() => setConfirmIncident(null)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <b className="text-title" style={{ fontSize: 18, display: "block", marginBottom: 10 }}>
              Confirm {confirmIncident.label}
            </b>
            <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Report {confirmIncident.label.toLowerCase()} for vehicle {item?.reg_no || busId} to Central Control Room?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-pill-secondary" onClick={() => setConfirmIncident(null)}>
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
