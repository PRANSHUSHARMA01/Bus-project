"use client";

import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px" }}>
      {Icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--surface-2)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 12px",
          }}
        >
          <Icon size={22} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{title}</div>
      <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 auto 16px", maxWidth: 300 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-pill-secondary" style={{ minHeight: 42, padding: "0 18px", fontSize: 13 }}>
          {actionText}
        </button>
      )}
    </div>
  );
}
