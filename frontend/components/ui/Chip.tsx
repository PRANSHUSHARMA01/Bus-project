"use client";

import React from "react";

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "neutral" | "low" | "mod" | "high" | "saffron" | "accent";
  icon?: React.ReactNode;
}

export function Chip({
  children,
  variant = "neutral",
  icon,
  className = "",
  style,
  ...props
}: ChipProps) {
  const variantStyles = {
    neutral: {
      background: "var(--surface-2)",
      color: "var(--text-muted)",
      border: "1px solid var(--border)",
    },
    low: {
      background: "rgba(16, 185, 129, 0.12)",
      color: "var(--crowd-low)",
      border: "1px solid rgba(16, 185, 129, 0.2)",
    },
    mod: {
      background: "rgba(245, 158, 11, 0.12)",
      color: "var(--crowd-mod)",
      border: "1px solid rgba(245, 158, 11, 0.2)",
    },
    high: {
      background: "rgba(239, 68, 68, 0.12)",
      color: "var(--crowd-high)",
      border: "1px solid rgba(239, 68, 68, 0.2)",
    },
    saffron: {
      background: "rgba(244, 169, 0, 0.15)",
      color: "oklch(0.55 0.17 75)",
      border: "1px solid rgba(244, 169, 0, 0.3)",
      fontWeight: 600,
    },
    accent: {
      background: "rgba(37, 99, 235, 0.12)",
      color: "var(--accent)",
      border: "1px solid rgba(37, 99, 235, 0.2)",
    },
  }[variant];

  return (
    <div
      className={`tabular-nums ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        paddingInline: 10,
        borderRadius: "var(--r-chip)",
        fontSize: "0.8125rem",
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...variantStyles,
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
