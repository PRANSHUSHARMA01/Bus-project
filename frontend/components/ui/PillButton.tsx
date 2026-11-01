"use client";

import React from "react";

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "saffron";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

export function PillButton({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  children,
  className = "",
  style,
  disabled,
  ...props
}: PillButtonProps) {
  const sizeStyles = {
    sm: { height: 36, paddingInline: 14, fontSize: "0.8125rem", gap: 6 },
    md: { height: 44, paddingInline: 18, fontSize: "0.9375rem", gap: 8 },
    lg: { height: 52, paddingInline: 24, fontSize: "1.0625rem", gap: 10 },
  }[size];

  const variantStyles = {
    primary: {
      background: "var(--ink)",
      color: "oklch(1 0 0)",
      border: "1px solid transparent",
      boxShadow: "0 2px 6px oklch(0 0 0 / 0.15)",
    },
    saffron: {
      background: "var(--saffron)",
      color: "var(--ink)",
      border: "1px solid transparent",
      boxShadow: "0 2px 8px oklch(0.80 0.17 75 / 0.3)",
      fontWeight: 700,
    },
    secondary: {
      background: "var(--surface-2)",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    outline: {
      background: "transparent",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text)",
      border: "none",
    },
    danger: {
      background: "var(--crowd-high)",
      color: "oklch(1 0 0)",
      border: "1px solid transparent",
    },
  }[variant];

  // Optical alignment: 2px less padding on the icon side
  const paddingLeft = icon && iconPosition === "left" ? sizeStyles.paddingInline - 2 : sizeStyles.paddingInline;
  const paddingRight = icon && iconPosition === "right" ? sizeStyles.paddingInline - 2 : sizeStyles.paddingInline;

  return (
    <button
      disabled={disabled}
      className={`btn-press ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: sizeStyles.height,
        paddingLeft,
        paddingRight,
        gap: sizeStyles.gap,
        borderRadius: "var(--r-pill)",
        fontWeight: 600,
        fontSize: sizeStyles.fontSize,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        outline: "none",
        userSelect: "none",
        ...variantStyles,
        ...style,
      }}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "right" && (
        <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      )}
    </button>
  );
}
