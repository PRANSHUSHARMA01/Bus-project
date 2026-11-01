"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Cookie, Check, X, ExternalLink } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("delhi_bus_consent");
      if (!consent) {
        // Show after a brief delay so page loads cleanly
        const t = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const handleAccept = async (all: boolean = true) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("delhi_bus_consent", JSON.stringify({
        essential: true,
        telemetry: all,
        timestamp: new Date().toISOString()
      }));
    }
    setIsVisible(false);

    try {
      await fetch("/api/v1/legal/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telemetry_tracking: all,
          emergency_sos_dispatch: true,
          essential_cookies: true,
        }),
      });
    } catch {
      // Non-blocking
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Consent"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 580,
        margin: "0 auto",
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.96)",
        backdropFilter: "blur(16px)",
        border: "1px solid #334155",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        color: "#F1F5F9",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#064E3B",
              border: "1px solid #059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34D399",
              flexShrink: 0,
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#fff" }}>
              Data Privacy & Telemetry Disclosure
            </h4>
            <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>
              India DPDP Act 2023 & GDPR Compliance
            </span>
          </div>
        </div>

        <button
          onClick={() => handleAccept(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            padding: 4,
          }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0, lineHeight: 1.45 }}>
        We store essential authentication cookies and cached GPS coordinates solely to provide real-time bus arrivals and AIS-140 emergency police (112) routing. No third-party ad tracking.
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
          <Link href="/privacy" style={{ color: "#34D399", textDecoration: "none", fontWeight: 700 }}>
            Privacy Policy
          </Link>
          <span style={{ color: "#475569" }}>·</span>
          <Link href="/terms" style={{ color: "#94A3B8", textDecoration: "none", fontWeight: 700 }}>
            Terms of Service
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handleAccept(false)}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#E2E8F0",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Essential Only
          </button>
          <button
            onClick={() => handleAccept(true)}
            style={{
              background: "#0A6E3F",
              border: "1px solid #34D399",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(10, 110, 63, 0.4)",
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
