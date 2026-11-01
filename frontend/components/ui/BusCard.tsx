"use client";

import React from "react";
import { Users, AlertTriangle, ChevronRight } from "lucide-react";
import { Chip } from "./Chip";

export interface BusCardData {
  bus_id: number;
  reg_no: string;
  route_id: string;
  towards?: string;
  occupancy?: string;
  load_pct?: number;
  eta_min?: number | null;
  speed_kmh?: number;
  broken?: boolean;
}

interface BusCardProps {
  bus: BusCardData;
  onTrack: (busId: number) => void;
  lang?: string;
}

export function BusCard({ bus, onTrack, lang = "en" }: BusCardProps) {
  // Format ETA according to strict P0.3 specifications
  let etaDisplay: React.ReactNode = null;
  if (bus.eta_min === null || bus.eta_min === undefined || bus.eta_min > 90) {
    etaDisplay = (
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
          {lang === "hi" ? "अभी ट्रैक नहीं" : "Not tracking yet"}
        </span>
      </div>
    );
  } else if (bus.eta_min < 1) {
    etaDisplay = (
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: "1.125rem", color: "var(--crowd-low)", fontWeight: 700 }}>
          {lang === "hi" ? "अभी आ रही है" : "Arriving now"}
        </span>
      </div>
    );
  } else {
    etaDisplay = (
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "flex-end" }}>
        <span
          className="tabular-nums"
          style={{
            fontSize: "2rem",
            lineHeight: 1.1,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {Math.round(bus.eta_min)}
        </span>
        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>
          {lang === "hi" ? "मिनट" : "min"}
        </span>
      </div>
    );
  }

  // Crowd classification
  const load = bus.load_pct || 0;
  const crowdVariant: "low" | "mod" | "high" = load < 40 ? "low" : load <= 75 ? "mod" : "high";
  const crowdLabel = load < 40
    ? (lang === "hi" ? "कम भीड़" : "Seats available")
    : load <= 75
    ? (lang === "hi" ? "मध्यम" : "Moderate")
    : (lang === "hi" ? "अधिक भीड़" : "Standing only");

  return (
    <div
      className="btn-press"
      onClick={() => onTrack(bus.bus_id)}
      style={{
        display: "grid",
        gridTemplateColumns: "56px minmax(0, 1fr) auto",
        gap: 12,
        padding: 16,
        minHeight: 112,
        borderRadius: "var(--r-card)", // 20px
        boxShadow: "var(--ring)",
        border: "1px solid transparent",
        background: "var(--surface)",
        alignItems: "center",
        cursor: "pointer",
        outline: "none",
        position: "relative",
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { onTrack(bus.bus_id); } }}
      aria-label={`Bus route ${bus.route_id} towards ${bus.towards || "Terminal"}`}
    >
      {/* Route badge: 56x56 radius 12 centered digits */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--r-tile)", // 12px
          background: "var(--ink)",
          color: "oklch(1 0 0)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: "1.125rem",
          letterSpacing: "-0.01em",
          boxShadow: "0 2px 6px oklch(0 0 0 / 0.15)",
        }}
      >
        <span style={{ transform: "translateY(-1px)" }}>{bus.route_id}</span>
      </div>

      {/* Middle column: Title + Meta + Crowd Pill */}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <h3
          className="text-heading"
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--text)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.3,
          }}
        >
          {lang === "hi" ? `मार्ग: ${bus.towards || "टर्मिनल"}` : `Towards ${bus.towards || "Terminal"}`}
        </h3>

        <p
          className="text-caption"
          style={{
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "0.8125rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {bus.reg_no} · {bus.speed_kmh ? `${Math.round(bus.speed_kmh)} km/h` : "In service"}
          {bus.broken && (
            <span style={{ color: "var(--crowd-high)", marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 2 }}>
              <AlertTriangle size={12} /> Breakdown
            </span>
          )}
        </p>

        {/* Crowd Pill: 28px high */}
        <div>
          <Chip variant={crowdVariant} icon={<Users size={13} />}>
            {crowdLabel} · {load}%
          </Chip>
        </div>
      </div>

      {/* Right column: ETA block + Track > target 44px */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {etaDisplay}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTrack(bus.bus_id);
          }}
          style={{
            minHeight: 44,
            minWidth: 44,
            padding: "0 12px",
            borderRadius: "var(--r-pill)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--accent)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            cursor: "pointer",
          }}
          aria-label={`Track bus ${bus.bus_id}`}
        >
          <span>{lang === "hi" ? "ट्रैक करें" : "Track"}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
