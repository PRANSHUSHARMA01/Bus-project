"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Eye,
  Activity,
  Zap,
  ShieldAlert,
  Camera,
  Cpu,
  Wifi,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
  Info,
} from "lucide-react";

interface Subsystem {
  id: string;
  name: string;
  nameHi: string;
  category: "telematics" | "safety" | "powertrain" | "passenger";
  standard: string;
  coords: { x: number; y: number };
  shortDesc: string;
  fullDesc: string;
  specs: { label: string; value: string }[];
  telemetryStream: { label: string; value: string; unit: string };
}

const BUS_SUBSYSTEMS: Subsystem[] = [
  {
    id: "ais140",
    name: "AIS-140 GPS & Telematics Transponder",
    nameHi: "एआईएस-140 जीपीएस टेलीमैटिक्स यूनिट",
    category: "telematics",
    standard: "MoRTH AIS-140 / IRNSS Certified",
    coords: { x: 190, y: 55 },
    shortDesc: "Roof-mounted dual-SIM GPS sending vehicle coordinates, speed, and heading at 1Hz.",
    fullDesc:
      "Mandatory Indian transit telematics box equipped with multi-constellation GNSS (NavIC/GPS), 4G LTE eSIM failover, and battery backup. It streams live position packets directly to the Delhi Transport Department backend and central emergency response servers.",
    specs: [
      { label: "Positioning Standard", value: "NavIC (Indian IRNSS) + GPS + GLONASS" },
      { label: "Update Cadence", value: "1,000 ms (1 Hz Real-Time)" },
      { label: "Connectivity", value: "Dual 4G eSIM (BSNL + Airtel Auto-failover)" },
      { label: "Emergency Loop", value: "Hardwired to Central Vehicle Tracking Platform" },
    ],
    telemetryStream: { label: "Current Transponder Ping", value: "28.6321°N, 77.2185°E", unit: "±1.2m" },
  },
  {
    id: "sos_buttons",
    name: "Passenger Panic SOS Buttons (Every 2m)",
    nameHi: "आपातकालीन पैनिक बटन नेटवर्क",
    category: "safety",
    standard: "AIS-140 Section 4 / Delhi Nirbhaya Framework",
    coords: { x: 380, y: 130 },
    shortDesc: "Hardwired panic buttons mounted on every window pillar linked directly to 112.",
    fullDesc:
      "14 tactile panic buttons distributed evenly along the passenger cabin. Tapping instantly trips a silent alarm at the Delhi Police Command Center (112), switches internal CCTV feeds to live broadcast, and overrides external LED route displays to 'EMERGENCY'.",
    specs: [
      { label: "Pillar Spacing", value: "Every 2.0 meters on both port & starboard" },
      { label: "Response Protocol", value: "Silent 112 Police Dispatch + GPS Pin Freeze" },
      { label: "Audio-Visual Alert", value: "Hooter buzzer + External LED 'EMERGENCY' banner" },
      { label: "Tamper Proofing", value: "Line-break monitored supervised circuit" },
    ],
    telemetryStream: { label: "Circuit Status", value: "NORMAL · ARMED", unit: "14 Nodes" },
  },
  {
    id: "cctv_ai",
    name: "High-Definition AI CCTV Surveillance",
    nameHi: "सीसीटीवी एआई सुरक्षा कैमरे (३ यूनिट)",
    category: "safety",
    standard: "Nirbhaya Transit Security Specification",
    coords: { x: 260, y: 105 },
    shortDesc: "Triple-dome cameras covering passenger cabin, driver compartment, and doors.",
    fullDesc:
      "Three 1080p vandal-proof infrared IP cameras with onboard Network Video Recorder (NVR) and 30-day encrypted local storage. Connected over 4G to transmit live video streams when panic SOS is activated.",
    specs: [
      { label: "Camera Coverage", value: "Front Entrance, Cabin Corridor, Rear Exit" },
      { label: "Video Resolution", value: "Full HD 1080p @ 30 FPS HDR" },
      { label: "Night Vision", value: "Infrared Illumination up to 15 meters" },
      { label: "Storage", value: "512 GB Shock-Resistant Solid State NVR" },
    ],
    telemetryStream: { label: "NVR Health", value: "RECORDING · 30 FPS", unit: "3 Feeds" },
  },
  {
    id: "etm_validator",
    name: "Electronic Ticketing & NCMC Validator",
    nameHi: "इलेक्ट्रॉनिक टिकटिंग मशीन (ईटीएम / एनसीएमसी)",
    category: "telematics",
    standard: "National Common Mobility Card (One Nation One Card)",
    coords: { x: 170, y: 140 },
    shortDesc: "Smart card validator for Delhi Metro & DTC tap-and-go ticketing and UPI QR codes.",
    fullDesc:
      "High-speed contactless card reader supporting RuPay NCMC transit cards, Delhi Metro smart cards, Pink Passes (free travel for women), and instant dynamic UPI QR displays for rapid passenger boarding.",
    specs: [
      { label: "Supported Cards", value: "RuPay NCMC, Delhi Metro Card, Pink Concession" },
      { label: "Processing Latency", value: "< 250 milliseconds per tap" },
      { label: "Display Screen", value: "5.5-inch High-Brightness Touch Display" },
      { label: "Ticket Print Mode", value: "Thermal 58mm Paper + WhatsApp / SMS E-Ticket" },
    ],
    telemetryStream: { label: "Validator Ready", value: "TAP / UPI READY", unit: "0.2s" },
  },
  {
    id: "battery_pack",
    name: "250 kWh LFP Traction Battery Pack",
    nameHi: "२५० किलोवाट लिथियम-आयन ट्रैक्शन बैटरी",
    category: "powertrain",
    standard: "AIS-038 Rev 2 / IP67 Water Immersion Rated",
    coords: { x: 500, y: 65 },
    shortDesc: "Roof & underfloor Lithium Iron Phosphate (LFP) chemistry for thermal stability.",
    fullDesc:
      "Engineered specifically for Delhi's extreme climate (48°C peak summers). Liquid-cooled LFP battery modules with multi-tier thermal runaway protection, delivering up to 220 km of real-world urban range per charge.",
    specs: [
      { label: "Total Capacity", value: "250 kWh (Nominal 650V DC)" },
      { label: "Thermal Management", value: "Active Chilled-Liquid Glycol Cooling Loop" },
      { label: "Fast Charging", value: "Dual CCS Type 2 (150 kW DC: 10% to 80% in 55m)" },
      { label: "Weather Sealing", value: "IP67 Submersible (Deluge & Waterlogging Safe)" },
    ],
    telemetryStream: { label: "Battery State of Charge", value: "78.4%", unit: "648V" },
  },
  {
    id: "electric_motor",
    name: "Permanent Magnet Synchronous Motor (PMSM)",
    nameHi: "इलेक्ट्रिक मोटर और रीजेनेरेटिव ब्रेक",
    category: "powertrain",
    standard: "Central Motor Vehicles Rules (CMVR)",
    coords: { x: 670, y: 190 },
    shortDesc: "Rear-axle direct-drive electric motor with 2,400 Nm instantaneous peak torque.",
    fullDesc:
      "Eliminates gearboxes and clutch wear. Features intelligent regenerative braking that recaptures kinetic energy during Delhi stop-and-go traffic, replenishing the main battery while slowing down smoothly.",
    specs: [
      { label: "Peak Output", value: "245 kW (330 Horsepower)" },
      { label: "Instant Torque", value: "2,400 Nm @ 0 RPM" },
      { label: "Energy Recuperation", value: "Up to 28% recaptured via regenerative braking" },
      { label: "Transmission", value: "Single-Speed Reduction Gearbox" },
    ],
    telemetryStream: { label: "Motor Temperature", value: "62.5 °C", unit: "2,150 RPM" },
  },
  {
    id: "passenger_counter",
    name: "Automated Passenger Flow Sensors (APC)",
    nameHi: "स्वचालित यात्री भार और भीड़ सेंसर",
    category: "passenger",
    standard: "EN 13816 Public Transport Telematics",
    coords: { x: 300, y: 70 },
    shortDesc: "Dual overhead 3D stereoscopic counters measuring boarding and alighting.",
    fullDesc:
      "Mounted directly above the front and middle entry doors. Uses dual optical depth stereoscopy to count passengers stepping aboard with 98.5% accuracy, instantly calculating cabin crowd density for waiting commuters.",
    specs: [
      { label: "Sensor Technology", value: "Overhead 3D Optical Time-of-Flight (ToF)" },
      { label: "Counting Accuracy", value: "98.5% under heavy rush hour crowds" },
      { label: "Privacy Protection", value: "Edge-computed vector outlines only (Zero PII)" },
      { label: "App Integration", value: "Broadcasts Crowd Status (Low / Mod / Packed)" },
    ],
    telemetryStream: { label: "Live Occupancy", value: "24 / 60 Seats", unit: "40% Crowd" },
  },
  {
    id: "low_floor_ramp",
    name: "400mm Low Floor & Pneumatic Kneeling Ramp",
    nameHi: "लो-फ्लोर व्हीलचेयर रैंप और सस्पेंशन",
    category: "passenger",
    standard: "Rights of Persons with Disabilities (RPwD) Act, 2016",
    coords: { x: 440, y: 220 },
    shortDesc: "Pneumatic kneeling lowers bus entrance to curb level with flip-out ramp.",
    fullDesc:
      "Eliminates stairs entirely. When stopping for elderly passengers or wheelchair users, the driver activates the ECAS kneeling button to tilt the suspension by 60mm and deploys the lightweight anti-slip aluminium ramp.",
    specs: [
      { label: "Entry Height", value: "400 mm step-less floor height" },
      { label: "Kneeling System", value: "Pneumatic ECAS lowers floor to 340 mm" },
      { label: "Ramp Capacity", value: "350 kg safe working load" },
      { label: "Cabin Provision", value: "Dedicated wheelchair berth with safety harness" },
    ],
    telemetryStream: { label: "Suspension Level", value: "NORMAL RIDE", unit: "400mm" },
  },
];

export default function AnatomyPage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMode, setSpeedMode] = useState<"idle" | "city" | "corridor">("city");
  const [viewMode, setViewMode] = useState<"cutaway" | "exterior">("cutaway");
  const [activeSubsystemId, setActiveSubsystemId] = useState<string>("ais140");
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [roadOffset, setRoadOffset] = useState<number>(0);

  const activeSubsystem = BUS_SUBSYSTEMS.find((s) => s.id === activeSubsystemId) || BUS_SUBSYSTEMS[0];

  // 60 FPS animation loop
  useEffect(() => {
    if (!isPlaying || speedMode === "idle") return;

    const speedMultiplier = speedMode === "corridor" ? 2.5 : 1.2;
    let animId: number;

    const step = () => {
      setWheelRotation((prev) => (prev + 4 * speedMultiplier) % 360);
      setRoadOffset((prev) => (prev + 3 * speedMultiplier) % 100);
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speedMode]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px 80px" }}>
      {/* Top Header */}
      <div style={{ marginBottom: 28 }}>
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
          <span>Return to Live Transit Map</span>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
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
                Phase F · Interactive Anatomy
              </span>
              <span
                style={{
                  background: "rgba(244, 169, 0, 0.15)",
                  color: "#B45309",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                DTC Low-Floor EV (12m)
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 6px" }}>
              Anatomy of a Smart Transit Bus
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              दिल्ली स्मार्ट इलेक्ट्रिक बस की तकनीकी संरचना · Interactive engineering cross-section, AIS-140 telematics, and safety sensors.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              padding: "10px 18px",
              borderRadius: 14,
              boxShadow: "var(--ring-subtle)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>Chassis Model</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>DTC Ultra EV-12</div>
            </div>
            <div style={{ width: 1, height: 28, background: "var(--line)" }} />
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>Safety Standard</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0A6E3F" }}>AIS-140 / Nirbhaya</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: "24px 20px",
          boxShadow: "var(--ring)",
          marginBottom: 28,
        }}
      >
        {/* Stage Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid var(--line)",
          }}
        >
          {/* Play/Pause & Speed Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                background: isPlaying ? "#0A6E3F" : "var(--surface-2)",
                color: isPlaying ? "#FFFFFF" : "var(--text)",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? "Pause Motion" : "Resume Motion"}</span>
            </button>

            <div style={{ display: "flex", background: "var(--surface-2)", padding: 3, borderRadius: 8 }}>
              {(["idle", "city", "corridor"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeedMode(s);
                    if (s !== "idle") setIsPlaying(true);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: speedMode === s ? "var(--text)" : "transparent",
                    color: speedMode === s ? "var(--bg)" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {s === "idle" ? "0 km/h (Stop)" : s === "city" ? "25 km/h" : "45 km/h"}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle (Cutaway vs Exterior) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>View:</span>
            <div style={{ display: "flex", background: "var(--surface-2)", padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => setViewMode("cutaway")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === "cutaway" ? "#0A6E3F" : "transparent",
                  color: viewMode === "cutaway" ? "#FFFFFF" : "var(--text)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Sliders size={13} />
                <span>Internal Cutaway</span>
              </button>
              <button
                onClick={() => setViewMode("exterior")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === "exterior" ? "var(--text)" : "transparent",
                  color: viewMode === "exterior" ? "var(--bg)" : "var(--text)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Eye size={13} />
                <span>DTC Livery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Bus Vector Cross-Section (SVG) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            overflowX: "auto",
            padding: "10px 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 880 320"
            style={{
              width: "100%",
              maxWidth: 880,
              height: "auto",
              minWidth: 640,
              display: "block",
            }}
          >
            {/* Defs for gradients and filters */}
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0A6E3F" />
                <stop offset="100%" stopColor="#054C2B" />
              </linearGradient>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Asphalt Road and Animated Dash Lines */}
            <rect x="20" y="275" width="840" height="35" fill="var(--surface-3)" rx="6" />
            <line
              x1="20"
              y1="292"
              x2="860"
              y2="292"
              stroke="#F4A900"
              strokeWidth="4"
              strokeDasharray="28 20"
              strokeDashoffset={-roadOffset * 2}
            />

            {/* Bus Chassis Shadow */}
            <ellipse cx="440" cy="272" rx="380" ry="14" fill="oklch(0 0 0 / 0.14)" />

            {/* ======================================================== BUS EXTERIOR / SHELL */}
            {/* Bus Main Green Body */}
            <path
              d="M100 80C100 65 115 50 135 50H740C760 50 775 65 775 80V235H100V80Z"
              fill={viewMode === "cutaway" ? "oklch(0.08 0.05 150 / 0.12)" : "url(#bodyGrad)"}
              stroke="#054C2B"
              strokeWidth="3.5"
            />

            {/* Roof Pod: AC Unit & Batteries */}
            <rect
              x="240"
              y="32"
              width="400"
              height="20"
              rx="6"
              fill={viewMode === "cutaway" ? "rgba(244, 169, 0, 0.2)" : "#F4A900"}
              stroke="#D97706"
              strokeWidth="2"
            />
            {/* AC Vents */}
            <line x1="280" y1="42" x2="380" y2="42" stroke="#111827" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="480" y1="42" x2="600" y2="42" stroke="#111827" strokeWidth="2" strokeDasharray="6 4" />

            {/* Digital Route Display LED Board (Front Windshield Header) */}
            <rect x="115" y="60" width="80" height="18" rx="3" fill="#111827" />
            <text
              x="155"
              y="73"
              fill="#F4A900"
              fontSize="9.5"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.8"
            >
              502 MEHRAULI
            </text>

            {/* Front Windshield */}
            <path
              d="M105 84H190V160H105V84Z"
              fill="url(#glassGrad)"
              stroke="#054C2B"
              strokeWidth="2"
            />

            {/* Passenger Panoramic Side Windows */}
            {[205, 290, 375, 460, 545, 630, 715].map((winX, i) => (
              <rect
                key={winX}
                x={winX}
                y="84"
                width="72"
                height="76"
                rx="4"
                fill={viewMode === "cutaway" ? "rgba(224, 242, 254, 0.25)" : "url(#glassGrad)"}
                stroke="#054C2B"
                strokeWidth="2"
              />
            ))}

            {/* Passenger Entrance Doors (Low Floor) */}
            <rect x="205" y="84" width="72" height="150" fill="none" stroke="#054C2B" strokeWidth="2.5" />
            <line x1="241" y1="84" x2="241" y2="234" stroke="#054C2B" strokeWidth="2" />

            <rect x="460" y="84" width="72" height="150" fill="none" stroke="#054C2B" strokeWidth="2.5" />
            <line x1="496" y1="84" x2="496" y2="234" stroke="#054C2B" strokeWidth="2" />

            {/* ======================================================== INTERNAL CUTAWAY ELEMENTS */}
            {viewMode === "cutaway" && (
              <g id="cutaway_interior">
                {/* Cabin Passenger Floor Line (400mm Low-Floor) */}
                <line x1="105" y1="215" x2="770" y2="215" stroke="#374151" strokeWidth="4" />

                {/* Passenger Seats Row */}
                {[295, 335, 380, 420, 550, 590, 635, 675, 720].map((seatX, i) => (
                  <path
                    key={seatX}
                    d={`M${seatX} 185H${seatX + 16}V214M${seatX} 198H${seatX + 16}`}
                    stroke="#0A6E3F"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}

                {/* Driver Cabin Partition & Steering Wheel */}
                <line x1="180" y1="130" x2="180" y2="215" stroke="#4B5563" strokeWidth="2.5" />
                <circle cx="150" cy="155" r="9" stroke="#111827" strokeWidth="2.5" fill="none" />
                <line x1="150" y1="164" x2="142" y2="185" stroke="#111827" strokeWidth="3" />

                {/* High-Voltage Orange Wiring Harness Conduit */}
                <path
                  d="M190 55L240 42H640L670 190H600"
                  stroke="#EA580C"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  fill="none"
                />

                {/* Underfloor Battery Pack Modules */}
                <rect x="330" y="222" width="120" height="16" rx="3" fill="#F4A900" stroke="#B45309" strokeWidth="1.5" />
                <text x="390" y="234" fill="#111827" fontSize="8" fontWeight="800" textAnchor="middle">
                  LFP 250kWh MODULE
                </text>

                {/* Electric Drive Motor / Inverter Box at Rear */}
                <rect x="650" y="195" width="45" height="30" rx="4" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
                <text x="672" y="213" fill="#FFFFFF" fontSize="8" fontWeight="800" textAnchor="middle">
                  PMSM
                </text>
              </g>
            )}

            {/* Front & Rear Wheel Arches and Rotating Wheels */}
            {/* Front Wheel */}
            <g transform="translate(195, 235)">
              <circle cx="0" cy="0" r="44" fill="#111827" />
              <circle cx="0" cy="0" r="28" fill="#4B5563" />
              <g transform={`rotate(${wheelRotation})`}>
                <line x1="-24" y1="0" x2="24" y2="0" stroke="#E5E7EB" strokeWidth="3" />
                <line x1="0" y1="-24" x2="0" y2="24" stroke="#E5E7EB" strokeWidth="3" />
                <line x1="-17" y1="-17" x2="17" y2="17" stroke="#E5E7EB" strokeWidth="2" />
                <line x1="-17" y1="17" x2="17" y2="-17" stroke="#E5E7EB" strokeWidth="2" />
                <circle cx="0" cy="0" r="10" fill="#111827" stroke="#E5E7EB" strokeWidth="2" />
              </g>
            </g>

            {/* Rear Dual Wheels */}
            <g transform="translate(680, 235)">
              <circle cx="0" cy="0" r="44" fill="#111827" />
              <circle cx="0" cy="0" r="28" fill="#4B5563" />
              <g transform={`rotate(${wheelRotation})`}>
                <line x1="-24" y1="0" x2="24" y2="0" stroke="#E5E7EB" strokeWidth="3" />
                <line x1="0" y1="-24" x2="0" y2="24" stroke="#E5E7EB" strokeWidth="3" />
                <line x1="-17" y1="-17" x2="17" y2="17" stroke="#E5E7EB" strokeWidth="2" />
                <line x1="-17" y1="17" x2="17" y2="-17" stroke="#E5E7EB" strokeWidth="2" />
                <circle cx="0" cy="0" r="10" fill="#111827" stroke="#E5E7EB" strokeWidth="2" />
              </g>
            </g>

            {/* ======================================================== INTERACTIVE SENSOR HOTSPOTS */}
            {BUS_SUBSYSTEMS.map((sub) => {
              const isSelected = sub.id === activeSubsystemId;
              const color =
                sub.category === "telematics"
                  ? "#2563EB"
                  : sub.category === "safety"
                  ? "#DC2626"
                  : sub.category === "powertrain"
                  ? "#F4A900"
                  : "#0A6E3F";

              return (
                <g
                  key={sub.id}
                  transform={`translate(${sub.coords.x}, ${sub.coords.y})`}
                  onClick={() => setActiveSubsystemId(sub.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Glowing Radar Pulse */}
                  {isSelected && (
                    <circle cx="0" cy="0" r="16" fill={color} fillOpacity="0.25">
                      <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Pin Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isSelected ? 10 : 8}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"
                  />
                  <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hotspots Quick Filter Bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingTop: 16,
            borderTop: "1px solid var(--line)",
          }}
        >
          {BUS_SUBSYSTEMS.map((sub) => {
            const isSelected = sub.id === activeSubsystemId;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubsystemId(sub.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: isSelected ? "2px solid #0A6E3F" : "1px solid var(--line)",
                  background: isSelected ? "rgba(10, 110, 63, 0.08)" : "var(--surface)",
                  color: isSelected ? "#0A6E3F" : "var(--text)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      sub.category === "telematics"
                        ? "#2563EB"
                        : sub.category === "safety"
                        ? "#DC2626"
                        : sub.category === "powertrain"
                        ? "#F4A900"
                        : "#0A6E3F",
                  }}
                />
                <span>{sub.name.split(" ")[0]} {sub.name.split(" ")[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Component Technical Specification Drawer */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: "28px 24px",
          boxShadow: "var(--ring)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-dim)",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                {activeSubsystem.category.toUpperCase()}
              </span>
              <span
                style={{
                  background: "rgba(10, 110, 63, 0.1)",
                  color: "#0A6E3F",
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 6,
                }}
              >
                {activeSubsystem.standard}
              </span>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
              {activeSubsystem.name}
            </h2>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>
              {activeSubsystem.nameHi}
            </h3>
          </div>

          {/* Live Telemetry Sensor Feed Pill */}
          <div
            style={{
              background: "#111827",
              color: "#FFFFFF",
              padding: "12px 18px",
              borderRadius: 14,
              border: "1px solid #374151",
            }}
          >
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <Radio size={12} color="#22C55E" />
              <span>{activeSubsystem.telemetryStream.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "monospace", color: "#F4A900" }}>
              {activeSubsystem.telemetryStream.value}{" "}
              <span style={{ fontSize: 12, color: "#D1D5DB", fontWeight: 500 }}>
                ({activeSubsystem.telemetryStream.unit})
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text)", marginBottom: 24, maxWidth: 840 }}>
          {activeSubsystem.fullDesc}
        </p>

        {/* Technical Specification Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {activeSubsystem.specs.map((spec) => (
            <div
              key={spec.label}
              style={{
                background: "var(--surface-2)",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700, marginBottom: 4 }}>
                {spec.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
                {spec.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
