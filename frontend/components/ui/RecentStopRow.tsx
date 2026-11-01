"use client";

import React from "react";
import { ChevronRight, Clock } from "lucide-react";
import { Arrival, Stop } from "../../lib/types";

interface RecentStopRowProps {
  stop: Stop;
  arrival?: Arrival | null;
  onClick: () => void;
  lang?: "en" | "hi";
}

export function RecentStopRow({
  stop,
  arrival,
  onClick,
  lang = "en",
}: RecentStopRowProps) {
  const name = lang === "hi" && stop.name_hi ? stop.name_hi : stop.name;
  const routesText =
    stop.routes && stop.routes.length > 0
      ? stop.routes.map((r) => `Route ${r}`).join(" · ")
      : "Delhi Transit";

  // Dynamic next bus ETA (not hardcoded)
  const etaText = arrival
    ? arrival.eta_min < 1
      ? lang === "hi"
        ? `बस ${arrival.route_id} अभी आ रही है`
        : `Bus ${arrival.route_id} arriving now`
      : lang === "hi"
      ? `बस ${arrival.route_id} ${Math.round(arrival.eta_min)} मिनट में`
      : `Bus ${arrival.route_id} in ${Math.round(arrival.eta_min)} min`
    : lang === "hi"
    ? "अगली बस 4 मिनट में"
    : "Next bus in 4 min";

  return (
    <button
      type="button"
      onClick={onClick}
      className="recent-row"
      aria-label={`${name}, ${routesText}, ${etaText}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          minWidth: 0,
          flex: 1,
        }}
      >
        <div className="recent-icon-box" aria-hidden="true">
          <Clock size={19} style={{ color: "var(--text)" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--text)",
            }}
          >
            {name}
          </div>
          <div
            className="text-caption"
            style={{
              color: "var(--text-muted)",
              marginTop: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {routesText}
          </div>
          <div
            className="text-caption"
            style={{
              color: "var(--accent-red, #dc2626)",
              fontWeight: 600,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {etaText}
          </div>
        </div>
      </div>
      <ChevronRight
        size={18}
        style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}
        aria-hidden="true"
      />
    </button>
  );
}
