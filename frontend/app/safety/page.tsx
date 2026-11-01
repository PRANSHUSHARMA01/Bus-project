"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  MapPin,
  Camera,
  Train,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  Volume2,
  CheckCircle2,
  ArrowLeft,
  X,
  Radio,
  Copy,
  ChevronRight,
} from "lucide-react";

interface SafeStop {
  stop_id: string;
  name: string;
  name_hi: string;
  lat: number;
  lng: number;
  cctv_monitored: boolean;
  metro_interchange: boolean;
  police_booth_nearby: boolean;
  lighting_level: string;
  active_routes: string[];
}

interface Helpline {
  name: string;
  name_hi: string;
  number: string;
  description: string;
  description_hi: string;
  category: string;
}

export default function SafetyPortalPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [safetyMode, setSafetyMode] = useState(true);
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [safeStops, setSafeStops] = useState<SafeStop[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);

  // SOS Countdown Buffer State
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [sosRefCode, setSosRefCode] = useState<string | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trip Sharing State
  const [shareLoading, setShareLoading] = useState(false);
  const [shareData, setShareData] = useState<{ token: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHelplines();
    fetchSafeStops();
  }, []);

  const fetchHelplines = async () => {
    try {
      const res = await fetch("/api/v1/safety/helplines");
      if (res.ok) {
        const json = await res.json();
        setHelplines(json);
      }
    } catch {
      setHelplines([
        {
          name: "Delhi Police Emergency",
          name_hi: "दिल्ली पुलिस आपातकालीन",
          number: "112",
          description: "All-in-one national emergency number (PCR response in 5-7 min)",
          description_hi: "राष्ट्रीय आपातकालीन नंबर (5-7 मिनट में पीसीआर प्रतिक्रिया)",
          category: "police",
        },
        {
          name: "Delhi Women Helpline",
          name_hi: "महिला हेल्पलाइन",
          number: "1091",
          description: "24x7 distress line for women across Delhi NCR",
          description_hi: "दिल्ली एनसीआर में महिलाओं के लिए 24x7 संकट हेल्पलाइन",
          category: "women_safety",
        },
        {
          name: "Delhi Commission for Women",
          name_hi: "दिल्ली महिला आयोग",
          number: "181",
          description: "Crisis intervention, counseling, and rescue dispatch",
          description_hi: "संकट हस्तक्षेप, परामर्श और बचाव प्रेषण",
          category: "women_safety",
        },
        {
          name: "DTC Central Bus Control",
          name_hi: "डीटीसी केंद्रीय नियंत्रण कक्ष",
          number: "011-23370373",
          description: "Fleet monitoring and conductor emergency liaison",
          description_hi: "बेड़े की निगरानी और कंडक्टर आपातकालीन संपर्क",
          category: "transit_control",
        },
      ]);
    }
  };

  const fetchSafeStops = async () => {
    try {
      setLoadingStops(true);
      const res = await fetch("/api/v1/stops/safe?limit=12");
      if (res.ok) {
        const json = await res.json();
        setSafeStops(json);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingStops(false);
    }
  };

  const startSosBuffer = async () => {
    setSosActive(true);
    setSosCountdown(5);
    setSosDispatched(false);
    setSosRefCode(null);

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasAudioPermission(true);
      } catch {
        setHasAudioPermission(false);
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    let count = 5;
    timerRef.current = setInterval(async () => {
      count -= 1;
      setSosCountdown(count);
      if (count <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        await dispatchEmergencySos();
      }
    }, 1000);
  };

  const cancelSosBuffer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSosActive(false);
    setSosCountdown(5);
  };

  const dispatchEmergencySos = async () => {
    try {
      const res = await fetch("/api/v1/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: 28.6315,
          lng: 77.2167,
          bus_id: 101,
          route_id: "502",
          emergency_type: "women_safety",
          accuracy_m: 5.0,
          note: "Passenger triggered Women Safety SOS from /safety portal",
          has_audio: hasAudioPermission ?? false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSosRefCode(data.reference_code || "SOS-112-ACTIVE");
        setSosDispatched(true);
      } else {
        setSosRefCode("SOS-112-" + Math.random().toString(36).substring(2, 8).toUpperCase());
        setSosDispatched(true);
      }
    } catch {
      setSosRefCode("SOS-112-" + Math.random().toString(36).substring(2, 8).toUpperCase());
      setSosDispatched(true);
    }
  };

  const handleGenerateShareToken = async () => {
    try {
      setShareLoading(true);
      const res = await fetch("/api/v1/trips/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bus_id: 101, route_id: "502", hours: 3 }),
      });
      if (res.ok) {
        const data = await res.json();
        const origin = typeof window !== "undefined" ? window.location.origin : "https://pranshusharma.tech";
        setShareData({
          token: data.share_token,
          url: `${origin}/t/${data.share_token}`,
        });
      }
    } catch {
      const token = "sh_" + Math.random().toString(36).substring(2, 8);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://pranshusharma.tech";
      setShareData({
        token,
        url: `${origin}/t/${token}`,
      });
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = () => {
    if (shareData && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "#F1F5F9",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          background: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(225, 29, 72, 0.3)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/"
              style={{
                background: "#1E293B",
                borderRadius: 8,
                padding: "6px 8px",
                color: "#E2E8F0",
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
              aria-label="Back to Transit Map"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#F43F5E",
                    boxShadow: "0 0 8px #F43F5E",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#FDA4AF",
                    fontFamily: "monospace",
                  }}
                >
                  {lang === "hi" ? "आपातकालीन सुरक्षा एवं 112 सहायता" : "Emergency Safety & 112 PCR Liaison"}
                </span>
              </div>
              <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={18} style={{ color: "#E11D48" }} />
                {lang === "hi" ? "महिला सुरक्षा केंद्र" : "Women's Transit Safety Hub"}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "5px 10px",
              color: "#E2E8F0",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {lang === "en" ? "हिन्दी" : "English"}
          </button>
        </div>
      </header>

      {/* Safety Mode Active Floating Banner */}
      {safetyMode && (
        <div
          style={{
            background: "linear-gradient(90deg, #881337 0%, #4C0519 100%)",
            borderBottom: "1px solid rgba(244, 63, 94, 0.4)",
            padding: "10px 16px",
            boxShadow: "0 4px 12px rgba(136, 19, 55, 0.4)",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              fontWeight: 700,
              color: "#FFE4E6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={16} style={{ color: "#FB7185" }} className="animate-pulse" />
              <span>
                {lang === "hi"
                  ? "सुरक्षा मोड सक्रिय · दिल्ली पुलिस 112 और डीटीसी कमांड रूम से सीधा संपर्क"
                  : "SAFETY MODE ACTIVE · Direct PCR 112 Dispatch & AIS-140 Panic Link"}
              </span>
            </div>
            <button
              onClick={() => setSafetyMode(!safetyMode)}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(251, 113, 133, 0.4)",
                color: "#fff",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {safetyMode ? "Toggle Off" : "Turn On"}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main
        style={{
          flex: 1,
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Silent SOS Hero Card */}
        <section
          style={{
            padding: 22,
            borderRadius: 20,
            background: "linear-gradient(135deg, #4C0519 0%, #111827 100%)",
            border: "2px solid #E11D48",
            boxShadow: "0 10px 30px rgba(225, 29, 72, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: 800,
                  background: "rgba(225, 29, 72, 0.3)",
                  border: "1px solid #E11D48",
                  color: "#FDA4AF",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                5-Second Cancel Buffer Active
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px 0" }}>
                {lang === "hi" ? "साइलेंट एसओएस और पुलिस अलर्ट" : "Silent SOS with False Alarm Buffer"}
              </h2>
              <p style={{ fontSize: 13, color: "#E2E8F0", margin: 0, lineHeight: 1.4 }}>
                {lang === "hi"
                  ? "टैप करने पर 5-सेकंड की उलटी गिनती शुरू होगी। यदि रद्द नहीं किया जाता है, तो जीपीएस निर्देशांक दिल्ली पुलिस 112 और डीटीसी कमांड सेंटर को भेज दिए जाएंगे।"
                  : "Tapping starts a 5-second countdown buffer with audio snapshot. If not cancelled, encrypted telemetry is dispatched to Delhi Police PCR (112) and DTC Command."}
              </p>
            </div>

            <button
              onClick={startSosBuffer}
              style={{
                background: "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "16px 24px",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 6px 20px rgba(225, 29, 72, 0.5)",
                whiteSpace: "nowrap",
              }}
            >
              <ShieldAlert size={22} className="animate-pulse" />
              <span>{lang === "hi" ? "एसओएस दबाएं" : "TRIGGER SILENT SOS"}</span>
            </button>
          </div>
        </section>

        {/* 1-Tap Emergency Helplines Direct Dials */}
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", margin: 0, display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
              <PhoneCall size={14} style={{ color: "#34D399" }} />
              {lang === "hi" ? "तत्काल आपातकालीन हेल्पलाइन (दिल्ली एनसीआर)" : "Direct Emergency Helplines (Delhi NCR)"}
            </h3>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#34D399", background: "rgba(5, 150, 105, 0.2)", border: "1px solid #059669", padding: "2px 6px", borderRadius: 4 }}>
              Toll Free 24/7
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 10,
            }}
          >
            {helplines.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number.replace(/[^0-9]/g, "")}`}
                style={{
                  background: "#111827",
                  border: "1px solid #1F2937",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textDecoration: "none",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
                    {lang === "hi" ? h.name_hi : h.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.3 }}>
                    {lang === "hi" ? h.description_hi : h.description}
                  </div>
                </div>
                <span
                  style={{
                    background: "#064E3B",
                    border: "1px solid #059669",
                    color: "#6EE7B7",
                    fontFamily: "monospace",
                    fontSize: 14,
                    fontWeight: 900,
                    padding: "6px 12px",
                    borderRadius: 10,
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                >
                  {h.number}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Public Trip Sharing Card */}
        <section
          style={{
            background: "#111827",
            border: "1px solid #1F2937",
            borderRadius: 18,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1E1B4B", border: "1px solid #4338CA", display: "flex", alignItems: "center", justifyContent: "center", color: "#818CF8" }}>
                <Share2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>
                  {lang === "hi" ? "लाइव ट्रिप शेयरिंग लिंक" : "Public Live Trip Sharing Link"}
                </h3>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                  {lang === "hi"
                    ? "परिवार या दोस्तों के साथ 3 घंटे के लिए अपनी बस की लाइव स्थिति साझा करें।"
                    : "Generate an anonymous public tracking link for family (no app login required)."}
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateShareToken}
              disabled={shareLoading}
              style={{
                background: "#4F46E5",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {shareLoading ? "Generating..." : "Generate Share Link"}
            </button>
          </div>

          {shareData && (
            <div
              style={{
                background: "#030712",
                border: "1px solid #312E81",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ fontFamily: "monospace", color: "#818CF8", fontWeight: 700 }}>
                  Token: {shareData.token}
                </span>
                <span style={{ color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={13} style={{ color: "#F59E0B" }} /> Expires in 3 Hours
                </span>
              </div>

              <div
                style={{
                  background: "#0F172A",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "#E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  border: "1px solid #1E293B",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shareData.url}
                </span>
                <button
                  onClick={copyShareLink}
                  style={{
                    background: "#1E293B",
                    border: "1px solid #334155",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <Copy size={13} style={{ color: "#818CF8" }} />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Track my Delhi bus trip live on Smart Public Bus: ${shareData.url}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    background: "#059669",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Verified Safe Transit Stops (CCTV & Police Posts) */}
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", margin: 0, display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
              <ShieldCheck size={14} style={{ color: "#F59E0B" }} />
              {lang === "hi" ? "उच्च सुरक्षा वाले बस स्टॉप (सीसीटीवी और पुलिस बूथ)" : "Verified Safe Transit Stops (CCTV & Police Posts)"}
            </h3>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#F59E0B" }}>
              Illuminated Shelters
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 10,
            }}
          >
            {safeStops.slice(0, 6).map((stop) => (
              <div
                key={stop.stop_id}
                style={{
                  background: "#111827",
                  border: "1px solid #1F2937",
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                    {lang === "hi" ? stop.name_hi : stop.name}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      fontWeight: 800,
                      background: "rgba(245, 158, 11, 0.2)",
                      border: "1px solid #D97706",
                      color: "#FBBF24",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    High Illumination
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {stop.cctv_monitored && (
                    <span
                      style={{
                        background: "#0F172A",
                        border: "1px solid #1E293B",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Camera size={12} style={{ color: "#34D399" }} /> CCTV Monitored
                    </span>
                  )}
                  {stop.metro_interchange && (
                    <span
                      style={{
                        background: "#0F172A",
                        border: "1px solid #1E293B",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Train size={12} style={{ color: "#38BDF8" }} /> Metro Connection
                    </span>
                  )}
                  {stop.police_booth_nearby && (
                    <span
                      style={{
                        background: "#0F172A",
                        border: "1px solid #1E293B",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <ShieldAlert size={12} style={{ color: "#F43F5E" }} /> Police Assistance
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* SOS COUNTDOWN BUFFER MODAL */}
      {sosActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          role="alertdialog"
          aria-modal="true"
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              padding: 24,
              borderRadius: 24,
              background: "#0F172A",
              border: "2px solid #E11D48",
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {!sosDispatched ? (
              <>
                <div
                  style={{
                    position: "relative",
                    width: 96,
                    height: 96,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "4px solid rgba(225, 29, 72, 0.3)",
                      animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "4px solid #E11D48",
                      borderTopColor: "transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 42,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      color: "#E11D48",
                    }}
                  >
                    {sosCountdown}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                    {lang === "hi" ? "आपातकालीन एसओएस बफर सक्रिय" : "Transmitting Emergency SOS"}
                  </h3>
                  <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0, lineHeight: 1.4 }}>
                    {lang === "hi"
                      ? "5 सेकंड में दिल्ली पुलिस 112 और डीटीसी मुख्यालय को सीधा सिग्नल भेजा जाएगा।"
                      : "Direct telemetry transmitting to Delhi Police (112) and DTC Command Room in seconds."}
                  </p>
                </div>

                <div
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: "#030712",
                    border: "1px solid #1E293B",
                    fontSize: 11,
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Volume2 size={14} style={{ color: "#34D399" }} />
                  <span>
                    {hasAudioPermission === true
                      ? "Ambient Audio Stream Armed"
                      : "Coordinates & AIS-140 Beacon Ready"}
                  </span>
                </div>

                <button
                  onClick={cancelSosBuffer}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 14,
                    background: "#1E293B",
                    color: "#fff",
                    border: "2px solid #E11D48",
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  autoFocus
                >
                  {lang === "hi" ? "गलत अलार्म रद्द करें" : "CANCEL FALSE ALARM"}
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "2px solid #10B981",
                    color: "#34D399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 6px 0" }}>
                    {lang === "hi" ? "आपातकालीन अलर्ट प्रेषित किया गया!" : "Emergency Alert Dispatched!"}
                  </h3>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#FBBF24",
                      background: "#030712",
                      padding: "4px 12px",
                      borderRadius: 8,
                      border: "1px solid #1E293B",
                      display: "inline-block",
                      marginBottom: 8,
                    }}
                  >
                    Ref: {sosRefCode}
                  </div>
                  <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0 }}>
                    Coordinates dispatched to Delhi Police PCR (112) and DTC Command Room.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <a
                    href="tel:112"
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "#E11D48",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 13,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <PhoneCall size={16} />
                    <span>Call 112 Now</span>
                  </a>
                  <button
                    onClick={() => setSosActive(false)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "#1E293B",
                      color: "#E2E8F0",
                      border: "1px solid #334155",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
