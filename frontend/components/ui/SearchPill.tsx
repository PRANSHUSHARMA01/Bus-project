"use client";

import { Calendar, Search, X } from "lucide-react";

interface SearchPillProps {
  value: string;
  onChange: (value: string) => void;
  onOpenScheduleSheet: () => void;
  onClickPill?: () => void;
  placeholder?: string;
  scheduleLabel?: string;
}

export function SearchPill({
  value,
  onChange,
  onOpenScheduleSheet,
  onClickPill,
  placeholder = "Where to?",
  scheduleLabel = "Schedule",
}: SearchPillProps) {
  return (
    <div className="hero-search-pill" onClick={onClickPill}>
      <div className="hero-search-input-wrap">
        <Search size={20} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="hero-search-input"
          aria-label={placeholder}
        />
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            style={{ padding: 4 }}
            aria-label="Clear search query"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenScheduleSheet();
        }}
        className="hero-schedule-btn"
        aria-label="Open schedule and time selector"
      >
        <Calendar size={14} aria-hidden="true" />
        <span>{scheduleLabel}</span>
      </button>
    </div>
  );
}
