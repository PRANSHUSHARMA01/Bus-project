"use client";

import React from "react";

interface IllusProps {
  className?: string;
  style?: React.CSSProperties;
}

export function FindBusIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.95 0.03 260)" />
      {/* Route Line with Stops */}
      <path d="M 20 140 Q 80 40 160 90 T 220 50" fill="none" stroke="oklch(0.55 0.22 262)" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 8" />
      <circle cx="50" cy="115" r="7" fill="#ffffff" stroke="oklch(0.55 0.22 262)" strokeWidth="3" />
      <circle cx="120" cy="72" r="7" fill="#ffffff" stroke="oklch(0.55 0.22 262)" strokeWidth="3" />
      <circle cx="190" cy="65" r="9" fill="oklch(0.55 0.22 262)" stroke="#ffffff" strokeWidth="3" />
      {/* Geometric Bus Icon */}
      <g transform="translate(100, 45)">
        <rect x="0" y="0" width="70" height="42" rx="10" fill="oklch(0.80 0.17 75)" />
        <rect x="5" y="6" width="16" height="18" rx="4" fill="oklch(0.92 0.04 235)" />
        <rect x="26" y="6" width="18" height="18" rx="4" fill="oklch(0.92 0.04 235)" />
        <rect x="49" y="6" width="16" height="18" rx="4" fill="oklch(0.92 0.04 235)" />
        <rect x="0" y="27" width="70" height="7" fill="oklch(0.62 0.11 195)" />
        <circle cx="16" cy="42" r="8" fill="oklch(0.20 0.02 260)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="54" cy="42" r="8" fill="oklch(0.20 0.02 260)" stroke="#ffffff" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function PlanTripIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.96 0.03 90)" />
      {/* Winding Dotted Journey Path */}
      <path d="M 40 140 C 60 70, 140 150, 180 60" fill="none" stroke="oklch(0.25 0.02 260)" strokeWidth="4" strokeDasharray="6 6" />
      {/* Origin Marker */}
      <circle cx="40" cy="140" r="14" fill="oklch(0.70 0.18 150)" />
      <circle cx="40" cy="140" r="6" fill="#ffffff" />
      {/* Interchange Transfer Hub */}
      <circle cx="115" cy="105" r="12" fill="oklch(0.80 0.17 75)" />
      <circle cx="115" cy="105" r="5" fill="#ffffff" />
      {/* Destination Pin */}
      <g transform="translate(165, 30)">
        <path d="M 15 0 C 6.7 0 0 6.7 0 15 C 0 26 15 42 15 42 C 15 42 30 26 30 15 C 30 6.7 23.3 0 15 0 Z" fill="oklch(0.62 0.24 355)" />
        <circle cx="15" cy="14" r="6" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function SeatFinderIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.94 0.03 150)" />
      {/* 3x3 Bus Seat Matrix */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => {
          const isGlowing = row === 1 && col === 2;
          const isOccupied = !isGlowing && (row + col) % 2 === 0;
          const x = 50 + col * 40;
          const y = 35 + row * 40;
          return (
            <g key={`${row}-${col}`}>
              {isGlowing && (
                <rect x={x - 4} y={y - 4} width="36" height="36" rx="10" fill="oklch(0.80 0.17 75 / 0.4)" />
              )}
              <rect
                x={x}
                y={y}
                width="28"
                height="28"
                rx="6"
                fill={isGlowing ? "oklch(0.80 0.17 75)" : isOccupied ? "oklch(0.35 0.02 260)" : "oklch(0.70 0.18 150)"}
                stroke={isGlowing ? "#ffffff" : "none"}
                strokeWidth={isGlowing ? 2 : 0}
              />
            </g>
          );
        })
      )}
    </svg>
  );
}

export function NightBusesIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.18 0.02 260)" />
      {/* Crescent Moon */}
      <path d="M 180 30 A 25 25 0 1 0 205 65 A 20 20 0 1 1 180 30 Z" fill="oklch(0.85 0.16 85)" />
      {/* Stars */}
      <circle cx="50" cy="40" r="3" fill="oklch(0.95 0.03 90)" opacity="0.8" />
      <circle cx="110" cy="25" r="2" fill="oklch(0.95 0.03 90)" opacity="0.9" />
      <circle cx="140" cy="65" r="2.5" fill="oklch(0.95 0.03 90)" opacity="0.7" />
      {/* Night Bus Silhouette with Glowing Headlights */}
      <g transform="translate(45, 80)">
        <polygon points="120,40 220,10 220,70" fill="oklch(0.95 0.18 85 / 0.2)" />
        <rect x="10" y="20" width="110" height="50" rx="10" fill="oklch(0.28 0.02 260)" stroke="oklch(0.40 0.02 260)" strokeWidth="2" />
        <rect x="20" y="28" width="22" height="18" rx="4" fill="oklch(0.80 0.17 75)" opacity="0.9" />
        <rect x="50" y="28" width="22" height="18" rx="4" fill="oklch(0.80 0.17 75)" opacity="0.9" />
        <rect x="80" y="28" width="22" height="18" rx="4" fill="oklch(0.80 0.17 75)" opacity="0.9" />
        <circle cx="118" cy="52" r="6" fill="oklch(0.95 0.18 85)" />
      </g>
    </svg>
  );
}

export function FaresIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.94 0.04 355)" />
      {/* Ticket Pass */}
      <g transform="translate(40, 40) rotate(-6)">
        <rect x="0" y="0" width="110" height="70" rx="8" fill="oklch(0.62 0.24 355)" />
        <rect x="10" y="10" width="90" height="50" rx="4" fill="#ffffff" opacity="0.2" />
        <line x1="80" y1="0" x2="80" y2="70" stroke="oklch(0.94 0.04 355)" strokeWidth="3" strokeDasharray="4 4" />
      </g>
      {/* Shiny Rupee Coin */}
      <g transform="translate(130, 75)">
        <circle cx="40" cy="40" r="36" fill="oklch(0.80 0.17 75)" stroke="#ffffff" strokeWidth="3" />
        <circle cx="40" cy="40" r="30" fill="none" stroke="oklch(0.72 0.16 75)" strokeWidth="2" />
        <text x="40" y="52" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="bold" fontFamily="sans-serif">
          ₹
        </text>
      </g>
    </svg>
  );
}

export function TimetablesIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.95 0.03 235)" />
      {/* Big Analog Clock */}
      <circle cx="90" cy="90" r="50" fill="#ffffff" stroke="oklch(0.55 0.22 262)" strokeWidth="6" />
      <circle cx="90" cy="90" r="5" fill="oklch(0.18 0.02 260)" />
      <line x1="90" y1="90" x2="90" y2="58" stroke="oklch(0.18 0.02 260)" strokeWidth="5" strokeLinecap="round" />
      <line x1="90" y1="90" x2="118" y2="90" stroke="oklch(0.62 0.24 355)" strokeWidth="4" strokeLinecap="round" />
      {/* Headway Bars */}
      <rect x="160" y="55" width="55" height="14" rx="4" fill="oklch(0.55 0.22 262)" />
      <rect x="160" y="80" width="40" height="14" rx="4" fill="oklch(0.70 0.18 150)" />
      <rect x="160" y="105" width="50" height="14" rx="4" fill="oklch(0.80 0.17 75)" />
    </svg>
  );
}

export function SafetyIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.94 0.04 27)" />
      {/* Security Shield */}
      <g transform="translate(70, 30)">
        <path d="M 50 0 L 100 20 L 100 65 C 100 100 50 125 50 125 C 50 125 0 100 0 65 L 0 20 Z" fill="oklch(0.58 0.23 27)" stroke="#ffffff" strokeWidth="4" />
        <path d="M 50 15 L 85 30 L 85 62 C 85 88 50 108 50 108 C 50 108 15 88 15 62 L 15 30 Z" fill="#ffffff" opacity="0.2" />
        {/* Siren / Alert Icon Inside Shield */}
        <circle cx="50" cy="55" r="14" fill="#ffffff" />
        <rect x="46" y="73" width="8" height="16" rx="4" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function HelpIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.95 0.02 90)" />
      {/* Emergency Red Cross on White Circle */}
      <circle cx="120" cy="90" r="54" fill="#ffffff" stroke="oklch(0.20 0.02 260)" strokeWidth="3" />
      <rect x="108" y="55" width="24" height="70" rx="4" fill="oklch(0.58 0.23 27)" />
      <rect x="85" y="78" width="70" height="24" rx="4" fill="oklch(0.58 0.23 27)" />
    </svg>
  );
}

export function DepotsIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.93 0.03 260)" />
      {/* Depot Hangar with Buses */}
      <path d="M 20 140 L 20 60 Q 120 20 220 60 L 220 140 Z" fill="oklch(0.35 0.02 260)" />
      <rect x="45" y="80" width="40" height="60" rx="6" fill="oklch(0.80 0.17 75)" />
      <rect x="100" y="80" width="40" height="60" rx="6" fill="oklch(0.70 0.18 150)" />
      <rect x="155" y="80" width="40" height="60" rx="6" fill="oklch(0.55 0.22 262)" />
    </svg>
  );
}

export function AlertsIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.95 0.04 75)" />
      {/* Warning Triangle */}
      <g transform="translate(65, 30)">
        <polygon points="55,5 110,105 0,105" fill="oklch(0.80 0.17 75)" stroke="oklch(0.20 0.02 260)" strokeWidth="6" strokeLinejoin="round" />
        <rect x="50" y="42" width="10" height="34" rx="4" fill="oklch(0.20 0.02 260)" />
        <circle cx="55" cy="90" r="5.5" fill="oklch(0.20 0.02 260)" />
      </g>
    </svg>
  );
}

export function ReportIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.95 0.03 200)" />
      {/* Clipboard with Checkmarks */}
      <rect x="65" y="30" width="110" height="125" rx="10" fill="#ffffff" stroke="oklch(0.20 0.02 260)" strokeWidth="4" />
      <rect x="95" y="20" width="50" height="18" rx="6" fill="oklch(0.20 0.02 260)" />
      <line x1="90" y1="65" x2="150" y2="65" stroke="oklch(0.55 0.22 262)" strokeWidth="6" strokeLinecap="round" />
      <line x1="90" y1="95" x2="150" y2="95" stroke="oklch(0.70 0.18 150)" strokeWidth="6" strokeLinecap="round" />
      <line x1="90" y1="125" x2="135" y2="125" stroke="oklch(0.80 0.17 75)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function FAQsIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.96 0.03 300)" />
      {/* Speech Bubbles with Question Mark */}
      <g transform="translate(60, 40)">
        <rect x="0" y="0" width="90" height="65" rx="12" fill="oklch(0.55 0.22 262)" />
        <polygon points="20,65 35,65 15,82" fill="oklch(0.55 0.22 262)" />
        <text x="45" y="47" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="bold" fontFamily="sans-serif">
          ?
        </text>
      </g>
    </svg>
  );
}

export function FeedbackIllustration({ style }: IllusProps) {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="240" height="180" fill="oklch(0.96 0.04 85)" />
      {/* Glowing 5-Star Rating */}
      <g transform="translate(45, 65)">
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon
            key={i}
            points="15,0 19,11 31,11 21,18 25,30 15,22 5,30 9,18 -1,11 11,11"
            fill={i < 4 ? "oklch(0.80 0.17 75)" : "oklch(0.85 0.03 260)"}
            transform={`translate(${i * 32}, 0)`}
          />
        ))}
      </g>
    </svg>
  );
}

export function getServiceIllustration(id: string) {
  switch (id) {
    case "find_bus":
      return <FindBusIllustration />;
    case "plan_trip":
      return <PlanTripIllustration />;
    case "seat_finder":
      return <SeatFinderIllustration />;
    case "night_buses":
      return <NightBusesIllustration />;
    case "fares_passes":
      return <FaresIllustration />;
    case "timetables":
      return <TimetablesIllustration />;
    case "safety_sos":
      return <SafetyIllustration />;
    case "emergency_contacts":
      return <HelpIllustration />;
    case "depots":
      return <DepotsIllustration />;
    case "service_alerts":
      return <AlertsIllustration />;
    case "report_problem":
      return <ReportIllustration />;
    case "faqs":
      return <FAQsIllustration />;
    case "feedback":
      return <FeedbackIllustration />;
    default:
      return <FindBusIllustration />;
  }
}
