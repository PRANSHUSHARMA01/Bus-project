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
import { StopRow } from "./StopRow";

interface CorridorTimelineProps {
  route: Route;
  bus?: Bus | null;
  allBuses?: Bus[];
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
  liveBus?: Bus | null;
}

export function CorridorTimeline({
  route,
  bus,
  allBuses,
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

    // Map each bus on this corridor to its closest stop
    const busList = allBuses && allBuses.length > 0 ? allBuses : bus ? [bus] : [];
    const busByStopId: Record<string, Bus> = {};
    busList.forEach((b) => {
      let closestIdx = 0;
      let minDist = Infinity;
      route.stops.forEach((st, sIdx) => {
        const dLat = (st.lat - b.lat) * 111.0;
        const dLng = (st.lng - b.lng) * 111.0 * Math.cos((st.lat * Math.PI) / 180);
        const d = Math.sqrt(dLat * dLat + dLng * dLng);
        if (d < minDist) {
          minDist = d;
          closestIdx = sIdx;
        }
      });
      const targetStop = route.stops[closestIdx];
      if (targetStop) {
        // Tracked bus takes priority if multiple buses share stop
        if (!busByStopId[targetStop.id] || (bus && String(b.bus_id) === String(bus.bus_id))) {
          busByStopId[targetStop.id] = b;
        }
      }
    });

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
      const liveBusAtStop = busByStopId[st.id] ?? null;

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
        liveBus: liveBusAtStop,
      };
    });
  }, [route.stops, lang, nextStopIndex, selectedStopId, finalDestId, allBuses, bus]);

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
        className="stop-timeline-list"
        aria-label={lang === "hi" ? "रूट के स्टॉप की सूची" : "Stops on this route"}
      >
        {visibleStops.map((item, rowIdx) => {
          const isNext = item.state === "next";
          const isFirst = rowIdx === 0;
          const isLast = rowIdx === visibleStops.length - 1;

          return (
            <StopRow
              key={item.stop.id}
              ref={isNext ? nextStopRef : null}
              stop={item.stop}
              index={rowIdx}
              isFirst={isFirst}
              isLast={isLast}
              state={item.state}
              isTerminal={item.isTerminal}
              isMetro={item.isMetro}
              isInterchange={item.isInterchange}
              isYou={item.isYou}
              isDestination={item.isDestination}
              etaMin={item.etaMin}
              clockTime={item.clockTime}
              primaryName={item.primaryName}
              secondaryName={item.secondaryName}
              stepKm={item.stepKm}
              stepMin={item.stepMin}
              liveBus={
                item.liveBus
                  ? {
                      route_id: item.liveBus.route_id,
                      reg_no: item.liveBus.reg_no,
                      speed_kmh: item.liveBus.speed_kmh,
                    }
                  : null
              }
              isExpanded={expandedStopId === item.stop.id}
              onToggleExpand={() => toggleExpand(item.stop.id)}
              onSelectStop={onSelectStop}
              onSetDestination={(id) => {
                setDestinationStopId(id);
                onSetDestination?.(id);
              }}
              onAlert={onNotify}
              lang={lang}
            />
          );
        })}
      </ol>
    </div>
  );
}

function roundOne(val: number): number {
  return Math.round(val * 10) / 10;
}
