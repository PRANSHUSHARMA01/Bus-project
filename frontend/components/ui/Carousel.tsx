"use client";

import React from "react";

export interface CarouselCardItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  onClick: () => void;
}

interface CarouselProps {
  cards?: CarouselCardItem[];
  title?: string;
}

export function CrowdAIArt() {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="240" height="180" fill="oklch(0.95 0.03 150)" />
      {/* Bus Interior Corridor Floor */}
      <polygon points="40,180 200,180 160,80 80,80" fill="oklch(0.85 0.02 260)" />
      <line x1="120" y1="80" x2="120" y2="180" stroke="oklch(0.70 0.18 150)" strokeWidth="4" strokeDasharray="8 8" />
      {/* Seat Rows Left and Right */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((row) => {
          const x = 120 + side * (35 + row * 18);
          const y = 90 + row * 26;
          const isFree = row === 1 && side === 1;
          return (
            <rect
              key={`${side}-${row}`}
              x={x - 14}
              y={y}
              width="28"
              height="22"
              rx="6"
              fill={isFree ? "oklch(0.70 0.18 150)" : "oklch(0.35 0.02 260)"}
              stroke={isFree ? "#ffffff" : "none"}
              strokeWidth={2}
            />
          );
        })
      )}
      {/* AI Pulse Scanner Ring */}
      <circle cx="120" cy="80" r="30" fill="none" stroke="oklch(0.70 0.18 150)" strokeWidth="3" opacity="0.6" />
      <circle cx="120" cy="80" r="15" fill="none" stroke="oklch(0.70 0.18 150)" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}

export function NightOwlArt() {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="240" height="180" fill="oklch(0.18 0.02 260)" />
      {/* Crescent Moon */}
      <path d="M 175 35 A 24 24 0 1 0 200 70 A 20 20 0 1 1 175 35 Z" fill="oklch(0.85 0.16 85)" />
      {/* Distant skyline */}
      <rect x="20" y="85" width="30" height="45" fill="oklch(0.26 0.02 260)" />
      <rect x="55" y="70" width="35" height="60" fill="oklch(0.30 0.02 260)" />
      <rect x="150" y="80" width="40" height="50" fill="oklch(0.26 0.02 260)" />
      {/* Night Bus on Road */}
      <polygon points="10,180 230,180 210,130 30,130" fill="oklch(0.12 0.02 260)" />
      <g transform="translate(60, 95)">
        <polygon points="100,28 170,10 170,45" fill="oklch(0.95 0.18 85 / 0.25)" />
        <rect x="0" y="0" width="100" height="42" rx="8" fill="oklch(0.80 0.17 75)" />
        <rect x="8" y="8" width="20" height="15" rx="3" fill="oklch(0.95 0.18 85)" />
        <rect x="34" y="8" width="20" height="15" rx="3" fill="oklch(0.95 0.18 85)" />
        <rect x="60" y="8" width="20" height="15" rx="3" fill="oklch(0.95 0.18 85)" />
        <circle cx="22" cy="42" r="7" fill="oklch(0.18 0.02 260)" />
        <circle cx="78" cy="42" r="7" fill="oklch(0.18 0.02 260)" />
      </g>
    </svg>
  );
}

export function InterchangeArt() {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="240" height="180" fill="oklch(0.94 0.04 235)" />
      {/* Blue Metro Line */}
      <path d="M 20 140 Q 100 130 140 50 L 220 30" fill="none" stroke="oklch(0.55 0.22 262)" strokeWidth="8" strokeLinecap="round" />
      {/* Green Bus Route Line */}
      <path d="M 20 50 Q 80 110 160 110 L 220 130" fill="none" stroke="oklch(0.70 0.18 150)" strokeWidth="8" strokeLinecap="round" />
      {/* Major Kashmere Gate Transfer Junction */}
      <g transform="translate(110, 85)">
        <circle cx="16" cy="16" r="22" fill="#ffffff" stroke="oklch(0.18 0.02 260)" strokeWidth="3" />
        <circle cx="16" cy="16" r="14" fill="oklch(0.80 0.17 75)" />
        <circle cx="16" cy="16" r="6" fill="#ffffff" />
      </g>
      <text x="126" y="132" textAnchor="middle" fill="oklch(0.18 0.02 260)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
        INTERCHANGE
      </text>
    </svg>
  );
}

const DEFAULT_CARDS: CarouselCardItem[] = [
  {
    id: "crowd",
    tag: "Real-time crowd AI",
    title: "Predict seat availability before boarding",
    subtitle: "AI crowd sensors updated every 15 seconds across corridors.",
    illustration: <CrowdAIArt />,
    onClick: () => {},
  },
  {
    id: "night",
    tag: "Night owl network",
    title: "Safe 22:00–05:00 routes connecting NDLS",
    subtitle: "Guaranteed bus marshals on all late-night railway routes.",
    illustration: <NightOwlArt />,
    onClick: () => {},
  },
  {
    id: "metro",
    tag: "Metro + bus interchange",
    title: "One tap to transfer at Kashmere Gate",
    subtitle: "Unified Delhi Metro & DTC cluster interchange schedules.",
    illustration: <InterchangeArt />,
    onClick: () => {},
  },
];

export function Carousel({ cards, title = "Save yourself a trip" }: CarouselProps) {
  const activeCards = cards && cards.length > 0 ? cards : DEFAULT_CARDS;

  return (
    <div className="carousel-wrap" style={{ marginBottom: "var(--s6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 className="text-title" style={{ fontSize: 20, margin: 0 }}>
          {title}
        </h2>
      </div>

      {/* Horizontal Snap Carousel: 78vw width, max 320px, gap 12px, peek on right */}
      <div
        className="carousel-snap"
        role="region"
        aria-label={title}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 8,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {activeCards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            className="btn-press"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") card.onClick();
            }}
            style={{
              flex: "0 0 78vw",
              maxWidth: 320,
              scrollSnapAlign: "start",
              padding: 8, // 8px padding around 20px radius art = concentric card
              borderRadius: 28,
              background: "var(--surface)",
              boxShadow: "var(--ring)",
              border: "1px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              outline: "none",
            }}
          >
            {/* Art Area on Top (Aspect 4:3, Radius 20) */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4/3",
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
                background: "var(--surface-2)",
              }}
            >
              {card.illustration || <CrowdAIArt />}

              {/* Tag Badge */}
              {card.tag && (
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    height: 22,
                    padding: "0 8px",
                    borderRadius: 999,
                    background: "rgba(0, 0, 0, 0.75)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    fontSize: 10,
                    lineHeight: "22px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "+0.05em",
                  }}
                >
                  {card.tag}
                </span>
              )}
            </div>

            {/* Title & Subtitle Below the Art */}
            <div style={{ padding: "12px 6px 8px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
              <h3
                className="text-heading"
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.25,
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-caption"
                style={{
                  margin: 0,
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.35,
                }}
              >
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
