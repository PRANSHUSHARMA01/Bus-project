"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { Arrival } from "../../lib/types";
import { Badge } from "./Badge";

interface ArrivalCardProps {
  arrival: Arrival;
  onTrack: () => void;
  lang?: "en" | "hi";
}

export function ArrivalCard({ arrival, onTrack, lang = "en" }: ArrivalCardProps) {
  const isArrivingNow = arrival.eta_min < 1;
  const isUnrealistic = arrival.eta_min > 90;
  const etaDisplayNum = Math.round(arrival.eta_min);

  const routeLabel = arrival.route_id;
  const towardsLabel = `${lang === "hi" ? "की ओर: " : "Towards "}${arrival.towards}`;
  const metaText = `${arrival.reg_no} · ${(arrival.distance_m / 1000).toFixed(1)} km · ${arrival.stops_away} ${
    lang === "hi" ? "स्टॉप" : arrival.stops_away === 1 ? "stop" : "stops"
  }`;

  return (
    <div
      onClick={onTrack}
      className="arrival-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTrack();
        }
      }}
      aria-label={`Route ${routeLabel}, ${towardsLabel}. ${
        isArrivingNow
          ? "Arriving now"
          : isUnrealistic
          ? "Not tracking yet"
          : `Arriving in ${etaDisplayNum} min`
      }. Crowd level ${arrival.occupancy}, ${arrival.load_pct}% full.`}
    >
      {/* Left: 56x56 Route Badge (concentric 12px radius) */}
      <div className="arrival-route-badge" aria-hidden="true">
        <span className="arrival-badge-text">{routeLabel}</span>
      </div>

      {/* Middle: Title, Meta, Crowd pill (4px & 8px vertical rhythm) */}
      <div className="arrival-info-col">
        <h3 className="arrival-title" title={towardsLabel}>
          {towardsLabel}
        </h3>
        <p className="arrival-meta text-caption" title={metaText}>
          {metaText}
        </p>
        <div className="arrival-pill-wrap">
          <Badge occupancy={arrival.occupancy} loadPct={arrival.load_pct} />
        </div>
      </div>

      {/* Right: ETA block (baseline aligned with title first line) & 44px tap target */}
      <div className="arrival-eta-col">
        {isArrivingNow ? (
          <div className="arrival-eta-now">
            <span className="arrival-eta-now-text">
              {lang === "hi" ? "आ रही है" : "Arriving now"}
            </span>
          </div>
        ) : isUnrealistic ? (
          <div className="arrival-eta-unrealistic">
            <span className="arrival-eta-unrealistic-text">
              {lang === "hi" ? "ट्रैकिंग जल्द" : "Not tracking"}
            </span>
          </div>
        ) : (
          <div className="arrival-eta-num-wrap">
            <span className="arrival-eta-val tabular-nums">{etaDisplayNum}</span>
            <span className="arrival-eta-unit text-caption">
              {lang === "hi" ? "मिनट" : "min"}
            </span>
          </div>
        )}

        <button
          type="button"
          tabIndex={-1}
          className="arrival-track-action"
          aria-hidden="true"
        >
          <span>{lang === "hi" ? "ट्रैक करें" : "Track"}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
