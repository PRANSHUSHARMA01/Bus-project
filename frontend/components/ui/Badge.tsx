import React from "react";
import { Occupancy, OCC_COLOR } from "../../lib/types";

interface BadgeProps {
  occupancy: Occupancy;
  loadPct?: number;
  label?: string;
}

export function Badge({ occupancy, loadPct, label }: BadgeProps) {
  const bg = OCC_COLOR[occupancy];
  return (
    <span
      className="badge tabular-nums"
      style={{
        background: bg,
        color: "#ffffff",
        fontWeight: 600,
        fontSize: 12,
      }}
      role="status"
      aria-label={`Occupancy level: ${label || occupancy}`}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#ffffff",
          display: "inline-block",
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span>{label || occupancy}</span>
      {loadPct !== undefined && <span>· {loadPct}%</span>}
    </span>
  );
}
