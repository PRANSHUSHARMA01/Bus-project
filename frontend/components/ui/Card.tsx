"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: "subtle" | "default" | "elevated";
  interactive?: boolean;
}

export function Card({
  children,
  elevation = "default",
  interactive = false,
  className = "",
  style,
  ...props
}: CardProps) {
  const shadowMap = {
    subtle: "var(--ring-subtle)",
    default: "var(--ring)",
    elevated: "var(--ring-elevated)",
  };

  return (
    <div
      className={`${interactive ? "btn-press" : ""} ${className}`}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-card)",
        boxShadow: shadowMap[elevation],
        border: "1px solid transparent",
        padding: "16px",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
