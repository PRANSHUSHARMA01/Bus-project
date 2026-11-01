"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  HelpCircle,
  CreditCard,
  ShieldCheck,
  Inbox,
  Moon,
  Settings,
  Shield,
  FileText,
  ChevronRight,
  LogOut,
  Download,
  Trash2,
  Check,
  Sparkles,
  ArrowLeft,
  X,
  Phone,
  User,
  HeartHandshake
} from "lucide-react";
import { API } from "@/lib/api";
import { Sheet } from "@/components/ui/Sheet";
import { BottomNav } from "@/components/ui/BottomNav";
import { PillButton } from "@/components/ui/PillButton";
import { PinkPassIllustration } from "@/components/ui/PromoBanner";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function AccountPage() {
  const { user, token, updateProfile, signOut, deleteAccount } = useAuth();
  const router = useRouter();

  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">("system");
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  // Sheets
  const [appearanceSheetOpen, setAppearanceSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [privacySheetOpen, setPrivacySheetOpen] = useState(false);
  const [safetySheetOpen, setSafetySheetOpen] = useState(false);
  const [legalSheetOpen, setLegalSheetOpen] = useState(false);

  // Profile Edit
  const [fullName, setFullName] = useState(user?.full_name || "Pranshu Sharma");
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");
  const [lang, setLang] = useState<"en" | "hi">(user?.language || "en");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRel, setNewContactRel] = useState("Family");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.phone) setPhone(user.phone);
      if (user.language) setLang(user.language);
    }
  }, [user]);

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem("smart_bus_theme") || localStorage.getItem("delhi_bus_theme") || "system") as "system" | "light" | "dark";
      setThemeMode(savedTheme);
      const savedMotion = localStorage.getItem("smart_bus_reduce_motion") === "true";
      setReduceMotion(savedMotion);
    } catch {}
    loadEmergencyContacts();
  }, [token]);

  const applyTheme = async (mode: "system" | "light" | "dark") => {
    setThemeMode(mode);
    try {
      localStorage.setItem("smart_bus_theme", mode);
      localStorage.setItem("delhi_bus_theme", mode);
      let effective = mode;
      if (mode === "system") {
        effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      document.documentElement.setAttribute("data-theme", effective);

      if (token) {
        fetch(`${API}/v1/auth/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          credentials: "include",
          body: JSON.stringify({ theme: mode }),
        }).catch(() => {});
      }
    } catch {}
  };

  const toggleReduceMotion = (val: boolean) => {
    setReduceMotion(val);
    try {
      localStorage.setItem("smart_bus_reduce_motion", String(val));
      if (val) {
        document.documentElement.setAttribute("data-reduce-motion", "true");
      } else {
        document.documentElement.removeAttribute("data-reduce-motion");
      }
    } catch {}
  };

  const loadEmergencyContacts = async () => {
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/v1/emergency-contacts`, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch {}
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/v1/emergency-contacts`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          name: newContactName.trim(),
          phone: newContactPhone.trim(),
          relationship: newContactRel.trim() || "Family",
        }),
      });
      if (res.ok) {
        setNewContactName("");
        setNewContactPhone("");
        loadEmergencyContacts();
      }
    } catch {}
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/v1/emergency-contacts/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (res.ok) loadEmergencyContacts();
    } catch {}
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    await updateProfile({
      full_name: fullName,
      phone,
      language: lang,
    });
    setSavingPersonal(false);
    setPersonalSaved(true);
    setTimeout(() => {
      setPersonalSaved(false);
      setSettingsSheetOpen(false);
    }, 1200);
  };

  const handleDownloadData = async () => {
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const exportData = {
        compliance_standard: "India Digital Personal Data Protection Act (DPDP) 2023",
        exported_at: new Date().toISOString(),
        profile: user || { full_name: fullName, phone },
        emergency_contacts: contacts,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delhi_smart_bus_data_${user?.id || "export"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== "DELETE") return;
    setIsDeleting(true);
    await deleteAccount();
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "PS";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "20px 16px calc(var(--nav-h) + 28px + env(safe-area-inset-bottom, 16px))",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* 1. Hero Row: Huge Bold Uppercase Name (Bricolage 800) + Tiny Chip + 88x88 Round Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            paddingTop: 8,
          }}
        >
          {/* Left: Name + Chip */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <h1
              className="text-display-xl"
              style={{
                margin: 0,
                color: "var(--text)",
                letterSpacing: "-0.03em",
                wordBreak: "break-word",
              }}
            >
              {fullName}
            </h1>

            {/* Tiny Chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--ring-subtle)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                width: "fit-content",
              }}
            >
              <span>Frequent commuter · 4.9 ★</span>
            </div>
          </div>

          {/* Right: Round Avatar 88x88 with Layered Shadow Ring */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "oklch(0.55 0.22 262)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: "2rem",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              flexShrink: 0,
              boxShadow: "0 0 0 3px var(--paper), var(--ring)",
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
        </div>

        {/* 2. Quick Tiles Row (2x2 Chunky Grid, Height 84px, Radius 16) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {[
            { label: "Help", icon: HelpCircle, action: () => router.push("/services/faqs") },
            { label: "Passes", icon: CreditCard, action: () => router.push("/services/fares-passes") },
            { label: "Safety", icon: ShieldCheck, action: () => router.push("/safety") },
            { label: "Activity", icon: Inbox, action: () => router.push("/activity") },
          ].map((tile) => (
            <button
              key={tile.label}
              onClick={tile.action}
              className="btn-press"
              style={{
                height: 84,
                borderRadius: 16,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                boxShadow: "var(--ring-subtle)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <tile.icon size={24} style={{ color: "var(--text)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{tile.label}</span>
            </button>
          ))}
        </div>

        {/* 3. Big Rounded Promo Tile with Illustration on the Right */}
        <div
          onClick={() => router.push("/services/fares-passes")}
          className="btn-press"
          style={{
            width: "100%",
            borderRadius: 20,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--ring)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
          role="button"
          tabIndex={0}
        >
          <div style={{ width: "62%", display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "+0.06em",
                color: "oklch(0.55 0.24 355)",
              }}
            >
              DTC PINK PASS
            </span>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
              Free bus travel for women
            </h3>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Available on all DTC & DIMTS electric fleets. Single journey ticket.
            </p>
          </div>
          <div style={{ width: "34%", aspectRatio: "4/3", borderRadius: 12, overflow: "hidden" }}>
            <PinkPassIllustration />
          </div>
        </div>

        {/* 4. Plain Icon List Rows (The Reference Uber List Section) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 4,
          }}
        >
          {[
            {
              id: "appearance",
              title: "Appearance",
              subtitle: `Theme: ${themeMode === "system" ? "System default" : themeMode === "dark" ? "Dark mode" : "Light mode"}`,
              icon: Moon,
              badge: null,
              onClick: () => setAppearanceSheetOpen(true),
            },
            {
              id: "safety_checkup",
              title: "Safety checkup",
              subtitle: "Emergency contacts & bus marshal dispatch",
              icon: ShieldCheck,
              badge: "NEW",
              onClick: () => setSafetySheetOpen(true),
            },
            {
              id: "settings",
              title: "Settings & Profile",
              subtitle: "Name, phone, language preferences",
              icon: Settings,
              badge: null,
              onClick: () => setSettingsSheetOpen(true),
            },
            {
              id: "privacy",
              title: "Privacy & Data",
              subtitle: "Download personal data archive, delete account",
              icon: Shield,
              badge: null,
              onClick: () => setPrivacySheetOpen(true),
            },
            {
              id: "legal",
              title: "Legal & About",
              subtitle: "Terms of service, privacy policy, DPDP 2023",
              icon: FileText,
              badge: null,
              onClick: () => setLegalSheetOpen(true),
            },
          ].map((row, idx, arr) => (
            <button
              key={row.id}
              onClick={row.onClick}
              className="btn-press"
              style={{
                width: "100%",
                padding: "16px 4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <row.icon size={24} style={{ color: "var(--text)", flexShrink: 0 }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
                      {row.title}
                    </span>
                    {row.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: "oklch(0.55 0.22 262)",
                          color: "#ffffff",
                          letterSpacing: "+0.04em",
                        }}
                      >
                        {row.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {row.subtitle}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* 5. Tribute Footer + Version Text + Clean Sign Out */}
        <div style={{ textAlign: "center", padding: "20px 0 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>
            Made in India for the people of India{" "}
            <span className="heartbeat" style={{ display: "inline-block", color: "#EF4444" }}>
              ❤️
            </span>
          </p>
          <p
            className="text-caption"
            style={{
              color: "var(--text-muted)",
              letterSpacing: "+0.05em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              margin: 0,
            }}
          >
            Made by Team Qubits
          </p>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-dim)" }}>
            v2.4.0 · Delhi Smart Bus System
          </span>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => signOut()}
              className="btn-press"
              style={{
                width: "100%",
                height: 48,
                borderRadius: "var(--r-card)",
                background: "oklch(0.58 0.23 27 / 0.1)",
                color: "oklch(0.58 0.23 27)",
                border: "1px solid oklch(0.58 0.23 27 / 0.25)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          APPEARANCE & DARK MODE BOTTOM SHEET (Step 6 specs)
         ========================================================================= */}
      {appearanceSheetOpen && (
        <Sheet isOpen={true} onClose={() => setAppearanceSheetOpen(false)} title="Appearance">
          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 16 }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "+0.05em", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
                Theme Mode
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { id: "system" as const, label: "System default", desc: "Follow operating system light/dark preference" },
                  { id: "light" as const, label: "Light mode", desc: "Clean paper surfaces with high contrast ink" },
                  { id: "dark" as const, label: "Dark mode", desc: "Low-glare dark surfaces for night commuting" },
                ].map((opt) => {
                  const isSelected = themeMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => applyTheme(opt.id)}
                      className="btn-press"
                      style={{
                        padding: "14px 16px",
                        borderRadius: 14,
                        background: isSelected ? "var(--surface-2)" : "var(--surface)",
                        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)", display: "block" }}>
                          {opt.label}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{opt.desc}</span>
                      </div>
                      {isSelected && <Check size={18} style={{ color: "var(--accent)" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reduce Motion Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 14,
                background: "var(--surface-2)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)", display: "block" }}>
                  Reduce motion
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Disable animations and animated transitions
                </span>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => toggleReduceMotion(e.target.checked)}
                style={{ width: 22, height: 22, cursor: "pointer", accentColor: "var(--accent)" }}
              />
            </div>

            <PillButton
              variant="primary"
              size="lg"
              onClick={() => setAppearanceSheetOpen(false)}
              style={{ width: "100%" }}
            >
              Done
            </PillButton>
          </div>
        </Sheet>
      )}

      {/* =========================================================================
          SETTINGS & PROFILE BOTTOM SHEET
         ========================================================================= */}
      {settingsSheetOpen && (
        <Sheet isOpen={true} onClose={() => setSettingsSheetOpen(false)} title="Settings & Profile">
          <form onSubmit={handleSavePersonalInfo} style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  padding: "0 12px",
                  color: "var(--text)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  padding: "0 12px",
                  color: "var(--text)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Language / भाषा</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "en" | "hi")}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  padding: "0 12px",
                  color: "var(--text)",
                }}
              >
                <option value="en">English (India)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            <PillButton type="submit" variant="primary" size="lg" disabled={savingPersonal} style={{ width: "100%", marginTop: 8 }}>
              {personalSaved ? "Saved Successfully!" : savingPersonal ? "Saving..." : "Save Changes"}
            </PillButton>
          </form>
        </Sheet>
      )}

      {/* =========================================================================
          SAFETY CHECKUP BOTTOM SHEET
         ========================================================================= */}
      {safetySheetOpen && (
        <Sheet isOpen={true} onClose={() => setSafetySheetOpen(false)} title="Safety Checkup">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Contacts listed here receive your live bus GPS coordinates when you trigger the in-app SOS button.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "var(--surface-2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.9375rem", display: "block" }}>{c.name} ({c.relationship})</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{c.phone}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    style={{ background: "none", border: "none", color: "oklch(0.58 0.23 27)", cursor: "pointer", padding: 6 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <input
                type="text"
                placeholder="Contact Name (e.g. Brother, Roommate)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
                style={{ width: "100%", height: 40, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", padding: "0 12px", color: "var(--text)" }}
              />
              <input
                type="tel"
                placeholder="Phone Number (+91...)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
                style={{ width: "100%", height: 40, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", padding: "0 12px", color: "var(--text)" }}
              />
              <PillButton type="submit" variant="secondary" size="md">
                Add Emergency Contact
              </PillButton>
            </form>
          </div>
        </Sheet>
      )}

      {/* =========================================================================
          PRIVACY & DATA BOTTOM SHEET
         ========================================================================= */}
      {privacySheetOpen && (
        <Sheet isOpen={true} onClose={() => setPrivacySheetOpen(false)} title="Privacy & Data">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>
            <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-2)" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "0.9375rem" }}>DPDP 2023 Compliance</h3>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                You have the full right to data portability and immediate erasure under Indian data protection laws.
              </p>
            </div>

            <PillButton variant="secondary" size="lg" onClick={handleDownloadData} style={{ width: "100%" }}>
              <Download size={18} style={{ marginRight: 8 }} />
              Download My Data Archive (JSON)
            </PillButton>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn-press"
              style={{
                width: "100%",
                height: 48,
                borderRadius: "var(--r-card)",
                background: "oklch(0.58 0.23 27 / 0.12)",
                color: "oklch(0.58 0.23 27)",
                border: "1px solid oklch(0.58 0.23 27 / 0.3)",
                fontWeight: 700,
                fontSize: "0.875rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Trash2 size={16} />
              Delete Account & Commuter History
            </button>
          </div>
        </Sheet>
      )}

      {/* =========================================================================
          LEGAL & ABOUT BOTTOM SHEET
         ========================================================================= */}
      {legalSheetOpen && (
        <Sheet isOpen={true} onClose={() => setLegalSheetOpen(false)} title="Legal & Compliance">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
            {[
              { title: "Privacy Policy", href: "/privacy", desc: "DPDP 2023 & GDPR Data Processing standards" },
              { title: "Terms of Service", href: "/terms", desc: "User responsibilities and service agreements" },
              { title: "Open Source Licenses", href: "/design-system", desc: "MIT, OpenStreetMap, ODbL acknowledgments" },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem", display: "block" }}>{item.title}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.desc}</span>
                </div>
                <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}
          </div>
        </Sheet>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "var(--surface)",
              borderRadius: 20,
              padding: 20,
              boxShadow: "var(--ring)",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "oklch(0.58 0.23 27)" }}>Confirm Permanent Account Deletion</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0 0 12px 0" }}>
              Type <strong>DELETE</strong> below to erase your profile, saved places, and commuter history permanently.
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: "100%",
                height: 40,
                borderRadius: 10,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                padding: "0 12px",
                color: "var(--text)",
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <PillButton variant="secondary" size="md" onClick={() => setIsDeleteModalOpen(false)} style={{ flex: 1 }}>
                Cancel
              </PillButton>
              <PillButton
                variant="danger"
                size="md"
                disabled={deleteConfirmationText !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
                style={{ flex: 1 }}
              >
                {isDeleting ? "Deleting..." : "Erase All"}
              </PillButton>
            </div>
          </div>
        </div>
      )}

      <BottomNav
        activeTab="account"
        onSelectTab={(tab) => router.push(tab === "home" ? "/" : `/${tab}`)}
        lang={lang}
      />
    </div>
  );
}
