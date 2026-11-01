"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  PhoneCall,
  Clock,
  Compass,
  MapPin,
  Share2,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Radio,
} from "lucide-react";

interface LiveTelemetry {
  lat: number;
  lng: number;
  speed_kmh: number;
  crowd_pct: number;
  seat_chance: string;
  next_stop_name: string;
  updated_at: string;
}

interface SharedTripData {
  token: string;
  trip_id: string;
  passenger_initials: string;
  bus_id: number;
  route_id: string;
  route_name: string;
  board_stop_name: string;
  status: string;
  boarded_at: string;
  expires_at: string;
  live_telemetry?: LiveTelemetry;
  helplines: Record<string, string>;
}

export function SharedTripTracker({
  token,
  onClose,
}: {
  token: string;
  onClose?: () => void;
}) {
  const [data, setData] = useState<SharedTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/trips/shared/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("This shared trip link is invalid or has expired.");
        }
        throw new Error("Unable to load shared trip details.");
      }
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || "Failed to load shared trip");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrip();
      const interval = setInterval(fetchTrip, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "#F1F5F9",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          background: "rgba(10, 110, 63, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 8px",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#4ADE80",
                    boxShadow: "0 0 8px #4ADE80",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#D1FAE5",
                    fontFamily: "monospace",
                  }}
                >
                  Live Family Tracker · AIS-140
                </span>
              </div>
              <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#fff" }}>
                Delhi Transit Live Tracking
              </h1>
            </div>
          </div>

          <button
            onClick={fetchTrip}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: 680,
          width: "100%",
          margin: "0 auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {loading && !data && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              background: "#111827",
              borderRadius: 16,
              border: "1px solid #1F2937",
            }}
          >
            <RefreshCw size={28} style={{ color: "#10B981", margin: "0 auto 12px auto" }} className="animate-spin" />
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Connecting to encrypted bus telematics transponder...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 24,
              background: "rgba(153, 27, 27, 0.4)",
              borderRadius: 16,
              border: "1px solid #EF4444",
              textAlign: "center",
            }}
          >
            <AlertTriangle size={36} style={{ color: "#F87171", margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px 0", color: "#FEE2E2" }}>
              Link Inactive or Expired
            </h3>
            <p style={{ fontSize: 13, color: "#FCA5A5", margin: "0 0 16px 0" }}>{error}</p>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Go to Delhi Bus Map
              </button>
            )}
          </div>
        )}

        {data && (
          <>
            {/* Passenger Identity & Trip Status Banner */}
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 18,
                background: "linear-gradient(135deg, #064E3B 0%, #111827 100%)",
                border: "1px solid #059669",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "#0A6E3F",
                    border: "2px solid #34D399",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(10, 110, 63, 0.5)",
                  }}
                >
                  {data.passenger_initials}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: "monospace",
                        color: "#34D399",
                        textTransform: "uppercase",
                      }}
                    >
                      Passenger En Route
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        background: "rgba(5, 150, 105, 0.3)",
                        border: "1px solid #059669",
                        color: "#6EE7B7",
                        padding: "1px 5px",
                        borderRadius: 4,
                      }}
                    >
                      AIS-140 GPS
                    </span>
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#fff" }}>
                    Following Passenger {data.passenger_initials}
                  </h2>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 800,
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid #10B981",
                    color: "#34D399",
                    textTransform: "uppercase",
                  }}
                >
                  ● {data.status}
                </span>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>
                  {lastRefreshed ? `Refreshed ${lastRefreshed}` : "Live Signal"}
                </div>
              </div>
            </div>

            {/* Vehicle Telematics Dashboard Card */}
            {data.live_telemetry && (
              <div
                style={{
                  background: "#111827",
                  border: "1px solid #1F2937",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Header: Assigned Bus & Speed */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #1F2937",
                    paddingBottom: 14,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", fontFamily: "monospace" }}>
                      Assigned Vehicle
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#F59E0B", fontFamily: "monospace" }}>DL 1P {data.bus_id}</span>
                      <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>· {data.route_name}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", fontFamily: "monospace" }}>
                      Speed
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#10B981", fontFamily: "monospace" }}>
                      {data.live_telemetry.speed_kmh} <span style={{ fontSize: 11, color: "#9CA3AF" }}>km/h</span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Badges */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div style={{ background: "#0F172A", padding: 12, borderRadius: 12, border: "1px solid #1E293B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                      <Users size={14} style={{ color: "#818CF8" }} />
                      <span>Crowd Density</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                      {data.live_telemetry.crowd_pct}% Full
                    </div>
                  </div>

                  <div style={{ background: "#0F172A", padding: 12, borderRadius: 12, border: "1px solid #1E293B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                      <CheckCircle2 size={14} style={{ color: "#34D399" }} />
                      <span>Seat Chance</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#34D399" }}>
                      {data.live_telemetry.seat_chance}
                    </div>
                  </div>

                  <div style={{ background: "#0F172A", padding: 12, borderRadius: 12, border: "1px solid #1E293B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                      <MapPin size={14} style={{ color: "#FBBF24" }} />
                      <span>Approaching Stop</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {data.live_telemetry.next_stop_name}
                    </div>
                  </div>
                </div>

                {/* Telemetry Stream Coordinates Bar */}
                <div
                  style={{
                    background: "#030712",
                    border: "1px solid #1F2937",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6 }}>
                      <Compass size={14} style={{ color: "#10B981" }} />
                      Realtime GPS Coordinates
                    </span>
                    <span style={{ fontFamily: "monospace", color: "#34D399", fontWeight: 700 }}>
                      {data.live_telemetry.lat.toFixed(4)}° N, {data.live_telemetry.lng.toFixed(4)}° E
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 4, background: "#1F2937", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: "70%", height: "100%", background: "#10B981", borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            )}

            {/* Direct Emergency Dials Card */}
            <div
              style={{
                background: "rgba(69, 10, 10, 0.4)",
                border: "1px solid rgba(225, 29, 72, 0.4)",
                borderRadius: 18,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FDA4AF" }}>
                  <ShieldAlert size={18} style={{ color: "#E11D48" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Family Emergency Quick Dials
                  </span>
                </div>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#F43F5E" }}>Delhi NCR 24/7</span>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0 }}>
                If passenger does not arrive as expected, dial transit security or police immediately:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <a
                  href="tel:112"
                  style={{
                    background: "#E11D48",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 13,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)",
                  }}
                >
                  <PhoneCall size={16} />
                  <span>Call 112 (Police)</span>
                </a>
                <a
                  href="tel:1091"
                  style={{
                    background: "#BE185D",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 13,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 4px 12px rgba(190, 24, 93, 0.4)",
                  }}
                >
                  <PhoneCall size={16} />
                  <span>Call 1091 (Women)</span>
                </a>
                <a
                  href="tel:181"
                  style={{
                    background: "#1E293B",
                    color: "#E2E8F0",
                    border: "1px solid #334155",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <PhoneCall size={14} style={{ color: "#F472B6" }} />
                  <span>181 Women Comm.</span>
                </a>
                <a
                  href="tel:01123370373"
                  style={{
                    background: "#1E293B",
                    color: "#E2E8F0",
                    border: "1px solid #334155",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <PhoneCall size={14} style={{ color: "#34D399" }} />
                  <span>DTC Control Room</span>
                </a>
              </div>
            </div>

            {/* Share / Forward Actions */}
            <div
              style={{
                background: "#111827",
                border: "1px solid #1F2937",
                borderRadius: 18,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} style={{ color: "#F59E0B" }} />
                  Link Expiration Notice
                </span>
                <span>Active for 3 hours</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={copyLink}
                  style={{
                    flex: 1,
                    background: "#1E293B",
                    border: "1px solid #334155",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Share2 size={15} style={{ color: "#10B981" }} />
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Live tracking update for transit trip on bus DL 1P ${data.bus_id} (${data.route_name}): ${typeof window !== "undefined" ? window.location.href : ""}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    background: "#059669",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ExternalLink size={15} />
                  <span>Forward on WhatsApp</span>
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
