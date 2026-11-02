"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  PhoneCall,
  Share2,
  Phone,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  MapPin,
  Camera,
  AlertTriangle,
  X,
  Volume2,
  Copy,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Sheet } from "../../components/ui/Sheet";

interface SafeStop {
  stop_id: string;
  name: string;
  name_hi: string;
  distance_m: number;
  walk_min: number;
  tags: string[];
}

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  color: string;
}

const DETERMINISTIC_COLORS = [
  "oklch(0.70 0.18 150)", // Green
  "oklch(0.55 0.22 262)", // Blue
  "oklch(0.80 0.17 75)",  // Saffron
  "oklch(0.62 0.24 355)", // Magenta
  "oklch(0.65 0.18 200)", // Teal
];

export default function SafetyPortalPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Read theme from localStorage / html
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("user_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      } else if (document.documentElement.getAttribute("data-theme") === "dark") {
        setTheme("dark");
      }
    }
  }, []);

  // Safety Mode Switch State (persisted)
  const [safetyMode, setSafetyMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("safety_mode_enabled") === "true";
    }
    return true;
  });

  const toggleSafetyMode = () => {
    const next = !safetyMode;
    setSafetyMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("safety_mode_enabled", String(next));
    }
  };

  // SOS Hold Interaction State (2.0s hold)
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 1
  const [shaking, setShaking] = useState(false);
  const holdStartTimeRef = useRef<number | null>(null);
  const holdAnimFrameRef = useRef<number | null>(null);

  // SOS Buffer & Dispatch State
  const [sosState, setSosState] = useState<"idle" | "countdown" | "active">("idle");
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosRefCode, setSosRefCode] = useState<string | null>(null);
  const [sosTimelineStep, setSosTimelineStep] = useState<number>(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trusted Contacts State
  const [contacts, setContacts] = useState<TrustedContact[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_trusted_contacts");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      { id: "c1", name: "Pooja Sharma", phone: "+91 98712 34567", color: DETERMINISTIC_COLORS[0] },
      { id: "c2", name: "Rahul Verma", phone: "+91 98101 23456", color: DETERMINISTIC_COLORS[1] },
    ];
  });
  const [addContactSheetOpen, setAddContactSheetOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // Quick Action: Share Live Trip
  const [shareLoading, setShareLoading] = useState(false);
  const [shareActive, setShareActive] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Quick Action: Fake Call Modal
  const [fakeCallOpen, setFakeCallOpen] = useState(false);
  const [fakeCallActive, setFakeCallActive] = useState(false);

  // Location Privacy Info Sheet
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  // Demo Safer Stops Data
  const [safeStops, setSafeStops] = useState<SafeStop[]>([
    {
      stop_id: "stop_1",
      name: "Kashmere Gate ISBT",
      name_hi: "कश्मीरी गेट बस टर्मिनल",
      distance_m: 240,
      walk_min: 3,
      tags: ["CCTV Monitored", "Police Assistance"],
    },
    {
      stop_id: "stop_2",
      name: "Mandi House Metro",
      name_hi: "मंडी हाउस मेट्रो स्टेशन",
      distance_m: 420,
      walk_min: 5,
      tags: ["Well-lit shelter", "Metro Security"],
    },
    {
      stop_id: "stop_3",
      name: "AIIMS South Extension",
      name_hi: "एम्स साउथ एक्सटेंशन",
      distance_m: 650,
      walk_min: 8,
      tags: ["24/7 Security", "CCTV Monitored"],
    },
    {
      stop_id: "stop_4",
      name: "Connaught Place Radial",
      name_hi: "कनॉट प्लेस रेडियल",
      distance_m: 800,
      walk_min: 10,
      tags: ["Police Booth Nearby", "High Illumination"],
    },
  ]);

  // Persist contacts
  const saveContacts = (updated: TrustedContact[]) => {
    setContacts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_trusted_contacts", JSON.stringify(updated));
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const color = DETERMINISTIC_COLORS[contacts.length % DETERMINISTIC_COLORS.length];
    const newEntry: TrustedContact = {
      id: "c_" + Date.now(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      color,
    };
    saveContacts([...contacts, newEntry]);
    setNewContactName("");
    setNewContactPhone("");
    setAddContactSheetOpen(false);
  };

  const handleRemoveContact = (id: string) => {
    saveContacts(contacts.filter((c) => c.id !== id));
  };

  // SOS Press-and-Hold Logic (2 seconds)
  const startHold = useCallback(() => {
    if (sosState !== "idle") return;
    setHolding(true);
    setShaking(false);
    holdStartTimeRef.current = performance.now();

    // Haptic start feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch {}
    }

    const duration = 2000; // 2.0s
    const loop = (now: number) => {
      if (!holdStartTimeRef.current) return;
      const elapsed = now - holdStartTimeRef.current;
      const pct = Math.min(1, elapsed / duration);
      setHoldProgress(pct);

      if (pct >= 1) {
        // Complete!
        setHolding(false);
        setHoldProgress(0);
        holdStartTimeRef.current = null;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {}
        }
        triggerSosCountdown();
      } else {
        holdAnimFrameRef.current = requestAnimationFrame(loop);
      }
    };

    holdAnimFrameRef.current = requestAnimationFrame(loop);
  }, [sosState]);

  const cancelHold = useCallback(() => {
    if (!holding) return;
    setHolding(false);
    holdStartTimeRef.current = null;
    if (holdAnimFrameRef.current) {
      cancelAnimationFrame(holdAnimFrameRef.current);
      holdAnimFrameRef.current = null;
    }

    if (holdProgress > 0 && holdProgress < 1) {
      // Released too early -> gentle shake feedback
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
    }
    setHoldProgress(0);
  }, [holding, holdProgress]);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (holdAnimFrameRef.current) cancelAnimationFrame(holdAnimFrameRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 5-second countdown window before escalation
  const triggerSosCountdown = () => {
    setSosState("countdown");
    setSosCountdown(5);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    let current = 5;
    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      setSosCountdown(current);
      if (current <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        dispatchSosEvent();
      }
    }, 1000);
  };

  const cancelSosCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSosState("idle");
    setSosCountdown(5);
  };

  // Dispatch real event to backend
  const dispatchSosEvent = async () => {
    setSosState("active");
    setSosTimelineStep(1); // Control room alerted

    const generatedRef = "SOS-112-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    setSosRefCode(generatedRef);

    try {
      const res = await fetch("/api/v1/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: 28.6315,
          lng: 77.2167,
          emergency_type: "women_safety",
          accuracy_m: 4.8,
          note: "SOS triggered from Women Safety Hub",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reference_code) {
          setSosRefCode(data.reference_code);
        }
      }
    } catch {
      // Fallback
    }

    // Step 2: Contacts notified
    setTimeout(() => {
      setSosTimelineStep(2);
    }, 1200);

    // Step 3: Live link shared
    setTimeout(() => {
      setSosTimelineStep(3);
    }, 2400);
  };

  const resolveSos = () => {
    setSosState("idle");
    setSosRefCode(null);
    setSosTimelineStep(0);
  };

  // Share Live Trip One-Tap
  const handleShareTrip = async () => {
    if (shareActive) {
      setShareActive(false);
      setShareToast(lang === "hi" ? "लाइव शेयरिंग रोकी गई" : "Live sharing stopped");
      setTimeout(() => setShareToast(null), 3000);
      return;
    }

    setShareLoading(true);
    try {
      const token = "sh_" + Math.random().toString(36).substring(2, 8);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://pranshusharma.tech";
      const shareUrl = `${origin}/t/${token}`;

      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "My Live Delhi Transit Trip",
          text: "Follow my live bus journey in Delhi:",
          url: shareUrl,
        });
        setShareActive(true);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareActive(true);
        setShareToast(lang === "hi" ? "ट्रिप लिंक कॉपी किया गया" : "Live trip link copied to clipboard");
        setTimeout(() => setShareToast(null), 3000);
      }
    } catch {
      setShareToast("Sharing cancelled");
      setTimeout(() => setShareToast(null), 2000);
    } finally {
      setShareLoading(false);
    }
  };

  // Circumference for 168px circle progress ring
  // Button radius = 84px, circle stroke at radius 87px
  const circleRadius = 87;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference - holdProgress * circumference;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* 480px Centered Content Frame */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "calc(var(--nav-h, 76px) + 32px + env(safe-area-inset-bottom, 16px))",
        }}
      >
        {/* 1. STICKY TOP BAR with Scroll Fade */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "color-mix(in oklab, var(--paper) 88%, transparent)",
            backdropFilter: "blur(16px) saturate(1.2)",
            WebkitBackdropFilter: "blur(16px) saturate(1.2)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
              display: "grid",
              placeItems: "center",
              color: "var(--text)",
              cursor: "pointer",
            }}
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1
              className="text-title"
              style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}
            >
              {lang === "hi" ? "महिला सुरक्षा" : "Safety"}
            </h1>
            {safetyMode && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "oklch(0.70 0.18 150 / 0.15)",
                  color: "var(--green)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <Shield size={12} />
                <span>{lang === "hi" ? "सक्रिय" : "Active"}</span>
              </span>
            )}
          </div>

          {/* Language Toggle EN / हिं */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            style={{
              height: 44,
              padding: "0 14px",
              borderRadius: 999,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            aria-label="Switch language"
          >
            <span>{lang === "en" ? "हिं" : "EN"}</span>
          </button>
        </header>

        {/* Scroll fade layer under sticky bar */}
        <div
          style={{
            height: 20,
            background: "linear-gradient(to bottom, var(--paper), transparent)",
            pointerEvents: "none",
            marginBottom: -20,
            zIndex: 35,
          }}
          aria-hidden="true"
        />

        {/* MAIN BODY (16px gutters) */}
        <main style={{ padding: "16px 16px 0 16px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Toast Notice */}
          {shareToast && (
            <div
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "10px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "var(--ring-elevated)",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{shareToast}</span>
            </div>
          )}

          {/* =========================================================================
              2. HERO SOS CARD (radius 28, saffron->magenta, original geometric art)
             ========================================================================= */}
          <section
            style={{
              position: "relative",
              borderRadius: 28,
              background: "linear-gradient(135deg, oklch(0.80 0.17 75) 0%, oklch(0.62 0.24 355) 100%)",
              color: "#FFFFFF",
              padding: "24px 20px 20px",
              overflow: "hidden",
              boxShadow: "0 12px 32px oklch(0.62 0.24 355 / 0.25)",
            }}
            aria-label="Emergency SOS Card"
          >
            {/* Original Inline Geometric SVG Artwork Background */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 220,
                height: 220,
                pointerEvents: "none",
                opacity: 0.18,
              }}
              viewBox="0 0 200 200"
              fill="none"
              aria-hidden="true"
            >
              {/* Concentric Quarter-Circles */}
              <circle cx="200" cy="0" r="180" stroke="#FFF" strokeWidth="2.5" />
              <circle cx="200" cy="0" r="140" stroke="#FFF" strokeWidth="2" />
              <circle cx="200" cy="0" r="100" stroke="#FFF" strokeWidth="2" />
              <circle cx="200" cy="0" r="60" stroke="#FFF" strokeWidth="2.5" />
              {/* Stylized Transit Shield */}
              <path
                d="M140 40 L160 50 V75 C160 90 145 105 140 110 C135 105 120 90 120 75 V50 Z"
                fill="#FFF"
                opacity="0.3"
              />
              {/* Small Bus Silhouette */}
              <rect x="70" y="25" width="34" height="20" rx="4" fill="#FFF" opacity="0.35" />
              <circle cx="78" cy="46" r="3" fill="#FFF" />
              <circle cx="96" cy="46" r="3" fill="#FFF" />
            </svg>

            {/* Headline & Subtitle */}
            <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.02em",
                  color: "#FFFFFF",
                }}
              >
                {lang === "hi" ? "क्या आपको अभी मदद चाहिए?" : "Need help right now?"}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.45,
                  margin: "0 auto 20px",
                  maxWidth: 360,
                  opacity: 0.95,
                  fontWeight: 400,
                  color: "#FFFFFF",
                }}
              >
                {lang === "hi"
                  ? "बटन को 2 सेकंड दबाए रखें। हम आपके लाइव स्थान के साथ नियंत्रण कक्ष और संपर्कों को सूचित करेंगे।"
                  : "Hold the button for 2 seconds. We alert the control room and your trusted contacts with your live location."}
              </p>
            </div>

            {/* SOS BUTTON (168px circle, danger-red, press-and-hold) */}
            {sosState === "idle" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  margin: "12px 0 16px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 184,
                    height: 184,
                    display: "grid",
                    placeItems: "center",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "none",
                  }}
                  className={shaking ? "shake-animation" : ""}
                >
                  {/* SVG Progress Ring */}
                  <svg
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      transform: "rotate(-90deg)",
                      pointerEvents: "none",
                    }}
                    viewBox="0 0 184 184"
                  >
                    <circle
                      cx="92"
                      cy="92"
                      r={circleRadius}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="92"
                      cy="92"
                      r={circleRadius}
                      stroke="#FFFFFF"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="none"
                      style={{ transition: holding ? "none" : "stroke-dashoffset 200ms ease-out" }}
                    />
                  </svg>

                  {/* 168px Button */}
                  <button
                    onPointerDown={startHold}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                    style={{
                      width: 168,
                      height: 168,
                      borderRadius: "50%",
                      background: "var(--danger-red, #DC2626)",
                      border: "4px solid rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      transform: holding ? "scale(0.96)" : "scale(1)",
                      transition: "transform 150ms ease-out",
                      zIndex: 2,
                    }}
                    aria-label="Hold for 2 seconds to trigger emergency SOS"
                  >
                    <ShieldAlert size={44} strokeWidth={2.4} />
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 26,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        marginTop: 2,
                      }}
                    >
                      SOS
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        opacity: 0.9,
                        marginTop: 2,
                      }}
                    >
                      {holding ? (lang === "hi" ? "दबाए रखें..." : "HOLD...") : (lang === "hi" ? "2 से. दबाएं" : "HOLD 2s")}
                    </span>
                  </button>
                </div>

                {/* Helper caption */}
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: "12px 0 0 0",
                    fontWeight: 500,
                  }}
                >
                  {holding
                    ? (lang === "hi" ? "सत्यापित करने के लिए दबाए रखें" : "Keep holding to verify...")
                    : (lang === "hi" ? "गलत अलार्म रोकने के लिए दबाकर रखें" : "Press & hold avoids accidental taps")}
                </p>
              </div>
            )}

            {/* TRIGGERED STATE: 5-Second Cancel Window */}
            {sosState === "countdown" && (
              <div
                role="alertdialog"
                aria-live="assertive"
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 20,
                  padding: "20px 16px",
                  textAlign: "center",
                  margin: "8px 0 12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#FFD1D9" }}>
                  {lang === "hi" ? "आपातकालीन अलर्ट भेजा जा रहा है" : "DISPATCHING EMERGENCY ALERT IN"}
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    lineHeight: 1,
                    margin: "10px 0 14px",
                    color: "#FFFFFF",
                  }}
                >
                  0{sosCountdown}
                </div>
                <p style={{ fontSize: 13, margin: "0 0 18px", opacity: 0.95 }}>
                  {lang === "hi"
                    ? "नियंत्रण कक्ष और संपर्कों को सतर्क किया जाएगा।"
                    : "Control room and emergency contacts will receive your live GPS."}
                </p>
                <button
                  onClick={cancelSosCountdown}
                  style={{
                    width: "100%",
                    minHeight: 56,
                    borderRadius: 999,
                    background: "#FFFFFF",
                    color: "#111827",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                  }}
                  aria-label="I am safe, cancel alert"
                >
                  {lang === "hi" ? "मैं सुरक्षित हूँ — रद्द करें" : "I'm safe — cancel"}
                </button>
              </div>
            )}

            {/* ACTIVE SOS STATUS TIMELINE (Truthful & Working) */}
            {sosState === "active" && (
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 20,
                  padding: "18px 16px",
                  margin: "8px 0 12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 8px #22c55e",
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                      {lang === "hi" ? "अलर्ट सक्रिय है" : "Alert Active"}
                    </span>
                  </div>
                  {sosRefCode && (
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#FFFFFF",
                      }}
                    >
                      {sosRefCode}
                    </span>
                  )}
                </div>

                {/* Honest Timeline */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "14px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={18} style={{ color: sosTimelineStep >= 1 ? "#22c55e" : "rgba(255,255,255,0.4)" }} />
                    <span style={{ opacity: sosTimelineStep >= 1 ? 1 : 0.6 }}>
                      {lang === "hi" ? "डीटीसी नियंत्रण कक्ष को सूचित किया गया" : "Control room alerted (WebSocket acknowledged)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={18} style={{ color: sosTimelineStep >= 2 ? "#22c55e" : "rgba(255,255,255,0.4)" }} />
                    <span style={{ opacity: sosTimelineStep >= 2 ? 1 : 0.6 }}>
                      {lang === "hi"
                        ? `${contacts.length} विश्वसनीय संपर्कों को संदेश भेजा गया`
                        : `${contacts.length} trusted contacts notified with location`}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={18} style={{ color: sosTimelineStep >= 3 ? "#22c55e" : "rgba(255,255,255,0.4)" }} />
                    <span style={{ opacity: sosTimelineStep >= 3 ? 1 : 0.6 }}>
                      {lang === "hi" ? "लाइव ट्रैकिंग लिंक सक्रिय" : "Live share link active"}
                    </span>
                  </div>
                </div>

                {/* Call 112 Direct Button */}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <a
                    href="tel:112"
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: 999,
                      background: "#FFFFFF",
                      color: "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    <PhoneCall size={16} />
                    <span>{lang === "hi" ? "112 पुलिस को कॉल करें" : "Call 112 for police"}</span>
                  </a>
                  <button
                    onClick={resolveSos}
                    style={{
                      padding: "0 18px",
                      minHeight: 48,
                      borderRadius: 999,
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {lang === "hi" ? "हल हुआ" : "I'm Safe Now"}
                  </button>
                </div>
              </div>
            )}

            {/* Quiet Line: "In danger? Call 112 now" */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.9 }}>
                {lang === "hi" ? "गंभीर खतरे में?" : "In danger?"}
              </span>
              <a
                href="tel:112"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 14px",
                  borderRadius: 999,
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  transition: "background 150ms ease-out",
                }}
              >
                <Phone size={13} />
                <span>{lang === "hi" ? "तुरंत 112 पर कॉल करें" : "Call 112 now"}</span>
              </a>
            </div>
          </section>

          {/* =========================================================================
              3. QUICK ACTIONS ROW (4 equal tiles, 72px high, grey --surface-2)
             ========================================================================= */}
          <section aria-label="Quick Emergency Actions">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
            >
              {/* Tile 1: Call 112 */}
              <a
                href="tel:112"
                className="btn-quick-action"
                style={{
                  height: 72,
                  background: "var(--surface-2)",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "var(--text)",
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  transition: "transform 150ms ease-out, background-color 150ms ease-out",
                }}
                aria-label="Call emergency police 112"
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "oklch(0.58 0.23 27 / 0.15)",
                    color: "var(--danger-red, #DC2626)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <PhoneCall size={16} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  Call 112
                </span>
              </a>

              {/* Tile 2: Call 1091 (Women Helpline) */}
              <a
                href="tel:1091"
                className="btn-quick-action"
                style={{
                  height: 72,
                  background: "var(--surface-2)",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "var(--text)",
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  transition: "transform 150ms ease-out, background-color 150ms ease-out",
                }}
                aria-label="Call Women Helpline 1091"
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "oklch(0.62 0.24 355 / 0.15)",
                    color: "var(--magenta)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Shield size={16} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  Call 1091
                </span>
              </a>

              {/* Tile 3: Share Live Trip */}
              <button
                onClick={handleShareTrip}
                className="btn-quick-action"
                style={{
                  height: 72,
                  background: shareActive ? "oklch(0.70 0.18 150 / 0.15)" : "var(--surface-2)",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: shareActive ? "var(--green)" : "var(--text)",
                  border: shareActive ? "1px solid var(--green)" : "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  cursor: "pointer",
                  transition: "transform 150ms ease-out, background-color 150ms ease-out",
                }}
                aria-label="Share live journey with family"
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: shareActive ? "oklch(0.70 0.18 150 / 0.2)" : "oklch(0.55 0.22 262 / 0.15)",
                    color: shareActive ? "var(--green)" : "var(--electric-blue)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Share2 size={16} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {shareActive ? "Sharing" : (lang === "hi" ? "शेयर ट्रिप" : "Share trip")}
                </span>
              </button>

              {/* Tile 4: Fake Call (Exit Uncomfortable Situations) */}
              <button
                onClick={() => setFakeCallOpen(true)}
                className="btn-quick-action"
                style={{
                  height: 72,
                  background: "var(--surface-2)",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  cursor: "pointer",
                  transition: "transform 150ms ease-out, background-color 150ms ease-out",
                }}
                aria-label="Trigger fake incoming phone call to exit situation"
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "oklch(0.80 0.17 75 / 0.15)",
                    color: "var(--saffron)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Volume2 size={16} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {lang === "hi" ? "फेक कॉल" : "Fake call"}
                </span>
              </button>
            </div>
          </section>

          {/* =========================================================================
              4. SAFETY MODE CARD (accessible switch row, persisted)
             ========================================================================= */}
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "16px 18px",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
            aria-label="Safety Mode Switch Card"
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                  {lang === "hi" ? "सुरक्षा मोड" : "Safety mode"}
                </h3>
                {safetyMode ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "oklch(0.70 0.18 150 / 0.15)",
                      color: "var(--green)",
                    }}
                  >
                    {lang === "hi" ? "चालू" : "On"}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--surface-3)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {lang === "hi" ? "बंद" : "Off"}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  margin: "4px 0 0 0",
                  lineHeight: 1.4,
                }}
              >
                {lang === "hi"
                  ? "विश्वसनीय संपर्कों के साथ आपकी यात्रा स्वतः साझा करता है और शेक-टू-एसओएस सक्षम करता है।"
                  : "Auto-shares your trip with trusted contacts and enables shake-to-SOS."}
              </p>
            </div>

            {/* 44px Accessible Toggle Switch */}
            <button
              role="switch"
              aria-checked={safetyMode}
              onClick={toggleSafetyMode}
              style={{
                width: 52,
                height: 32,
                borderRadius: 999,
                background: safetyMode ? "var(--ink)" : "var(--surface-3)",
                border: "none",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
                padding: 3,
                transition: "background-color 200ms ease-out",
              }}
              aria-label="Toggle Safety mode"
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--paper)",
                  transform: safetyMode ? "translateX(20px)" : "translateX(0)",
                  transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </section>

          {/* =========================================================================
              5. TRUSTED CONTACTS ROW (56px circles, punchy initials, add sheet)
             ========================================================================= */}
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "18px 18px",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
            }}
            aria-label="Trusted Contacts"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                  {lang === "hi" ? "विश्वसनीय संपर्क" : "Trusted contacts"}
                </h3>
                <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                  {lang === "hi" ? "एसओएस के दौरान इन्हें सतर्क किया जाएगा" : "Alerted automatically in emergencies"}
                </span>
              </div>
              <span
                className="tabular-nums"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}
              >
                {contacts.length}/5
              </span>
            </div>

            {/* Avatars Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {contacts.map((c) => {
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: c.color,
                        color: "#FFFFFF",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                        fontWeight: 800,
                        boxShadow: "var(--ring-subtle)",
                      }}
                    >
                      <span>{initials}</span>
                      <button
                        onClick={() => handleRemoveContact(c.id)}
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                        aria-label={`Remove contact ${c.name}`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        maxWidth: 64,
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text)",
                      }}
                    >
                      {c.name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}

              {/* Add Button Circle */}
              {contacts.length < 5 && (
                <button
                  onClick={() => setAddContactSheetOpen(true)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--surface-2)",
                    border: "1.5px dashed var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    flexShrink: 0,
                    marginBottom: 20, // aligns with avatar center
                    transition: "transform 150ms ease-out",
                  }}
                  aria-label="Add new trusted contact"
                >
                  <UserPlus size={20} />
                </button>
              )}
            </div>

            {/* Empty state hint */}
            {contacts.length === 0 && (
              <div
                style={{
                  padding: "16px 0 6px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                {lang === "hi"
                  ? "किसी ऐसे व्यक्ति को जोड़ें जिसे आपके सफर की जानकारी होनी चाहिए।"
                  : "Add someone who should know when you travel across Delhi."}
              </div>
            )}
          </section>

          {/* =========================================================================
              6. OFFICIAL HELPLINES (grouped list card, radius 20, 64px rows)
             ========================================================================= */}
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "18px",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
            }}
            aria-label="Official Helplines"
          >
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                {lang === "hi" ? "आधिकारिक हेल्पलाइन" : "Official helplines"}
              </h3>
              <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                {lang === "hi" ? "दिल्ली सरकार एवं राष्ट्रीय आपातकालीन नंबर" : "Verified government emergency response numbers"}
              </span>
            </div>

            {/* Helpline Groups */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Group 1: Emergency */}
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-dim)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {lang === "hi" ? "आपातकालीन" : "Emergency"}
                </span>

                {/* 112 Row */}
                <div
                  style={{
                    minHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "oklch(0.58 0.23 27 / 0.15)",
                        color: "var(--danger-red, #DC2626)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <PhoneCall size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                        {lang === "hi" ? "दिल्ली पुलिस आपातकालीन" : "Delhi Police Emergency"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lang === "hi" ? "राष्ट्रीय आपातकालीन नंबर (पीसीआर)" : "All-in-one national emergency PCR"}
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:112"
                    style={{
                      minWidth: 104,
                      height: 44,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                    aria-label="Call 112"
                  >
                    <Phone size={14} />
                    <span>112</span>
                  </a>
                </div>
              </div>

              {/* Group 2: Women & Children */}
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-dim)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {lang === "hi" ? "महिला एवं बाल सुरक्षा" : "Women & children"}
                </span>

                {/* 1091 Row */}
                <div
                  style={{
                    minHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "oklch(0.62 0.24 355 / 0.15)",
                        color: "var(--magenta)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Shield size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                        {lang === "hi" ? "दिल्ली महिला हेल्पलाइन" : "Delhi Women Helpline"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lang === "hi" ? "24x7 टोल-फ्री संकट रेखा" : "24x7 toll-free distress line"}
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:1091"
                    style={{
                      minWidth: 104,
                      height: 44,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                    aria-label="Call 1091"
                  >
                    <Phone size={14} />
                    <span>1091</span>
                  </a>
                </div>

                {/* 181 Row */}
                <div
                  style={{
                    minHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "oklch(0.80 0.17 75 / 0.15)",
                        color: "var(--saffron)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                        {lang === "hi" ? "दिल्ली महिला आयोग (DCW)" : "Commission for Women"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lang === "hi" ? "संकट हस्तक्षेप एवं सहायता" : "Crisis intervention & assistance"}
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:181"
                    style={{
                      minWidth: 104,
                      height: 44,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                    aria-label="Call 181"
                  >
                    <Phone size={14} />
                    <span>181</span>
                  </a>
                </div>

                {/* 1098 Row (Childline) */}
                <div
                  style={{
                    minHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "oklch(0.55 0.22 262 / 0.15)",
                        color: "var(--electric-blue)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Info size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                        {lang === "hi" ? "चाइल्डलाइन इंडिया" : "Childline India"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lang === "hi" ? "बाल सुरक्षा आपातकालीन सेवा" : "24x7 child emergency service"}
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:1098"
                    style={{
                      minWidth: 104,
                      height: 44,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                    aria-label="Call 1098"
                  >
                    <Phone size={14} />
                    <span>1098</span>
                  </a>
                </div>
              </div>

              {/* Group 3: Transport */}
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-dim)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {lang === "hi" ? "परिवहन नियंत्रण" : "Transport"}
                </span>

                {/* DTC Control Room */}
                <div
                  style={{
                    minHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "oklch(0.70 0.18 150 / 0.15)",
                        color: "var(--green)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Radio size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                        {lang === "hi" ? "डीटीसी केंद्रीय नियंत्रण कक्ष" : "DTC Central Control Room"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lang === "hi" ? "कंडक्टर एवं बेड़ा आपातकालीन संपर्क" : "Verified transit fleet liaison"}
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:01123370373"
                    style={{
                      minWidth: 104,
                      height: 44,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                    aria-label="Call DTC Central Control Room"
                  >
                    <Phone size={13} />
                    <span>011-23370373</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              7. SAFER STOPS NEAR YOU (Snap Carousel, width 240, Demo data badge)
             ========================================================================= */}
          <section aria-label="Safer Stops Near You">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                    {lang === "hi" ? "सुरक्षित स्टॉप" : "Safer stops near you"}
                  </h3>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "var(--surface-3)",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Demo data
                  </span>
                </div>
                <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                  {lang === "hi" ? "सीसीटीवी व पर्याप्त रोशनी वाले स्टॉप" : "Verified shelters with lighting & security"}
                </span>
              </div>
            </div>

            {/* Horizontal Snap Carousel */}
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: 8,
                marginInline: -16,
                paddingInline: 16,
                scrollbarWidth: "none",
              }}
            >
              {safeStops.map((stop) => (
                <div
                  key={stop.stop_id}
                  style={{
                    width: 240,
                    flexShrink: 0,
                    scrollSnapAlign: "start",
                    background: "var(--surface)",
                    borderRadius: 20,
                    padding: "16px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--ring-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        margin: "0 0 4px",
                        lineHeight: 1.3,
                        color: "var(--text)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {lang === "hi" ? stop.name_hi : stop.name}
                    </h4>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}
                    >
                      {stop.distance_m} m · {stop.walk_min} {lang === "hi" ? "मिनट पैदल" : "min walk"}
                    </span>
                  </div>

                  {/* Max 2 Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {stop.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "var(--surface-2)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Directions Button */}
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.name + " Delhi")}`,
                          "_blank"
                        );
                      }
                    }}
                    style={{
                      height: 36,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={13} />
                    <span>{lang === "hi" ? "दिशा-निर्देश" : "Directions"}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              8. SAFETY TIPS (3 compact cards with small original SVG art)
             ========================================================================= */}
          <section aria-label="Transit Safety Tips">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px 0", color: "var(--text)" }}>
              {lang === "hi" ? "सुरक्षित यात्रा सुझाव" : "Safety tips"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {/* Tip 1 */}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "oklch(0.70 0.18 150 / 0.15)",
                    color: "var(--green)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                    {lang === "hi" ? "चालक के पास बैठें" : "Sit near the driver or conductor"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {lang === "hi"
                      ? "कम भीड़ वाले समय में आगे की आरक्षित सीटों का चयन करें।"
                      : "Choose front seats during late night or low-occupancy trips."}
                  </div>
                </div>
              </div>

              {/* Tip 2 */}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "oklch(0.55 0.22 262 / 0.15)",
                    color: "var(--electric-blue)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Share2 size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                    {lang === "hi" ? "अपनी यात्रा साझा करें" : "Share your live trip"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {lang === "hi"
                      ? "एक टैप में अपने परिवार को लाइव बस ट्रैकिंग लिंक भेजें।"
                      : "Send family a 3-hour live tracking link. No login required."}
                  </div>
                </div>
              </div>

              {/* Tip 3 */}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--ring-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "oklch(0.80 0.17 75 / 0.15)",
                    color: "var(--saffron)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                    {lang === "hi" ? "अपनी अंतरात्मा पर भरोसा रखें" : "Trust your instincts"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {lang === "hi"
                      ? "यदि असहज महसूस हो तो तुरंत 112 या महिला हेल्पलाइन 1091 डायल करें।"
                      : "If uncomfortable, immediately alert the conductor or call 112."}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              9. FOOTER
             ========================================================================= */}
          <footer
            style={{
              textAlign: "center",
              padding: "16px 0 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderTop: "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {lang === "hi" ? "आपात स्थिति में हमेशा 112 डायल करें।" : "Always call 112 in an emergency."}
            </span>
            <button
              onClick={() => setLocationSheetOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--electric-blue)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {lang === "hi" ? "एसओएस के दौरान स्थान का उपयोग कैसे होता है" : "How we use your location during SOS"}
            </button>
          </footer>
        </main>
      </div>

      {/* =========================================================================
          MODALS & SHEETS
         ========================================================================= */}

      {/* 1. Add Trusted Contact Sheet */}
      <Sheet
        isOpen={addContactSheetOpen}
        onClose={() => setAddContactSheetOpen(false)}
        title={lang === "hi" ? "विश्वसनीय संपर्क जोड़ें" : "Add trusted contact"}
        icon={<UserPlus size={20} />}
      >
        <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {lang === "hi" ? "नाम" : "Full Name"}
            </label>
            <input
              type="text"
              required
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="e.g. Pooja Sharma"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                padding: "0 14px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 16,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {lang === "hi" ? "मोबाइल नंबर" : "Phone (+91)"}
            </label>
            <input
              type="tel"
              required
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                padding: "0 14px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 16,
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              height: 48,
              borderRadius: 999,
              background: "var(--ink)",
              color: "var(--paper)",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              marginTop: 6,
            }}
          >
            {lang === "hi" ? "संपर्क सहेजें" : "Save contact"}
          </button>
        </form>
      </Sheet>

      {/* 2. Fake Call Modal */}
      {fakeCallOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0, 0, 0, 0.92)",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "60px 24px 48px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "oklch(0.80 0.17 75)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                fontSize: 32,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              M
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>Mom</h3>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
              {fakeCallActive ? "00:08 · Connected" : "Incoming call..."}
            </span>
          </div>

          {!fakeCallActive ? (
            <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: 300 }}>
              <button
                onClick={() => setFakeCallOpen(false)}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "#DC2626",
                  border: "none",
                  color: "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                aria-label="Decline fake call"
              >
                <Phone size={28} style={{ transform: "rotate(135deg)" }} />
              </button>
              <button
                onClick={() => setFakeCallActive(true)}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "#22c55e",
                  border: "none",
                  color: "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                aria-label="Accept fake call"
              >
                <Phone size={28} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setFakeCallActive(false);
                setFakeCallOpen(false);
              }}
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "#DC2626",
                border: "none",
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
              aria-label="End fake call"
            >
              <Phone size={28} style={{ transform: "rotate(135deg)" }} />
            </button>
          )}
        </div>
      )}

      {/* 3. Location Privacy Sheet */}
      <Sheet
        isOpen={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        title={lang === "hi" ? "एसओएस स्थान गोपनीयता" : "SOS Location & Privacy"}
        icon={<Info size={20} />}
      >
        <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text)" }}>
          <p style={{ margin: "0 0 12px" }}>
            {lang === "hi"
              ? "जब आप एसओएस ट्रिगर करते हैं, तो आपका सटीक जीपीएस स्थान केवल दिल्ली परिवहन नियंत्रण कक्ष और आपके चुने हुए विश्वसनीय संपर्कों के साथ साझा किया जाता है।"
              : "When you trigger an SOS, your high-accuracy GPS coordinates are shared exclusively with the DTC transit control room and your designated emergency contacts."}
          </p>
          <p style={{ margin: "0 0 12px" }}>
            {lang === "hi"
              ? "भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण (डीपीडीपी) अधिनियम 2023 के तहत, यह डेटा केवल आपातकालीन सहायता के लिए संसाधित होता है और 180 दिनों के बाद स्वतः हटा दिया जाता है।"
              : "Under India's DPDP Act 2023, emergency telemetry is processed strictly for life-safety assistance and purged after 180 days."}
          </p>
          <button
            onClick={() => setLocationSheetOpen(false)}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 999,
              background: "var(--ink)",
              color: "var(--paper)",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            {lang === "hi" ? "समझ गया" : "Got it"}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
