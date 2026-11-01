"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  MapPin,
  Navigation,
  Train,
  Users,
} from "lucide-react";
import { Bus, Route, Stop } from "../../lib/types";

interface CorridorTimelineProps {
  route: Route;
  bus?: Bus | null;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  onSetDestination?: (stopId: string) => void;
  lang?: "en" | "hi";
  onNotify?: (message: string) => void;
}

interface StopDetail {
  stop: Stop;
  index: number;
  isTerminal: boolean;
  isMetro: boolean;
  isInterchange: boolean;
  primaryName: string;
  secondaryName?: string;
  distanceKm: number;
  stepKm: number;
  stepMin: number;
  state: "passed" | "next" | "upcoming";
  isYou: boolean;
  isDestination: boolean;
  etaMin: number | null;
  clockTime: string | null;
}

export function CorridorTimeline({
  route,
  bus,
  selectedStopId,
  onSelectStop,
  onSetDestination,
  lang = "en",
  onNotify,
}: CorridorTimelineProps) {
  const [filterMode, setFilterMode] = useState<"all" | "key">("all");
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);
  const [destinationStopId, setDestinationStopId] = useState<string | null>(null);
  const nextStopRef = useRef<HTMLLIElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);

  // Compute nearest/next stop index based on bus coordinates along route
  const nextStopIndex = useMemo(() => {
    if (!route.stops || route.stops.length === 0) return 0;
    if (!bus) return 0;

    // Find stop closest to bus
    let closestIdx = 0;
    let minDist = Infinity;
    route.stops.forEach((st, idx) => {
      const dLat = (st.lat - bus.lat) * 111.0;
      const dLng = (st.lng - bus.lng) * 111.0 * Math.cos((st.lat * Math.PI) / 180);
      const d = Math.sqrt(dLat * dLat + dLng * dLng);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });

    // If bus is very close to closest stop, next stop is closestIdx or closestIdx + 1
    return Math.min(route.stops.length - 1, closestIdx);
  }, [route.stops, bus]);

  // Destination stop default is last stop
  const finalDestId = destinationStopId || (route.stops.length > 0 ? route.stops[route.stops.length - 1].id : null);

  // Process all stop items
  const stopDetails: StopDetail[] = useMemo(() => {
    if (!route.stops || route.stops.length === 0) return [];
    const totalStops = route.stops.length;
    const now = new Date();

    return route.stops.map((st, idx) => {
      const isTerminal = idx === 0 || idx === totalStops - 1;
      const rawName = lang === "hi" && st.name_hi ? st.name_hi : st.name;
      
      // Smart split for long names
      let primaryName = rawName;
      let secondaryName: string | undefined = undefined;
      if (rawName.includes(" / ")) {
        const parts = rawName.split(" / ");
        primaryName = parts[0].trim();
        secondaryName = parts.slice(1).join(" / ").trim();
      } else if (rawName.includes(" - ")) {
        const parts = rawName.split(" - ");
        primaryName = parts[0].trim();
        secondaryName = parts.slice(1).join(" - ").trim();
      }

      const isMetro =
        st.name.toLowerCase().includes("metro") ||
        (st.name_hi && st.name_hi.includes("मेट्रो")) ||
        (secondaryName ? secondaryName.toLowerCase().includes("metro") : false);

      const isInterchange = Boolean(st.routes && st.routes.length > 1);

      // Distances
      const distanceKm = st.d ? roundOne(st.d / 1000) : roundOne(idx * 0.8);
      const prevD = idx > 0 && route.stops[idx - 1].d ? route.stops[idx - 1].d! : Math.max(0, (idx - 1) * 800);
      const currD = st.d ? st.d : idx * 800;
      const stepKm = roundOne(Math.max(0.4, (currD - prevD) / 1000));
      const stepMin = Math.max(1, Math.round((stepKm / 18) * 60 + 0.4));

      // States: passed, next, upcoming
      let state: "passed" | "next" | "upcoming" = "upcoming";
      if (idx < nextStopIndex) {
        state = "passed";
      } else if (idx === nextStopIndex) {
        state = "next";
      } else {
        state = "upcoming";
      }

      const isYou = st.id === selectedStopId;
      const isDestination = st.id === finalDestId;

      // ETA computation for upcoming and next stops
      let etaMin: number | null = null;
      let clockTime: string | null = null;
      if (state === "next") {
        etaMin = Math.max(1, Math.round(stepMin * 0.6));
      } else if (state === "upcoming") {
        const stopsAway = idx - nextStopIndex;
        etaMin = Math.max(2, stopsAway * 3 + Math.round(stepMin));
      }

      if (etaMin !== null) {
        const etaDate = new Date(now.getTime() + etaMin * 60000);
        const hours = etaDate.getHours();
        const mins = etaDate.getMinutes();
        const ampm = hours >= 12 ? (lang === "hi" ? "अपराह्न" : "pm") : (lang === "hi" ? "पूर्वाह्न" : "am");
        const formattedHours = hours % 12 || 12;
        const formattedMins = mins < 10 ? `0${mins}` : mins;
        clockTime = `${formattedHours}:${formattedMins} ${ampm}`;
      }

      return {
        stop: st,
        index: idx,
        isTerminal,
        isMetro,
        isInterchange,
        primaryName,
        secondaryName,
        distanceKm,
        stepKm,
        stepMin,
        state,
        isYou,
        isDestination,
        etaMin,
        clockTime,
      };
    });
  }, [route.stops, lang, nextStopIndex, selectedStopId, finalDestId]);

  // Filter for Key Stops: Metro, Terminal, Interchange, You, Destination, Next
  const visibleStops = useMemo(() => {
    if (filterMode === "all") return stopDetails;
    return stopDetails.filter(
      (s) => s.isTerminal || s.isMetro || s.isInterchange || s.isYou || s.isDestination || s.state === "next"
    );
  }, [stopDetails, filterMode]);

  // Auto-scroll next stop into center view on mount/change
  useEffect(() => {
    if (nextStopRef.current) {
      const prefersReducedMotion =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      nextStopRef.current.scrollIntoView({
        block: "center",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [nextStopIndex]);

  const totalLengthKm = route.length_m ? roundOne(route.length_m / 1000) : 14.2;

  function toggleExpand(stopId: string) {
    setExpandedStopId((prev) => (prev === stopId ? null : stopId));
  }

  return (
    <div className="corridor-timeline-container" style={{ margin: "18px 0" }}>
      {/* 1. Header with title, stops count & distance, and Key Stops segmented toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h2
            className="text-heading"
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.3,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {lang === "hi" ? "रूट के स्टॉप" : "Corridor stops"}
          </h2>
          <div
            className="text-caption tabular-nums"
            style={{ color: "var(--text-muted)", marginTop: 2, fontSize: "0.8125rem" }}
          >
            {stopDetails.length} {lang === "hi" ? "स्टॉप" : "stops"} · {totalLengthKm} km
          </div>
        </div>

        {/* Segmented Control: All stops vs Key stops */}
        <div
          role="radiogroup"
          aria-label="Filter corridor stops"
          style={{
            display: "inline-flex",
            background: "var(--surface-2)",
            borderRadius: 999,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={filterMode === "all"}
            onClick={() => setFilterMode("all")}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: filterMode === "all" ? 600 : 500,
              borderRadius: 999,
              background: filterMode === "all" ? "var(--surface)" : "transparent",
              color: filterMode === "all" ? "var(--text)" : "var(--text-muted)",
              boxShadow: filterMode === "all" ? "var(--ring)" : "none",
              border: "none",
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
          >
            {lang === "hi" ? "सभी स्टॉप" : "All stops"}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={filterMode === "key"}
            onClick={() => setFilterMode("key")}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: filterMode === "key" ? 600 : 500,
              borderRadius: 999,
              background: filterMode === "key" ? "var(--surface)" : "transparent",
              color: filterMode === "key" ? "var(--text)" : "var(--text-muted)",
              boxShadow: filterMode === "key" ? "var(--ring)" : "none",
              border: "none",
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
          >
            {lang === "hi" ? "मुख्य स्टॉप" : "Key stops"}
          </button>
        </div>
      </div>

      {/* 2. Vertical Journey Timeline Ordered List */}
      <ol
        ref={listRef}
        aria-label={lang === "hi" ? "रूट के स्टॉप की सूची" : "Corridor stops timeline"}
        style={{ listStyle: "none", margin: 0, padding: 0 }}
      >
        {visibleStops.map((item, rowIdx) => {
          const isNext = item.state === "next";
          const isPassed = item.state === "passed";
          const isExpanded = expandedStopId === item.stop.id;
          const isFirst = rowIdx === 0;
          const isLast = rowIdx === visibleStops.length - 1;

          // Staged entrance animation for first 8 rows
          const animationDelay = rowIdx < 8 ? `${rowIdx * 100}ms` : "0ms";

          return (
            <li
              key={item.stop.id}
              ref={isNext ? nextStopRef : null}
              aria-current={isNext ? "step" : undefined}
              className={`timeline-row ${isNext ? "timeline-row-next" : ""} ${isPassed ? "timeline-row-passed" : ""}`}
              style={{
                display: "grid",
                gridTemplateColumns: "24px minmax(0, 1fr) auto",
                columnGap: 12,
                minHeight: 56,
                padding: "8px 10px",
                borderRadius: 12,
                background: isNext ? "var(--surface-2)" : isExpanded ? "var(--surface)" : "transparent",
                border: isExpanded ? "1px solid var(--border)" : "1px solid transparent",
                position: "relative",
                cursor: "pointer",
                transition: "background 150ms ease-out",
                animation: rowIdx < 8 ? `timelineFadeIn 300ms ease-out ${animationDelay} backwards` : "none",
              }}
              onClick={() => toggleExpand(item.stop.id)}
            >
              {/* RAIL COLUMN (24px) */}
              <div
                style={{
                  position: "relative",
                  width: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: 4,
                }}
              >
                {/* Upper Rail Segment */}
                {!isFirst && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: "calc(100% - 10px)",
                      width: 2,
                      background: isPassed || isNext ? "var(--text)" : "var(--border)",
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Lower Rail Segment */}
                {!isLast && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      bottom: 0,
                      width: 2,
                      background: isPassed ? "var(--text)" : "var(--border)",
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Live Bus Marker Badge on Rail (if bus is here) */}
                {isNext && bus && (
                  <div
                    className="timeline-bus-pill"
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#18181b",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 700,
                      zIndex: 4,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      whiteSpace: "nowrap",
                    }}
                    title={`${bus.reg_no} · ${bus.speed_kmh} km/h`}
                  >
                    <Navigation size={10} style={{ transform: "rotate(45deg)" }} />
                    <span>{bus.route_id}</span>
                  </div>
                )}

                {/* Stop Node */}
                <div
                  className={`timeline-node ${isNext ? "node-pulse" : ""}`}
                  style={{
                    width: item.isTerminal ? 16 : 12,
                    height: item.isTerminal ? 16 : 12,
                    borderRadius: "50%",
                    background: item.isYou
                      ? "var(--accent)"
                      : item.isDestination
                      ? "#18181b"
                      : isNext
                      ? "#18181b"
                      : isPassed
                      ? "var(--surface-3)"
                      : "var(--surface)",
                    border: item.isYou
                      ? "2px solid #fff"
                      : item.isDestination
                      ? "2px solid #fff"
                      : isNext
                      ? "2px solid #fff"
                      : isPassed
                      ? "2px solid var(--surface-3)"
                      : "2px solid var(--text-muted)",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                    zIndex: 2,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.isTerminal && (
                    <Flag size={8} style={{ color: item.isDestination ? "#fff" : "inherit" }} />
                  )}
                  {item.isMetro && !item.isTerminal && (
                    <Train size={7} style={{ color: isNext ? "#fff" : "inherit" }} />
                  )}
                </div>
              </div>

              {/* TEXT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {/* Primary Title + Status Chips */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      lineHeight: 1.4,
                      fontWeight: isNext || item.isYou ? 700 : 500,
                      color: isPassed ? "var(--text-muted)" : "var(--text)",
                      textWrap: "balance",
                    }}
                  >
                    {item.primaryName}
                  </span>

                  {/* You Chip */}
                  {item.isYou && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--accent)",
                        color: "#fff",
                        padding: "1px 6px",
                        borderRadius: 999,
                      }}
                    >
                      {lang === "hi" ? "आप" : "You"}
                    </span>
                  )}

                  {/* Destination Chip */}
                  {item.isDestination && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#18181b",
                        color: "#fff",
                        padding: "1px 6px",
                        borderRadius: 999,
                      }}
                    >
                      {lang === "hi" ? "गंतव्य" : "Drop here"}
                    </span>
                  )}

                  {/* Next Stop Chip */}
                  {isNext && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "var(--crowd-low)",
                        padding: "1px 6px",
                        borderRadius: 999,
                      }}
                    >
                      {lang === "hi" ? "अगला स्टॉप" : "Next stop"}
                    </span>
                  )}
                </div>

                {/* Secondary Caption & Tags */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3,
                    flexWrap: "wrap",
                  }}
                >
                  {item.secondaryName && (
                    <span className="text-caption" style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                      {item.secondaryName}
                    </span>
                  )}

                  {item.isMetro && (
                    <span
                      className="tag-chip"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        background: "var(--surface-3)",
                        color: "var(--text)",
                        padding: "2px 7px 2px 5px",
                        borderRadius: 999,
                        height: 20,
                      }}
                    >
                      <Train size={11} />
                      <span>Metro</span>
                    </span>
                  )}

                  {item.isTerminal && (
                    <span
                      className="tag-chip"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        background: "var(--surface-3)",
                        color: "var(--text)",
                        padding: "2px 7px 2px 5px",
                        borderRadius: 999,
                        height: 20,
                      }}
                    >
                      <Flag size={11} />
                      <span>{lang === "hi" ? "टर्मिनल" : "Terminal"}</span>
                    </span>
                  )}
                </div>

                {/* INLINE EXPANDED PANEL */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTop: "1px solid var(--border)",
                      animation: "panelExpand 200ms ease-out",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span className="text-caption" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {lang === "hi" ? "दूरी और समय:" : "Segment:"} <b>{item.stepKm} km</b> · ~{item.stepMin} min
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStop?.(item.stop.id);
                          onNotify?.(lang === "hi" ? `बोर्डिंग स्टॉप सेट: ${item.primaryName}` : `Boarding stop set: ${item.primaryName}`);
                        }}
                        style={{
                          minHeight: 38,
                          padding: "0 12px",
                          borderRadius: 999,
                          background: item.isYou ? "var(--accent)" : "var(--surface-2)",
                          color: item.isYou ? "#fff" : "var(--text)",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                        }}
                      >
                        <MapPin size={13} />
                        <span>{lang === "hi" ? "मेरा स्टॉप सेट करें" : "Set as my stop"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDestinationStopId(item.stop.id);
                          onSetDestination?.(item.stop.id);
                          onNotify?.(lang === "hi" ? `गंतव्य सेट: ${item.primaryName}` : `Destination set: ${item.primaryName}`);
                        }}
                        style={{
                          minHeight: 38,
                          padding: "0 12px",
                          borderRadius: 999,
                          background: item.isDestination ? "#18181b" : "var(--surface-2)",
                          color: item.isDestination ? "#fff" : "var(--text)",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                        }}
                      >
                        <Flag size={13} />
                        <span>{lang === "hi" ? "गंतव्य सेट करें" : "Set as destination"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onNotify?.(lang === "hi" ? `अलर्ट सेट: ${item.primaryName}` : `Arrival notification set for ${item.primaryName}`);
                        }}
                        style={{
                          minHeight: 38,
                          padding: "0 12px",
                          borderRadius: 999,
                          background: "var(--surface-2)",
                          color: "var(--text)",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                        }}
                      >
                        <Bell size={13} />
                        <span>{lang === "hi" ? "आगमन अलर्ट" : "Alert me"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN (ETA / Clock / Passed) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "flex-start",
                  paddingTop: 2,
                }}
              >
                {isPassed ? (
                  <span
                    className="text-caption"
                    style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}
                  >
                    {lang === "hi" ? "छूट गया" : "Passed"}
                  </span>
                ) : item.etaMin !== null ? (
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: isNext ? "1.125rem" : "0.9375rem",
                        fontWeight: 600,
                        color: isNext ? "var(--text)" : "var(--text)",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.etaMin} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>min</span>
                    </div>
                    {item.clockTime && (
                      <div
                        className="text-caption tabular-nums"
                        style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}
                      >
                        {item.clockTime}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Expand Indicator */}
                <div style={{ marginTop: 4, color: "var(--text-muted)" }}>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function roundOne(val: number): number {
  return Math.round(val * 10) / 10;
}
