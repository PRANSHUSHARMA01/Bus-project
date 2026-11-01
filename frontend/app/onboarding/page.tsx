"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Check, MapPin, ArrowRight, Languages, Home, Briefcase } from "lucide-react";

export default function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [homeStop, setHomeStop] = useState("");
  const [workStop, setWorkStop] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCompleteStep1 = () => {
    updateProfile({ language: lang });
    setStep(2);
  };

  const handleFinish = async () => {
    setSaving(true);
    await updateProfile({
      language: lang,
      home_stop_id: homeStop || undefined,
      work_stop_id: workStop || undefined
    });
    setSaving(false);
    router.replace("/");
  };

  const handleSkip = () => {
    router.replace("/");
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
        maxWidth: 440,
        background: "var(--surface)",
        borderRadius: 24,
        padding: "36px 28px",
        boxShadow: "var(--ring-elevated)",
        display: "flex",
        flexDirection: "column",
        gap: 28
      }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            flex: 1,
            height: 4,
            borderRadius: 999,
            background: "var(--accent)"
          }} />
          <div style={{
            flex: 1,
            height: 4,
            borderRadius: 999,
            background: step === 2 ? "var(--accent)" : "var(--surface-3)"
          }} />
        </div>

        {step === 1 ? (
          /* Step 1: Language Selection */
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--surface-2)",
                color: "var(--accent)",
                display: "grid",
                placeItems: "center",
                marginBottom: 12
              }}>
                <Languages size={22} />
              </div>
              <h1 className="text-display" style={{ fontSize: 24, margin: "0 0 6px" }}>
                Pick your language / भाषा चुनें
              </h1>
              <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
                You can change this anytime from your account settings.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* English Card */}
              <div
                onClick={() => setLang("en")}
                style={{
                  height: 56,
                  borderRadius: 14,
                  border: lang === "en" ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: lang === "en" ? "var(--surface-2)" : "var(--surface)",
                  padding: "0 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 150ms ease"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>English</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Default application language</div>
                </div>
                {lang === "en" && (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    display: "grid",
                    placeItems: "center"
                  }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Hindi Card */}
              <div
                onClick={() => setLang("hi")}
                style={{
                  height: 56,
                  borderRadius: 14,
                  border: lang === "hi" ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: lang === "hi" ? "var(--surface-2)" : "var(--surface)",
                  padding: "0 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 150ms ease"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>हिंदी (Hindi)</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>दिल्ली परिवहन बस ट्रैकिंग</div>
                </div>
                {lang === "hi" && (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    display: "grid",
                    placeItems: "center"
                  }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCompleteStep1}
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
                cursor: "pointer",
                marginTop: 8
              }}
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Step 2: Home & Work Stops */
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--surface-2)",
                color: "var(--accent)",
                display: "grid",
                placeItems: "center",
                marginBottom: 12
              }}>
                <MapPin size={22} />
              </div>
              <h1 className="text-display" style={{ fontSize: 24, margin: "0 0 6px" }}>
                Where do you travel most?
              </h1>
              <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
                Save your daily stops for one-tap live bus arrival tracking.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="text-caption" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Home size={14} /> Home Bus Stop
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mehrauli Terminal"
                  value={homeStop}
                  onChange={(e) => setHomeStop(e.target.value)}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    padding: "0 14px",
                    fontSize: 16,
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label className="text-caption" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Briefcase size={14} /> Work / College Stop
                </label>
                <input
                  type="text"
                  placeholder="e.g. Connaught Place / Shivaji Stadium"
                  value={workStop}
                  onChange={(e) => setWorkStop(e.target.value)}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    padding: "0 14px",
                    fontSize: 16,
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <button
                onClick={handleFinish}
                disabled={saving}
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
                  cursor: saving ? "wait" : "pointer"
                }}
              >
                <span>{saving ? "Saving preferences..." : "Finish setup"}</span>
                <Check size={18} />
              </button>

              <button
                onClick={handleSkip}
                style={{
                  height: 40,
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
