"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bus as BusIcon,
  ChevronRight,
  Clock,
  Compass,
  Footprints,
  Navigation,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "./Badge";

export interface TripBusCandidate {
  id: number;
  plate: string;
  eta_to_board_min: number;
  eta_to_dest_min: number;
  load_pct: number;
  seat_probability: number;
  distance_m: number;
  stops_away: number;
  speed_kmh: number;
}

export interface TripOption {
  route_id: string;
  route_name: string;
  direction: string;
  is_transfer?: boolean;
  transfer_stop_id?: string;
  transfer_stop_name?: string;
  transfer_route_id?: string;
  boarding_stop_id: string;
  boarding_stop_name: string;
  dest_stop_id: string;
  dest_stop_name: string;
  walk_to_board_m: number;
  walk_to_board_min: number;
  ride_minutes: number;
  fare_estimate: number;
  tag?: string;
  buses: TripBusCandidate[];
}

interface TripPlannerViewProps {
  options: TripOption[];
  destinationName: string;
  onSelectBus: (busId: number, routeId: string, boardingStopId: string) => void;
  onClose: () => void;
  lang?: "en" | "hi";
  loading?: boolean;
}

export function TripPlannerView({
  options,
  destinationName,
  onSelectBus,
  onClose,
  lang = "en",
  loading = false,
}: TripPlannerViewProps) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number>(0);

  return (
    <div className="trip-planner-view" style={{ padding: "4px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "grid",
              placeItems: "center",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-caption" style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700 }}>
              {lang === "hi" ? "गंतव्य तक बसें" : "TRIP OPTIONS"}
            </div>
            <h2 className="text-heading" style={{ fontSize: "1.125rem", margin: 0, fontWeight: 700 }}>
              {destinationName}
            </h2>
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            background: "var(--surface-2)",
            color: "var(--text)",
          }}
        >
          {options.length} {lang === "hi" ? "विकल्प" : "routes"}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <Compass size={28} className="animate-spin" style={{ margin: "0 auto 8px" }} />
          <div>{lang === "hi" ? "सर्वोत्तम बसें खोजी जा रही हैं..." : "Finding fastest buses to destination..."}</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && options.length === 0 && (
        <div style={{ padding: "30px 20px", textAlign: "center", background: "var(--surface-2)", borderRadius: 16 }}>
          <BusIcon size={32} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {lang === "hi" ? "कोई सीधी बस जल्द नहीं है" : "No direct buses soon"}
          </div>
          <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 4 }}>
            {lang === "hi"
              ? "अगली बस लगभग 20 मिनट में पहुंचेगी। कोई अन्य स्टॉप चुनें।"
              : "Next scheduled bus arrives in ~20 minutes. Try a nearby interchange stop."}
          </div>
        </div>
      )}

      {/* Trip Options List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {options.map((opt, idx) => {
          const firstBus = opt.buses[0];
          const isSelected = selectedOptionIdx === idx;

          return (
            <div
              key={`${opt.route_id}_${opt.boarding_stop_id}_${idx}`}
              className="trip-option-card"
              style={{
                borderRadius: 16,
                background: "var(--surface)",
                border: isSelected ? "2px solid #18181b" : "1px solid var(--border)",
                boxShadow: "var(--ring)",
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onClick={() => setSelectedOptionIdx(idx)}
            >
              {/* Top row: Route Chip, Tags, ETA to Board */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "#18181b",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: 8,
                    }}
                  >
                    {opt.route_id}
                  </span>

                  {opt.tag && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background:
                          opt.tag === "Fastest"
                            ? "rgba(16, 185, 129, 0.15)"
                            : opt.tag === "Most seats"
                            ? "rgba(59, 130, 246, 0.15)"
                            : "var(--surface-3)",
                        color:
                          opt.tag === "Fastest"
                            ? "var(--crowd-low)"
                            : opt.tag === "Most seats"
                            ? "var(--accent)"
                            : "var(--text)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      {opt.tag === "Fastest" && <Sparkles size={11} />}
                      {opt.tag}
                    </span>
                  )}

                  {opt.is_transfer && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {lang === "hi" ? "1 बदलाव" : "1 transfer"}
                    </span>
                  )}
                </div>

                {/* Right: Boarding ETA */}
                {firstBus && (
                  <div style={{ textAlign: "right" }}>
                    <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>
                      {Math.round(firstBus.eta_to_board_min)}{" "}
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>min</span>
                    </div>
                    <div className="text-caption" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {lang === "hi" ? "चढ़ने का समय" : "board ETA"}
                    </div>
                  </div>
                )}
              </div>

              {/* Boarding and Journey Details */}
              <div style={{ margin: "10px 0 6px", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text)" }}>
                  <Footprints size={14} style={{ color: "var(--text-muted)" }} />
                  <span>
                    {opt.walk_to_board_min} min walk ({opt.walk_to_board_m} m) to <b>{opt.boarding_stop_name}</b>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text)" }}>
                  <Clock size={14} style={{ color: "var(--text-muted)" }} />
                  <span>
                    ~{opt.ride_minutes} min ride · ₹{opt.fare_estimate} fare
                  </span>
                </div>
              </div>

              {/* Multiple Candidate Buses Approaching */}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={13} style={{ color: "var(--text-muted)" }} />
                  <span className="text-caption" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {opt.buses.length} {lang === "hi" ? "बसें मार्ग में" : "buses on this corridor"}
                  </span>
                </div>

                {firstBus && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBus(firstBus.id, opt.route_id, opt.boarding_stop_id);
                    }}
                    style={{
                      minHeight: 34,
                      padding: "0 14px",
                      borderRadius: 999,
                      background: "#18181b",
                      color: "#fff",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <span>{lang === "hi" ? "ट्रैक करें" : "Track trip"}</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
