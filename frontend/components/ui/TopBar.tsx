"use client";

import { Bell, ChevronDown } from "lucide-react";

interface TopBarProps {
  currentLocationName: string;
  onOpenLocationSheet: () => void;
  unreadAlertsCount: number;
  onOpenAlertsSheet: () => void;
}

export function TopBar({
  currentLocationName,
  onOpenLocationSheet,
  unreadAlertsCount,
  onOpenAlertsSheet,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <button
        onClick={onOpenLocationSheet}
        className="location-picker-btn"
        aria-label={`Current location: ${currentLocationName}. Tap to change location.`}
      >
        <span className="location-blue-dot" aria-hidden="true" />
        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentLocationName}
        </span>
        <ChevronDown size={15} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
      </button>

      <button
        onClick={onOpenAlertsSheet}
        className="btn-pill-secondary"
        style={{ minHeight: 40, padding: "0 14px", fontSize: 13, gap: 6 }}
        aria-label={`View live network alerts. ${unreadAlertsCount} active alerts.`}
      >
        <Bell size={16} aria-hidden="true" />
        <span>Alerts</span>
        {unreadAlertsCount > 0 && (
          <span
            style={{
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 999,
              background: "var(--accent-red)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
            }}
          >
            {unreadAlertsCount}
          </span>
        )}
      </button>
    </header>
  );
}
