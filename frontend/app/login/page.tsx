"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Bus, ArrowRight, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";
import { MovingBus } from "@/components/anatomy/MovingBus";

export default function LoginPage() {
  const { user, signInWithEmail, verifyOtp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check URL query error params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "google_not_configured") {
        setErrorMsg("Google Sign-In is not configured yet. Please enter your email below to receive an instant verification code.");
      } else if (err) {
        setErrorMsg(`Authentication issue: ${err.replace(/_/g, " ")}. Please try email login.`);
      }
    }
  }, []);

  // If already signed in, redirect to home
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === "otp" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    const res = await signInWithEmail(email);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setStep("otp");
      setCountdown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    // Single digit entry
    const char = cleaned.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // Auto-submit when all 6 digits entered
      const fullCode = nextOtp.join("");
      if (fullCode.length === 6) {
        submitOtpCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      submitOtpCode(pasted);
    }
  };

  const submitOtpCode = async (code: string) => {
    setLoading(true);
    setErrorMsg("");
    const res = await verifyOtp(email, code);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (res.isNewUser) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "var(--bg)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--surface)",
        borderRadius: 24,
        padding: "36px 28px",
        boxShadow: "var(--ring-elevated)",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 12 }}>
            <MovingBus compact={true} />
          </div>
          <h1 className="text-display" style={{ fontSize: 24, margin: "8px 0 6px 0" }}>
            Delhi Smart Transit
          </h1>
          <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Live bus arrival tracking, seat occupancy, and safe routes across NCR.
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={signInWithGoogle}
          style={{
            height: 48,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontWeight: 600,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            width: "100%",
            transition: "background-color 150ms ease"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.25 21.31 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.69 1.27 6.59l4.01 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "var(--text-muted)",
          fontSize: 13
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Email / OTP Form */}
        {step === "email" ? (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="login-email" className="text-caption" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: 14, top: 15, color: "var(--text-muted)" }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    padding: "0 14px 0 42px",
                    fontSize: 16, // 16px prevents iOS zoom
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: "var(--crowd-high)", fontSize: 13, fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary"
              style={{
                height: 48,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: loading ? "wait" : "pointer"
              }}
            >
              <span>{loading ? "Sending code..." : "Get 6-digit code"}</span>
              <ArrowRight size={18} />
            </button>

            <p className="text-caption" style={{ color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              We'll send a 6-digit code. No password needed.
            </p>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="text-caption" style={{ fontWeight: 600 }}>Enter 6-digit code</span>
                <button
                  onClick={() => { setStep("email"); setErrorMsg(""); }}
                  style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}
                >
                  Change email
                </button>
              </div>

              {/* 6 Square 48px Input Boxes */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text)",
                      fontSize: 22,
                      fontWeight: 700,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      outline: "none"
                    }}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: "var(--crowd-high)", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={() => submitOtpCode(otp.join(""))}
              disabled={loading || otp.join("").length < 6}
              className="btn-pill-primary"
              style={{
                height: 48,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: loading ? "wait" : "pointer"
              }}
            >
              <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
              <CheckCircle2 size={18} />
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              {countdown > 0 ? (
                <span>Resend code in {countdown}s</span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
                >
                  Resend 6-digit code
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Legal Terms */}
        <div style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          paddingTop: 16
        }}>
          By signing in, you agree to the{" "}
          <a href="/legal/terms" style={{ color: "var(--accent)", textDecoration: "underline" }}>Terms of Service</a>
          {" "}and{" "}
          <a href="/legal/privacy" style={{ color: "var(--accent)", textDecoration: "underline" }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}
