"use client";

import React from "react";

interface AvatarProps {
  name: string;
  userId?: string;
  size?: number;
  role?: string;
  showDetails?: boolean;
  email?: string;
}

export function getDeterministicColor(id: string): { bg: string; fg: string } {
  const palette = [
    { bg: "oklch(0.80 0.17 75)", fg: "oklch(0.18 0.02 260)" },   // Saffron
    { bg: "oklch(0.55 0.22 262)", fg: "oklch(1 0 0)" },          // Electric blue
    { bg: "oklch(0.62 0.24 355)", fg: "oklch(1 0 0)" },          // Magenta
    { bg: "oklch(0.70 0.18 150)", fg: "oklch(0.18 0.02 260)" },  // Green
    { bg: "oklch(0.60 0.18 200)", fg: "oklch(1 0 0)" },          // Teal
    { bg: "oklch(0.45 0.15 280)", fg: "oklch(1 0 0)" },          // Indigo
  ];
  let hash = 0;
  for (let i = 0; i < (id || "default").length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

export function Avatar({
  name,
  userId = "default",
  size = 64,
  role = "Passenger",
  showDetails = false,
  email
}: AvatarProps) {
  const initial = (name ? name.charAt(0) : "P").toUpperCase();
  const colors = getDeterministicColor(userId);
  const fontSize = size === 64 ? "1.75rem" : `${Math.round(size * 0.42)}px`;

  const circle = (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: colors.bg,
        color: colors.fg,
        fontWeight: 600,
        fontSize: fontSize,
        lineHeight: 1,
        boxShadow: "0 2px 8px oklch(0 0 0 / 0.12)",
        outline: "1px solid oklch(0 0 0 / 0.08)",
        outlineOffset: "-1px",
        userSelect: "none",
      }}
      aria-label={`Avatar for ${name || "User"}`}
    >
      <span style={{ transform: "translateY(-1px)" }}>{initial}</span>
    </div>
  );

  if (!showDetails) {
    return circle;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", minWidth: 0 }}>
      {circle}
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <h2
            className="text-heading"
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {name || "Delhi Commuter"}
          </h2>
          <span
            style={{
              height: 20,
              padding: "0 8px",
              borderRadius: "var(--r-chip)",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              lineHeight: 1,
              textTransform: "capitalize",
              flexShrink: 0,
            }}
          >
            {role}
          </span>
        </div>
        {email && (
          <p
            className="text-caption"
            style={{
              color: "var(--text-muted)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </p>
        )}
      </div>
    </div>
  );
}
