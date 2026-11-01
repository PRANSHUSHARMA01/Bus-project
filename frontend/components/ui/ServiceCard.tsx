"use client";

import React from "react";
import { ServiceItem } from "@/lib/services";
import { getServiceIllustration } from "@/components/illustrations/ServiceIllustrations";

interface ServiceCardProps {
  service: ServiceItem;
  lang?: string;
  onClick: (service: ServiceItem) => void;
  staggerIndex?: number;
}

export function ServiceCard({
  service,
  lang = "en",
  onClick,
  staggerIndex = 0
}: ServiceCardProps) {
  const isSOS = service.badge === "SOS";
  const isNew = service.badge === "New";
  const isBeta = service.badge === "Beta";
  const isGTFS = service.badge === "GTFS data";

  let badgeBg = "var(--surface-2)";
  let badgeColor = "var(--text)";

  if (isSOS) {
    badgeBg = "oklch(0.55 0.24 27)";
    badgeColor = "#ffffff";
  } else if (isNew) {
    badgeBg = "oklch(0.50 0.22 262)";
    badgeColor = "#ffffff";
  } else if (isBeta) {
    badgeBg = "oklch(0.80 0.17 75)";
    badgeColor = "oklch(0.18 0.02 260)";
  } else if (isGTFS) {
    badgeBg = "oklch(0.48 0.18 150)";
    badgeColor = "#ffffff";
  }

  return (
    <button
      onClick={() => onClick(service)}
      className="btn-press stagger-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: 8, // 8px padding around 18px radius art = 26px concentric card
        background: "var(--surface)",
        borderRadius: 24,
        boxShadow: "var(--ring)",
        border: "1px solid transparent",
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        position: "relative",
        animationDelay: `${staggerIndex * 40}ms`,
        opacity: 1,
        outline: "none",
        transition: "transform 150ms ease, box-shadow 150ms ease",
      }}
      aria-label={`${service.title}: ${service.subtitle}`}
    >
      {/* 1. Large Illustrated Art Area on Top (Aspect 4:3, Radius 18) */}
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          background: "var(--surface-2)",
        }}
      >
        {getServiceIllustration(service.id)}

        {/* 22px Single-line Pill Badge on Top-Left Corner */}
        {service.badge && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              height: 22,
              padding: "0 8px",
              borderRadius: 999,
              background: badgeBg,
              color: badgeColor,
              boxShadow: "0 0 0 1.5px var(--paper), 0 2px 4px rgba(0,0,0,0.18)",
              fontSize: 10,
              lineHeight: "22px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "+0.04em",
              whiteSpace: "nowrap",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {service.badge}
          </span>
        )}
      </div>

      {/* 2. Title + Single-Line Subtitle below Art */}
      <div style={{ padding: "10px 6px 4px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        <h2
          className="text-heading"
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            margin: 0,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.25,
          }}
        >
          {lang === "hi" ? service.title_hi : service.title}
        </h2>
        <p
          className="text-caption"
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}
        >
          {lang === "hi" ? service.subtitle_hi : service.subtitle}
        </p>
      </div>
    </button>
  );
}
