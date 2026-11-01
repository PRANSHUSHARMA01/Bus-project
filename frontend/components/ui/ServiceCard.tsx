"use client";

import React from "react";
import {
  Bus,
  MapPin,
  Users,
  Moon,
  ShieldCheck,
  HeartHandshake,
  CreditCard,
  Clock,
  PhoneCall,
  Info,
  ChevronRight
} from "lucide-react";
import { ServiceItem } from "@/lib/services";

interface ServiceCardProps {
  service: ServiceItem;
  lang?: string;
  onClick: (service: ServiceItem) => void;
  staggerIndex?: number;
}

export function ServiceCard({
  service,
  lang = "en",
  onClick,
  staggerIndex = 0
}: ServiceCardProps) {
  const getIcon = (name: string) => {
    switch (name) {
      case "Bus": return <Bus size={22} />;
      case "MapPin": return <MapPin size={22} />;
      case "Users": return <Users size={22} />;
      case "Moon": return <Moon size={22} />;
      case "ShieldCheck": return <ShieldCheck size={22} />;
      case "HeartHandshake": return <HeartHandshake size={22} />;
      case "CreditCard": return <CreditCard size={22} />;
      case "Clock": return <Clock size={22} />;
      case "PhoneCall": return <PhoneCall size={22} />;
      default: return <Info size={22} />;
    }
  };

  const isSafety = service.category === "safety" || service.id.includes("emergency");

  return (
    <button
      onClick={() => onClick(service)}
      className="btn-press stagger-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "16px",
        background: "var(--surface)",
        borderRadius: "var(--r-card)", // 20px concentric card
        boxShadow: "var(--ring)",
        border: "1px solid transparent",
        textAlign: "left",
        width: "100%",
        minHeight: "150px",
        cursor: "pointer",
        position: "relative",
        animationDelay: `${staggerIndex * 50}ms`,
        opacity: 1, // Ends visible even if animation fails
        outline: "none",
      }}
      aria-label={`${service.title}: ${service.description}`}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
        {/* 44px icon tile radius 12 */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--r-tile)", // 12px concentric tile
            background: isSafety ? "rgba(239, 68, 68, 0.12)" : "var(--surface-2)",
            color: isSafety ? "var(--crowd-high)" : "var(--accent)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {getIcon(service.icon)}
        </div>

        {service.badge && (
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "var(--r-chip)",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              letterSpacing: "+0.02em",
            }}
          >
            {service.badge}
          </span>
        )}
      </div>

      <h3
        className="text-heading"
        style={{
          fontSize: "1.0625rem",
          fontWeight: 600,
          margin: "0 0 6px 0",
          color: "var(--text)",
          lineHeight: 1.25,
        }}
      >
        {lang === "hi" ? service.title_hi : service.title}
      </h3>

      <p
        className="text-caption"
        style={{
          color: "var(--text-muted)",
          margin: 0,
          fontSize: "0.8125rem",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {lang === "hi" ? service.description_hi : service.description}
      </p>

      <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: "0.8125rem", fontWeight: 600 }}>
        <span>{lang === "hi" ? "विवरण देखें" : "Explore"}</span>
        <ChevronRight size={14} />
      </div>
    </button>
  );
}
