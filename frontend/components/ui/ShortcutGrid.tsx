"use client";

import { LucideIcon } from "lucide-react";

export interface ShortcutItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | null;
  onClick: () => void;
}

interface ShortcutGridProps {
  shortcuts: ShortcutItem[];
}

export function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  return (
    <div className="shortcut-grid" role="group" aria-label="Quick transit shortcuts">
      {shortcuts.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="shortcut-circle-btn"
          aria-label={item.label}
        >
          <div className="shortcut-circle">
            <item.icon size={26} style={{ color: "var(--text)" }} aria-hidden="true" />
            {item.badge && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  left: -2,
                  background: item.badge === "SOS" ? "var(--accent-red)" : "var(--primary)",
                  color: "var(--on-primary)",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
          <span className="shortcut-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
