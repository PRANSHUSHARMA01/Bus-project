"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface PromoBannerProps {
  badge?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonClick: () => void;
}

export function PinkPassIllustration() {
  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Warm Saffron Background Field */}
      <rect width="200" height="160" rx="16" fill="oklch(0.80 0.17 75)" />

      {/* Decorative sun rays / circle */}
      <circle cx="160" cy="30" r="24" fill="oklch(0.86 0.16 85 / 0.4)" />

      {/* Back Pink Ticket Pass (rotated) */}
      <g transform="translate(25, 42) rotate(-10)">
        <rect x="0" y="0" width="115" height="72" rx="8" fill="oklch(0.55 0.22 355)" />
        <rect x="8" y="8" width="99" height="56" rx="4" fill="#ffffff" opacity="0.2" />
        <line x1="85" y1="0" x2="85" y2="72" stroke="oklch(0.80 0.17 75)" strokeWidth="3" strokeDasharray="4 4" />
      </g>

      {/* Front Pink Ticket Pass (overlapping) */}
      <g transform="translate(42, 46) rotate(4)">
        <rect x="0" y="0" width="120" height="74" rx="8" fill="oklch(0.62 0.24 355)" stroke="#ffffff" strokeWidth="1.5" />
        <rect x="8" y="8" width="104" height="58" rx="4" fill="#ffffff" opacity="0.15" />
        <line x1="88" y1="0" x2="88" y2="74" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="4 4" />
        <text x="44" y="36" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          PINK PASS
        </text>
        <text x="44" y="50" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" opacity="0.85" fontFamily="sans-serif">
          DTC DELHI
        </text>
      </g>

      {/* Rupee 0 Symbol Stamp */}
      <g transform="translate(126, 82)">
        <circle cx="24" cy="24" r="22" fill="#ffffff" stroke="oklch(0.62 0.24 355)" strokeWidth="2.5" />
        <text x="24" y="32" textAnchor="middle" fill="oklch(0.62 0.24 355)" fontSize="20" fontWeight="bold" fontFamily="sans-serif">
          ₹0
        </text>
      </g>
    </svg>
  );
}

export function PromoBanner({
  badge = "DELHI GOVT SCHEME",
  title,
  subtitle,
  buttonText,
  onButtonClick,
}: PromoBannerProps) {
  return (
    <div
      onClick={onButtonClick}
      className="btn-press"
      style={{
        width: "100%",
        borderRadius: 20,
        background: "#000000",
        color: "#ffffff",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
        position: "relative",
        overflow: "hidden",
        marginBottom: "var(--s6)",
      }}
      role="region"
      aria-label={title}
    >
      {/* Left 55% Content */}
      <div style={{ width: "55%", zIndex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "+0.08em",
              color: "oklch(0.80 0.17 75)",
            }}
          >
            {badge}
          </span>
        )}
        <h2
          style={{
            margin: 0,
            fontSize: "1.125rem",
            fontWeight: 800,
            lineHeight: 1.25,
            color: "#ffffff",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </p>

        {/* 44px White Pill CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onButtonClick();
          }}
          className="btn-press"
          style={{
            marginTop: 8,
            height: 44,
            padding: "0 20px",
            borderRadius: 999,
            background: "#ffffff",
            color: "#000000",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: "0.875rem",
            fontWeight: 700,
            width: "fit-content",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <span>{buttonText}</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right 45% Artwork on Warm Saffron Field */}
      <div
        style={{
          width: "43%",
          aspectRatio: "4/3",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <PinkPassIllustration />
      </div>
    </div>
  );
}
