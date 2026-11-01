"use client";

import React from "react";
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
      {/* Location Picker (Left) */}
      <button
        onClick={onOpenLocationSheet}
        className="location-picker-btn"
        aria-label={`Current location: ${currentLocationName}. Tap to select bus stop.`}
      >
        <span className="location-blue-dot" aria-hidden="true" />
        <span className="location-picker-name">
          {currentLocationName}
        </span>
        <ChevronDown size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
      </button>

      {/* Alerts Pill with 18px red circle badge offset top-right with white 1px ring */}
      <div className="alerts-btn-wrap">
        <button
          onClick={onOpenAlertsSheet}
          className="alerts-pill-btn"
          aria-label={`View transit network alerts. ${unreadAlertsCount} unread.`}
        >
          <Bell size={16} aria-hidden="true" />
          <span>Alerts</span>
        </button>
        {unreadAlertsCount > 0 && (
          <span className="alerts-badge-circle" aria-hidden="true">
            {unreadAlertsCount}
          </span>
        )}
      </div>
    </header>
  );
}
