"use client";

import React from "react";
import { LucideIcon, ShieldAlert, Sparkles, Radio } from "lucide-react";

export type BadgeType = "sos" | "live" | "new" | "promo" | "default";

export interface ShortcutItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | null;
  badgeType?: BadgeType;
  onClick: () => void;
}

interface ShortcutGridProps {
  shortcuts: ShortcutItem[];
}

export function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  return (
    <div
      className="shortcut-grid"
      role="group"
      aria-label="Quick transit shortcuts"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px 8px",
        justifyItems: "center",
        textAlign: "center",
        paddingTop: 12, // ensures badges on top-left edge never get clipped
        marginBottom: "var(--s6)",
        overflow: "visible",
      }}
    >
      {shortcuts.map((item) => {
        const isSOS = item.badge === "SOS" || item.badgeType === "sos";
        const isLive = item.badgeType === "live" || (item.badge && !isNaN(Number(item.badge)));
        const isNew = item.badge === "NEW" || item.badgeType === "new";
        const isPromo = item.badge === "PROMO" || item.badgeType === "promo";

        // Accessible name includes badge if present
        const accessibleName = item.badge ? `${item.label}, ${item.badge}` : item.label;

        // Semantic badge background colors
        let badgeBg = "var(--primary)";
        if (isSOS) badgeBg = "oklch(0.55 0.24 27)"; // Deep danger red >= 4.5:1 contrast
        else if (isLive) badgeBg = "oklch(0.50 0.18 150)"; // Live green
        else if (isNew) badgeBg = "oklch(0.50 0.22 262)"; // Electric blue
        else if (isPromo) badgeBg = "oklch(0.55 0.24 355)"; // Magenta

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className="shortcut-circle-btn btn-press"
            aria-label={accessibleName}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              width: "100%",
              outline: "none",
            }}
          >
            {/* 76x76 Circular Touch Target */}
            <div
              className="shortcut-circle"
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: "var(--surface-2)",
                boxShadow: "var(--ring-subtle)",
                display: "grid",
                placeItems: "center",
                marginBottom: 8,
                position: "relative",
                overflow: "visible", // Never clip edge badges
              }}
            >
              <item.icon size={28} style={{ color: "var(--text)" }} aria-hidden="true" />

              {/* Standardized Edge Badge */}
              {item.badge && (
                <span
                  className={isSOS ? "badge-sos-pulse" : ""}
                  style={{
                    position: "absolute",
                    top: -6,
                    left: -4,
                    height: 22,
                    padding: "0 8px 0 6px", // 2px less on icon side for optical alignment
                    borderRadius: 999,
                    background: badgeBg,
                    color: "#ffffff",
                    boxShadow: "0 0 0 2px var(--paper), 0 2px 6px rgba(0,0,0,0.18)",
                    fontSize: 11,
                    lineHeight: 1,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "+0.05em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    whiteSpace: "nowrap",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                >
                  {isSOS && <ShieldAlert size={12} strokeWidth={2.5} aria-hidden="true" />}
                  {isLive && <Radio size={11} strokeWidth={2.5} aria-hidden="true" />}
                  {isNew && <Sparkles size={11} strokeWidth={2.5} aria-hidden="true" />}
                  <span>{item.badge}</span>
                </span>
              )}
            </div>

            <span
              className="shortcut-label"
              style={{
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.3,
                color: "var(--text)",
                minHeight: "2.6em",
                textAlign: "center",
                width: "100%",
                textWrap: "balance",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
