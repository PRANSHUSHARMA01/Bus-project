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
      style={{ background: bg }}
      role="status"
      aria-label={`Occupancy level: ${label || occupancy}`}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#fff",
          display: "inline-block",
        }}
        aria-hidden="true"
      />
      {label || occupancy}
      {loadPct !== undefined && ` · ${loadPct}%`}
    </span>
  );
}
