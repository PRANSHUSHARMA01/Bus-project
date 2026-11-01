import React from "react";
import { Occupancy, OCC_COLOR } from "../../lib/types";

interface BadgeProps {
  occupancy: Occupancy;
  loadPct?: number;
  label?: string;
}

export function Badge({ occupancy, loadPct, label }: BadgeProps) {
  const bg = OCC_COLOR[occupancy] || OCC_COLOR.Low;
  const displayLabel = label || occupancy;

  return (
    <span
      className="crowd-pill tabular-nums"
      style={{
        backgroundColor: bg,
        color: "#ffffff",
      }}
      role="status"
      aria-label={`Crowd level: ${displayLabel}${loadPct !== undefined ? `, ${loadPct}% capacity` : ""}`}
    >
      <span className="crowd-pill-dot" aria-hidden="true" />
      <span className="crowd-pill-text">{displayLabel}</span>
      {loadPct !== undefined && <span className="crowd-pill-pct">· {loadPct}%</span>}
    </span>
  );
}
