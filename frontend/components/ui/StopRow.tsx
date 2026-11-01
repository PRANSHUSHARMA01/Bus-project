"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Flag,
  MapPin,
  Train,
  Users,
} from "lucide-react";
import { Arrival, Stop } from "../../lib/types";

export interface CandidateBusInfo {
  bus_id: string;
  route_id: string;
  reg_no?: string;
  eta_min: number;
  occupancy?: string;
  load_pct?: number;
}

export interface StopRowProps {
  stop: Stop;
  arrival?: Arrival | null;
  onClick?: () => void;
  lang?: "en" | "hi";

  // Timeline-specific optional props
  index?: number;
  isFirst?: boolean;
  isLast?: boolean;
  state?: "passed" | "next" | "upcoming";
  isTerminal?: boolean;
  isMetro?: boolean;
  isInterchange?: boolean;
  isYou?: boolean;
  isDestination?: boolean;
  etaMin?: number | null;
  clockTime?: string | null;
  primaryName?: string;
  secondaryName?: string;
  stepKm?: number;
  stepMin?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSelectStop?: (stopId: string) => void;
  onSetDestination?: (stopId: string) => void;
  onAlert?: (message: string) => void;
  candidateBuses?: CandidateBusInfo[];
  liveBus?: { route_id: string; reg_no?: string; speed_kmh?: number } | null;
}

export const StopRow = React.forwardRef<HTMLLIElement, StopRowProps>(function StopRow(
  {
    stop,
    arrival,
    onClick,
    lang = "en",
    index = 0,
    isFirst = false,
    isLast = false,
    state: stateProp,
    isTerminal: isTerminalProp,
    isMetro: isMetroProp,
    isInterchange: isInterchangeProp,
    isYou = false,
    isDestination = false,
    etaMin: etaMinProp,
    clockTime: clockTimeProp,
    primaryName: primaryNameProp,
    secondaryName: secondaryNameProp,
    stepKm,
    stepMin,
    isExpanded = false,
    onToggleExpand,
    onSelectStop,
    onSetDestination,
    onAlert,
    candidateBuses,
    liveBus,
  },
  ref
) {
  // Determine state
  const state = stateProp ?? (arrival ? (arrival.eta_min < 2 ? "next" : "upcoming") : "upcoming");
  const isPassed = state === "passed";
  const isNext = state === "next";

  // Parse stop names if not explicitly provided
  const rawName = lang === "hi" && stop.name_hi ? stop.name_hi : stop.name;
  let primary = primaryNameProp;
  let secondary = secondaryNameProp;

  if (!primary) {
    if (rawName.includes(" / ")) {
      const parts = rawName.split(" / ");
      primary = parts[0].trim();
      secondary = parts.slice(1).join(" / ").trim();
    } else if (rawName.includes(" - ")) {
      const parts = rawName.split(" - ");
      primary = parts[0].trim();
      secondary = parts.slice(1).join(" - ").trim();
    } else if (rawName.includes("(") && rawName.includes(")")) {
      const startIdx = rawName.indexOf("(");
      primary = rawName.slice(0, startIdx).trim();
      secondary = rawName.slice(startIdx).trim();
    } else {
      primary = rawName;
    }
  }

  // Feature detection for chips
  const isTerminal =
    isTerminalProp !== undefined
      ? isTerminalProp
      : isFirst || isLast || stop.name.toLowerCase().includes("terminal");
  const isMetro =
    isMetroProp !== undefined
      ? isMetroProp
      : stop.name.toLowerCase().includes("metro") ||
        (stop.name_hi && stop.name_hi.includes("मेट्रो")) ||
        (secondary ? secondary.toLowerCase().includes("metro") : false);
  const isInterchange =
    isInterchangeProp !== undefined
      ? isInterchangeProp
      : Boolean(stop.routes && stop.routes.length > 1);

  // Compute ETA and clock time
  let eta = etaMinProp !== undefined ? etaMinProp : arrival ? Math.round(arrival.eta_min) : null;
  let clock = clockTimeProp;

  if (eta !== null && !clock) {
    const now = new Date();
    const etaDate = new Date(now.getTime() + eta * 60000);
    const hours = etaDate.getHours();
    const mins = etaDate.getMinutes();
    const ampm =
      hours >= 12
        ? lang === "hi"
          ? "अपराह्न"
          : "pm"
        : lang === "hi"
        ? "पूर्वाह्न"
        : "am";
    const formattedHours = hours % 12 || 12;
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    clock = `${formattedHours}:${formattedMins}\u202F${ampm}`;
  }

  // Detect ETA digit updates to trigger roll animation
  const prevEtaRef = useRef<number | null>(eta);
  const [isEtaRolling, setIsEtaRolling] = useState(false);

  useEffect(() => {
    if (prevEtaRef.current !== null && eta !== null && prevEtaRef.current !== eta) {
      setIsEtaRolling(true);
      const timer = setTimeout(() => setIsEtaRolling(false), 200);
      prevEtaRef.current = eta;
      return () => clearTimeout(timer);
    }
    prevEtaRef.current = eta;
  }, [eta]);

  // Click handler: expand or custom onClick
  const handleRowClick = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else if (onClick) {
      onClick();
    }
  };

  // Node centering formulas (centered on first line of text)
  // English: 1rem * 1.4 = 22.4px box.
  // Hindi: 1rem * 1.6 = 25.6px box.
  const isHindi = lang === "hi";
  const lineBoxHeight = isHindi ? 25.6 : 22.4;
  const nodeSize = isTerminal || isNext || isDestination ? 16 : isYou ? 14 : isPassed ? 10 : 12;
  const nodeTopMargin = (lineBoxHeight - nodeSize) / 2;
  const chevronTopMargin = (lineBoxHeight - 20) / 2;

  // Rail color logic
  const passedRailColor = "oklch(0.18 0 0)";
  const upcomingRailColor = "oklch(0 0 0 / 0.14)";

  const railTopColor = isPassed || isNext ? passedRailColor : upcomingRailColor;
  const railBottomColor = isPassed ? passedRailColor : upcomingRailColor;

  // Stagger entrance delay for first 8 rows
  const staggerDelay = index < 8 ? `${index * 100}ms` : "0ms";

  // Accessibility label
  const statusAriaText = isPassed
    ? isHindi
      ? "गुज़रा हुआ स्टॉप"
      : "Passed stop"
    : isNext
    ? isHindi
      ? "अगला स्टॉप"
      : "Next stop"
    : isYou
    ? isHindi
      ? "आपका बोर्डिंग स्टॉप"
      : "Your boarding stop"
    : isDestination
    ? isHindi
      ? "गंतव्य स्टॉप"
      : "Destination stop"
    : "";

  const timeAriaText = isPassed
    ? isHindi
      ? "छूट गया"
      : "Passed"
    : eta !== null
    ? isHindi
      ? `${eta} मिनट में आगमन, समय ${clock}`
      : `Arriving in ${eta} minutes, at ${clock}`
    : "";

  const fullAriaLabel = `${statusAriaText ? `${statusAriaText}: ` : ""}${primary}${
    secondary ? ` (${secondary})` : ""
  }. ${timeAriaText}`;

  return (
    <li
      ref={ref}
      className={`stop-row-item ${index < 8 ? "stop-row-entrance" : ""}`}
      style={
        {
          "--row-stagger": staggerDelay,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className={`stop-row ${isNext ? "is-next" : ""} ${isExpanded ? "is-expanded" : ""} ${
          isPassed ? "is-passed" : ""
        } ${isYou ? "is-you" : ""}`}
        aria-expanded={onToggleExpand ? isExpanded : undefined}
        aria-current={isNext ? "step" : undefined}
        aria-label={fullAriaLabel}
        onClick={handleRowClick}
      >
        {/* Background feedback layer (scales down without shrinking text) */}
        <div className="stop-row-bg" aria-hidden="true" />

        {/* 1. RAIL COLUMN (24px) */}
        <div
          className="stop-row-rail"
          style={
            {
              "--node-top": `${nodeTopMargin}px`,
              "--node-size": `${nodeSize}px`,
              "--rail-top-color": railTopColor,
              "--rail-bottom-color": railBottomColor,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {/* Top Rail Segment */}
          {!isFirst && <div className="stop-row-rail-top" />}

          {/* Bottom Rail Segment */}
          {!isLast && <div className="stop-row-rail-bottom" />}

          {/* The Distinct Stop Node */}
          <div
            className={`stop-node ${
              isPassed
                ? "node-passed"
                : isNext
                ? "node-next"
                : isTerminal
                ? "node-terminal"
                : isDestination
                ? "node-destination"
                : isYou
                ? "node-you"
                : "node-upcoming"
            }`}
            style={{ marginTop: `${nodeTopMargin}px` }}
          >
            {isTerminal && !isDestination && <Flag size={8} />}
            {isDestination && <Flag size={9} />}
          </div>
        </div>

        {/* 2. TEXT COLUMN (minmax(0, 1fr)) */}
        <div className="stop-row-text">
          <div className="stop-row-title" style={{ lineHeight: isHindi ? 1.6 : 1.4 }}>
            {primary}
          </div>

          {secondary && (
            <div className="stop-row-subtitle" style={{ lineHeight: isHindi ? 1.6 : 1.4 }}>
              {secondary}
            </div>
          )}

          {/* Status Chips */}
          <div className="stop-row-chips" aria-hidden="true">
            {liveBus && (
              <span
                className="stop-chip"
                style={{
                  background: "#18181b",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.6875rem",
                  padding: "2px 8px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                <span>Bus {liveBus.route_id}</span>
                {liveBus.reg_no && (
                  <span style={{ opacity: 0.8, fontSize: "0.625rem" }}>· {liveBus.reg_no}</span>
                )}
              </span>
            )}
            {isNext && !liveBus && (
              <span className="stop-chip stop-chip-next">
                {isHindi ? "अगला स्टॉप" : "Next stop"}
              </span>
            )}
            {isYou && (
              <span className="stop-chip stop-chip-you">{isHindi ? "आप" : "You"}</span>
            )}
            {isDestination && (
              <span className="stop-chip stop-chip-drop">
                {isHindi ? "गंतव्य" : "Drop here"}
              </span>
            )}
            {isTerminal && !isDestination && (
              <span className="stop-chip stop-chip-tag">
                <Flag size={10} />
                <span>{isHindi ? "टर्मिनल" : "Terminal"}</span>
              </span>
            )}
            {isMetro && (
              <span className="stop-chip stop-chip-tag">
                <Train size={10} />
                <span>Metro</span>
              </span>
            )}
            {isInterchange && (
              <span className="stop-chip stop-chip-tag">
                <Users size={10} />
                <span>{isHindi ? "इंटरचेंज" : "Interchange"}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. TIME COLUMN (72px, right-aligned) */}
        <div className="stop-row-time" aria-hidden="true">
          {isPassed ? (
            <div className="stop-row-passed-caption">
              {isHindi ? "छूट गया" : "Passed"}
            </div>
          ) : eta !== null ? (
            <>
              <div
                className={`stop-row-eta-line ${isEtaRolling ? "eta-roll-animate" : ""}`}
              >
                {eta < 1 ? (
                  <span className="stop-row-eta-num" style={{ fontSize: "1rem" }}>
                    {isHindi ? "अभी" : "Now"}
                  </span>
                ) : eta > 90 ? (
                  <span className="stop-row-eta-num" style={{ fontSize: "1rem" }}>
                    90+
                  </span>
                ) : (
                  <span className="stop-row-eta-num">{eta}</span>
                )}
                {eta >= 1 && <span className="stop-row-eta-unit">min</span>}
              </div>

              {clock && <div className="stop-row-clock">{clock}</div>}
            </>
          ) : (
            <div className="stop-row-passed-caption" style={{ color: "var(--text-muted)" }}>
              --
            </div>
          )}
        </div>

        {/* 4. CHEVRON COLUMN (24px) */}
        <div
          className="stop-row-chevron"
          style={{ marginTop: `${chevronTopMargin}px` }}
          aria-hidden="true"
        >
          <ChevronDown size={20} />
        </div>
      </button>

      {/* INLINE EXPANSION PANEL */}
      <div className={`stop-row-panel ${isExpanded ? "is-expanded" : ""}`}>
        <div className="stop-row-panel-inner">
          <div className="stop-row-panel-content">
            {/* Segment info */}
            {(stepKm !== undefined || stepMin !== undefined) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                <span>
                  {isHindi ? "दूरी और समय:" : "Segment:"} <b>{stepKm ?? 0.8} km</b> · ~
                  {stepMin ?? 2} min
                </span>
              </div>
            )}

            {/* Candidate buses if present */}
            {candidateBuses && candidateBuses.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  className="text-caption"
                  style={{
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {isHindi ? "अगली बसें" : "Approaching buses"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {candidateBuses.slice(0, 3).map((b) => (
                    <div
                      key={b.bus_id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: "var(--surface-2)",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Bus {b.route_id}</span>
                      <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {Math.round(b.eta_min)}m
                      </span>
                      {b.load_pct !== undefined && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 4px",
                            borderRadius: 4,
                            background:
                              b.load_pct > 80
                                ? "rgba(239, 68, 68, 0.15)"
                                : b.load_pct > 50
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(16, 185, 129, 0.15)",
                            color:
                              b.load_pct > 80
                                ? "var(--crowd-high)"
                                : b.load_pct > 50
                                ? "var(--crowd-med)"
                                : "var(--crowd-low)",
                            fontWeight: 600,
                          }}
                        >
                          {b.load_pct}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 44px Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {onSelectStop && (
                <button
                  type="button"
                  className={isYou ? "btn-pill-primary" : "btn-pill-secondary"}
                  style={{ height: 44, minHeight: 44, padding: "0 16px", fontSize: 13 }}
                  onClick={() => {
                    onSelectStop(stop.id);
                    onAlert?.(
                      isHindi
                        ? `बोर्डिंग स्टॉप सेट: ${primary}`
                        : `Boarding stop set: ${primary}`
                    );
                  }}
                >
                  <MapPin size={15} />
                  <span>{isHindi ? "मेरा स्टॉप सेट करें" : "Set as my stop"}</span>
                </button>
              )}

              {onSetDestination && (
                <button
                  type="button"
                  className={isDestination ? "btn-pill-primary" : "btn-pill-secondary"}
                  style={{ height: 44, minHeight: 44, padding: "0 16px", fontSize: 13 }}
                  onClick={() => {
                    onSetDestination(stop.id);
                    onAlert?.(
                      isHindi
                        ? `गंतव्य सेट: ${primary}`
                        : `Set as destination: ${primary}`
                    );
                  }}
                >
                  <Flag size={15} />
                  <span>{isHindi ? "गंतव्य सेट करें" : "Set as destination"}</span>
                </button>
              )}

              {onAlert && (
                <button
                  type="button"
                  className="btn-pill-secondary"
                  style={{ height: 44, minHeight: 44, padding: "0 16px", fontSize: 13 }}
                  onClick={() => {
                    onAlert(
                      isHindi
                        ? `अलर्ट सेट: ${primary}`
                        : `Arrival alert set for ${primary}`
                    );
                  }}
                >
                  <Bell size={15} />
                  <span>{isHindi ? "आगमन अलर्ट" : "Set arrival alert"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
});

/**
 * Skeleton StopRow that matches the exact 4-column CSS grid to prevent any layout shift.
 */
export function StopRowSkeleton({ isFirst = false, isLast = false }: { isFirst?: boolean; isLast?: boolean }) {
  return (
    <li className="stop-row-item">
      <div className="stop-row-skeleton">
        {/* Rail */}
        <div className="stop-row-rail" aria-hidden="true">
          {!isFirst && <div className="stop-row-rail-top" />}
          {!isLast && <div className="stop-row-rail-bottom" />}
          <div
            className="stop-node node-upcoming"
            style={{
              marginTop: "5.2px",
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          />
        </div>

        {/* Text */}
        <div className="stop-row-text" style={{ gap: 6 }}>
          <div
            style={{
              width: "70%",
              height: 16,
              borderRadius: 6,
              background: "var(--surface-2)",
            }}
          />
          <div
            style={{
              width: "45%",
              height: 12,
              borderRadius: 4,
              background: "var(--surface-2)",
            }}
          />
        </div>

        {/* Time */}
        <div className="stop-row-time" style={{ gap: 4 }}>
          <div
            style={{
              width: 36,
              height: 18,
              borderRadius: 4,
              background: "var(--surface-2)",
            }}
          />
          <div
            style={{
              width: 48,
              height: 12,
              borderRadius: 4,
              background: "var(--surface-2)",
            }}
          />
        </div>

        {/* Chevron */}
        <div className="stop-row-chevron" style={{ marginTop: "1.2px" }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: "var(--surface-2)",
            }}
          />
        </div>
      </div>
    </li>
  );
}
