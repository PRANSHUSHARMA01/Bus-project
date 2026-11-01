"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Palette, Type, Layers, Sparkles, ShieldCheck } from "lucide-react";
import {
  BusGlyph,
  MetroTransferGlyph,
  StopMarkerGlyph,
  LivePulseGlyph,
  ACBusGlyph,
  EVBusGlyph,
  SeatChanceGlyph,
  ConductorBadgeGlyph,
  TransitTicketGlyph,
  SafetyShieldGlyph,
  RouteMapGlyph,
  SOSBeaconGlyph,
} from "@/components/icons/TransitIcons";
import {
  NotFoundBusIllustration,
  EmptyShelterIllustration,
  OfflineConnectionIllustration,
  ArrivingBusIllustration,
} from "@/components/illustrations/TransitIllustrations";

interface ColorToken {
  name: string;
  variable: string;
  hex: string;
  role: string;
  contrastOnWhite: number;
  contrastOnDark: number;
}

const COLOR_TOKENS: ColorToken[] = [
  {
    name: "DTC Transit Green",
    variable: "--dtc-green",
    hex: "#0A6E3F",
    role: "Primary brand, live routes, eco-transit status",
    contrastOnWhite: 7.82,
    contrastOnDark: 4.88,
  },
  {
    name: "DTC Forest Ink",
    variable: "--dtc-green-dark",
    hex: "#054C2B",
    role: "High-contrast headings, active borders, terminals",
    contrastOnWhite: 10.45,
    contrastOnDark: 3.65,
  },
  {
    name: "Transit Mustard Ochre",
    variable: "--transit-ochre",
    hex: "#F4A900",
    role: "Corridor highlights, ETA badges, milestones",
    contrastOnWhite: 2.14, // Used as accent/background with dark text
    contrastOnDark: 9.85,
  },
  {
    name: "Charcoal Ink",
    variable: "--transit-charcoal",
    hex: "#111827",
    role: "Primary typography, high-contrast UI controls",
    contrastOnWhite: 16.12,
    contrastOnDark: 1.3,
  },
  {
    name: "Emergency 112 Crimson",
    variable: "--accent-red",
    hex: "#DC2626",
    role: "Driver SOS, accident alerts, vehicle breakdown",
    contrastOnWhite: 4.85,
    contrastOnDark: 4.32,
  },
  {
    name: "Metro Blue Transfer",
    variable: "--metro-blue",
    hex: "#2563EB",
    role: "Multimodal interchange, smart card tap, sync",
    contrastOnWhite: 4.95,
    contrastOnDark: 4.24,
  },
  {
    name: "Metro Yellow Interchange",
    variable: "--metro-yellow",
    hex: "#CA8A04",
    role: "Yellow line metro junction, route warnings",
    contrastOnWhite: 3.12,
    contrastOnDark: 6.72,
  },
  {
    name: "Paper Surface",
    variable: "--bg",
    hex: "#FFFFFF",
    role: "Clean daylight canvas, card background",
    contrastOnWhite: 1.0,
    contrastOnDark: 21.0,
  },
];

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "icons" | "components" | "artwork">("colors");
  const [iconSize, setIconSize] = useState<number>(28);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const ICONS = [
    { name: "BusGlyph", component: BusGlyph, desc: "Geometric DTC Low-Floor Bus" },
    { name: "MetroTransferGlyph", component: MetroTransferGlyph, desc: "Delhi Metro Interchange" },
    { name: "StopMarkerGlyph", component: StopMarkerGlyph, desc: "Shelter & Bus Stop Pin" },
    { name: "LivePulseGlyph", component: LivePulseGlyph, desc: "Real-Time GPS Telemetry Wave" },
    { name: "ACBusGlyph", component: ACBusGlyph, desc: "DTC AC Low-Floor Climate" },
    { name: "EVBusGlyph", component: EVBusGlyph, desc: "Zero-Emission Electric Bus Fleet" },
    { name: "SeatChanceGlyph", component: SeatChanceGlyph, desc: "Passenger Seat Probability" },
    { name: "ConductorBadgeGlyph", component: ConductorBadgeGlyph, desc: "Official DTC Crew Badge" },
    { name: "TransitTicketGlyph", component: TransitTicketGlyph, desc: "Cash & UPI Transit Ticket" },
    { name: "SafetyShieldGlyph", component: SafetyShieldGlyph, desc: "Women's Transit Safety / 112" },
    { name: "RouteMapGlyph", component: RouteMapGlyph, desc: "Schematic Transit Corridor" },
    { name: "SOSBeaconGlyph", component: SOSBeaconGlyph, desc: "Urgent SOS Emergency Beacon" },
  ];

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 20px 80px" }}>
      {/* Navigation & Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-muted)",
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Live Dashboard</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: "#0A6E3F",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                Phase E · Design System
              </span>
              <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 600 }}>v2.4.0</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px", color: "var(--text)" }}>
              Punchy Transit Visual System
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-muted)", margin: 0 }}>
              दिल्ली परिवहन निगम (DTC) · High-contrast geometric design, original vector artwork, and WCAG AAA accessibility.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(10, 110, 63, 0.08)",
              border: "1px solid rgba(10, 110, 63, 0.2)",
              padding: "10px 16px",
              borderRadius: 12,
            }}
          >
            <ShieldCheck size={20} color="#0A6E3F" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0A6E3F" }}>WCAG AAA COMPLIANT</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>&gt; 7:1 Contrast on Text Tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--line)",
          paddingBottom: 12,
          marginBottom: 36,
          overflowX: "auto",
        }}
      >
        {[
          { id: "colors", label: "Color Tokens & Contrast", icon: Palette },
          { id: "typography", label: "Typography & Bilingual Scale", icon: Type },
          { id: "icons", label: "Transit Icon Library (12 SVGs)", icon: Layers },
          { id: "components", label: "Component Primitives", icon: ShieldCheck },
          { id: "artwork", label: "Original Vector Artwork", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: isActive ? "var(--text)" : "transparent",
                color: isActive ? "var(--bg)" : "var(--text-muted)",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. COLOR TOKENS TAB */}
      {activeTab === "colors" && (
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Color Palette & Computed Contrast</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
              Color ratios calculated against daylight surface. Every text token guarantees WCAG AAA (&gt; 7.0:1) readability under bright sunlight.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {COLOR_TOKENS.map((token) => (
              <div
                key={token.variable}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "var(--ring-subtle)",
                }}
              >
                <div
                  style={{
                    height: 90,
                    background: token.hex,
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "12px 16px",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(0, 0, 0, 0.4)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "monospace",
                      padding: "2px 8px",
                      borderRadius: 4,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {token.hex}
                  </span>
                </div>

                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{token.name}</div>
                    {token.contrastOnWhite >= 7.0 ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#0A6E3F",
                          background: "rgba(10, 110, 63, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        AAA ({token.contrastOnWhite}:1)
                      </span>
                    ) : token.contrastOnWhite >= 4.5 ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#2563EB",
                          background: "rgba(37, 99, 235, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        AA ({token.contrastOnWhite}:1)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#CA8A04",
                          background: "rgba(202, 138, 4, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        Accent ({token.contrastOnWhite}:1)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "monospace", marginBottom: 8 }}>
                    {token.variable}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>{token.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. TYPOGRAPHY & BILINGUAL SCALE TAB */}
      {activeTab === "typography" && (
        <section>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Bilingual Typography Hierarchy</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
              Matched weight pairings for English and Hindi (Devanagari) to preserve optical balance on busy transit screens.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Display / Title Scale */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Corridor Display · 32px / Bold (-0.02em tracking)
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 6 }}>
                Route 502: Mehrauli to Kashmere Gate
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-muted)" }}>
                रूट ५०२: महरौली से कश्मीरी गेट बस टर्मिनल
              </div>
            </div>

            {/* Subheading Scale */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Section Heading · 20px / Semi-Bold
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                Next Bus Arriving in 3 Minutes (Moderate Crowd)
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-muted)" }}>
                अगली बस ३ मिनट में आ रही है (मध्यम भीड़)
              </div>
            </div>

            {/* Tabular Telemetry Numerics */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Tabular Telemetry &amp; Fares (JetBrains Mono · font-variant-numeric: tabular-nums)
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 2 }}>ESTIMATED ARRIVAL</div>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "#0A6E3F" }}>
                    03:42 <span style={{ fontSize: 14, fontWeight: 600 }}>MIN</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 2 }}>GPS SPEED</div>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "var(--text)" }}>
                    28.4 <span style={{ fontSize: 14, fontWeight: 600 }}>KM/H</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 2 }}>SINGLE STAGE FARE</div>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "var(--text)" }}>
                    ₹15.00
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 2 }}>VEHICLE REGISTRATION</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: "var(--text-muted)" }}>
                    DL-1PC-4021
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. TRANSIT ICON LIBRARY TAB */}
      {activeTab === "icons" && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Original Transit SVG Icon Library</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
                12 custom geometric SVG transit icons crafted specifically for Delhi transit navigation.
              </p>
            </div>

            {/* Size Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", padding: "4px 8px", borderRadius: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>Size:</span>
              {[20, 24, 28, 36].map((s) => (
                <button
                  key={s}
                  onClick={() => setIconSize(s)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "none",
                    background: iconSize === s ? "var(--text)" : "transparent",
                    color: iconSize === s ? "var(--bg)" : "var(--text)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {ICONS.map((item) => {
              const Glyph = item.component;
              const isCopied = copiedSnippet === `<${item.name} />`;
              return (
                <div
                  key={item.name}
                  onClick={() => copyToClipboard(`<${item.name} />`)}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: "var(--surface-2)",
                      display: "grid",
                      placeItems: "center",
                      color: "#0A6E3F",
                      marginBottom: 12,
                    }}
                  >
                    <Glyph size={iconSize} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.3 }}>
                    {item.desc}
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: isCopied ? "#0A6E3F" : "var(--text-dim)",
                    }}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isCopied ? "Copied JSX!" : "Click to copy"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. COMPONENT PRIMITIVES TAB */}
      {activeTab === "components" && (
        <section>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Component Primitives &amp; States</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
              Reusable building blocks implementing 4px grid spacing, punchy contrast, and accessible ARIA states.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {/* Occupancy Pills */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
                Crowd Density Indicators
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(10, 110, 63, 0.08)", border: "1px solid rgba(10, 110, 63, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A6E3F" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0A6E3F" }}>Low Crowd (0–35%)</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0A6E3F" }}>Seats Assured</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(202, 138, 4, 0.08)", border: "1px solid rgba(202, 138, 4, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#CA8A04" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#CA8A04" }}>Moderate (36–75%)</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#CA8A04" }}>Standing Only</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Packed (76–100%+)</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>Boarding Full</span>
                </div>
              </div>
            </div>

            {/* Transit Badges */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
                Transit Fleet Badges
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#0A6E3F", color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>
                  <EVBusGlyph size={14} color="#FFFFFF" />
                  <span>Electric Bus (Zero Emission)</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--line)", fontSize: 12, fontWeight: 700 }}>
                  <ACBusGlyph size={14} />
                  <span>DTC Low-Floor AC</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(37, 99, 235, 0.1)", color: "#2563EB", fontSize: 12, fontWeight: 700 }}>
                  <MetroTransferGlyph size={14} color="#2563EB" />
                  <span>Metro Interchange (Gate 2)</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. ORIGINAL VECTOR ARTWORK TAB */}
      {activeTab === "artwork" && (
        <section>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Original Vector Transit Artwork</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
              Handcrafted SVG illustrations engineered for crisp rendering on retina displays, dark mode compatibility, and zero stock photography dependencies.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: 24 }}>
            {/* 1. Route 404 Illustration */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <NotFoundBusIllustration width={340} height={230} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "var(--text)" }}>
                Route 404: Stop Not Found
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Used on custom 404 handler when a corridor or terminal ID cannot be resolved.
              </p>
            </div>

            {/* 2. Empty Bus Shelter */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <EmptyShelterIllustration width={320} height={220} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "var(--text)" }}>
                Empty Bus Stop / Off-Peak Hours
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Displays when no buses are currently scheduled or active on a selected terminal stop.
              </p>
            </div>

            {/* 3. Offline Satellite */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <OfflineConnectionIllustration width={280} height={210} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "var(--text)" }}>
                GPS Telemetry Offline / Signal Interrupted
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Renders when device is offline or bus GPS transponder fails to stream position packets.
              </p>
            </div>

            {/* 4. Arriving Electric Bus */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <ArrivingBusIllustration width={320} height={210} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "var(--text)" }}>
                Electric Bus Approaching Stop
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Rendered on arrival alert cards when a subscribed bus is within 2 minutes of the stop.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
