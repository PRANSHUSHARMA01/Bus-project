"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserProfile } from "@/lib/auth-context";
import {
  User,
  Phone,
  Mail,
  Languages,
  Home,
  Briefcase,
  MapPin,
  Shield,
  FileText,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  AlertTriangle,
  ArrowLeft,
  Plus,
  HeartHandshake
} from "lucide-react";
import { API } from "@/lib/api";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_verified?: number;
  created_at?: string;
}

export default function AccountPage() {
  const { user, token, updateProfile, signOut, deleteAccount } = useAuth();
  const router = useRouter();

  // Personal Info form
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [lang, setLang] = useState<"en" | "hi">(user?.language || "en");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);

  // Transit Places
  const [homeStop, setHomeStop] = useState(user?.home_stop_id || "");
  const [workStop, setWorkStop] = useState(user?.work_stop_id || "");
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);

  // Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRel, setNewContactRel] = useState("Family");
  const [showAddContact, setShowAddContact] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when user profile loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setLang(user.language || "en");
      setHomeStop(user.home_stop_id || "");
      setWorkStop(user.work_stop_id || "");
    }
  }, [user]);

  const loadSavedPlaces = async () => {
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/v1/saved-places`, {
        headers,
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setSavedPlaces(data);
      }
    } catch {}
  };

  const loadEmergencyContacts = async () => {
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/v1/emergency-contacts`, {
        headers,
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadSavedPlaces();
    loadEmergencyContacts();
  }, [token, user]);

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    await updateProfile({
      full_name: fullName,
      phone,
      language: lang,
      home_stop_id: homeStop || undefined,
      work_stop_id: workStop || undefined
    });
    setSavingPersonal(false);
    setPersonalSaved(true);
    setTimeout(() => setPersonalSaved(false), 3000);
  };

  const handleAddCustomPlace = async () => {
    const label = prompt("Place name (e.g. Gym, Library, Metro Station):");
    if (!label) return;
    const stopId = prompt("Stop ID or Name (e.g. 7572, Kashmere Gate):");
    if (!stopId) return;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/v1/saved-places`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ label, stop_id: stopId })
      });
      if (res.ok) loadSavedPlaces();
    } catch {}
  };

  const handleDeleteSavedPlace = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/v1/saved-places/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include"
      });
      if (res.ok) loadSavedPlaces();
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
          relationship: newContactRel.trim() || "Family"
        })
      });
      if (res.ok) {
        setNewContactName("");
        setNewContactPhone("");
        setShowAddContact(false);
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
        credentials: "include"
      });
      if (res.ok) loadEmergencyContacts();
    } catch {}
  };

  const handleDownloadData = async () => {
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      let exportData: any = null;

      try {
        const directRes = await fetch(`${API}/v1/auth/data-export`, { headers, credentials: "include" });
        if (directRes.ok) {
          exportData = await directRes.json();
        }
      } catch {}

      if (!exportData) {
        const [tripsRes, placesRes, contactsRes] = await Promise.all([
          fetch(`${API}/v1/trips?limit=100`, { headers, credentials: "include" }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/v1/saved-places`, { headers, credentials: "include" }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/v1/emergency-contacts`, { headers, credentials: "include" }).then(r => r.ok ? r.json() : [])
        ]);

        exportData = {
          compliance_standard: "India Digital Personal Data Protection Act (DPDP) 2023 & GDPR (EU) 2016/679",
          exported_at: new Date().toISOString(),
          profile: user,
          trips: tripsRes,
          saved_places: placesRes,
          emergency_contacts: contactsRes
        };
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delhi_smart_bus_data_${user?.id || "export"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export data. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== "DELETE") return;
    setIsDeleting(true);
    await deleteAccount();
  };

  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      padding: "24px 16px 80px",
      display: "flex",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 580,
        display: "flex",
        flexDirection: "column",
        gap: 20
      }}>
        {/* Navigation Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-display" style={{ fontSize: 22, margin: 0 }}>
            {lang === "hi" ? "खाता और प्राथमिकताएं" : "Account & Settings"}
          </h1>
        </div>

        {/* 1. Profile Header Card */}
        <div style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--ring)",
          display: "flex",
          alignItems: "center",
          gap: 18
        }}>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                objectFit: "cover",
                outline: "1px solid rgba(0,0,0,0.1)",
                outlineOffset: -1
              }}
            />
          ) : (
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontSize: 22,
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              outline: "1px solid rgba(0,0,0,0.1)",
              outlineOffset: -1
            }}>
              {initials}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {user?.full_name || "Delhi Commuter"}
              </div>
              <span style={{
                background: user?.role === "admin" ? "var(--accent)" : "var(--surface-3)",
                color: user?.role === "admin" ? "var(--on-accent)" : "var(--text-muted)",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "2px 8px",
                borderRadius: 999
              }}>
                {user?.role || "Passenger"}
              </span>
            </div>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              {user?.email || "Commuter account"}
            </div>
          </div>
        </div>

        {/* 2. Personal Info Section */}
        <div style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--ring)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <h2 className="text-heading" style={{ fontSize: 16, margin: 0 }}>
            {lang === "hi" ? "व्यक्तिगत जानकारी" : "Personal info"}
          </h2>

          <form onSubmit={handleSavePersonalInfo} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="text-caption" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "0 14px",
                  fontSize: 15,
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label className="text-caption" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "0 14px",
                  fontSize: 15,
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label className="text-caption" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                App Language / ऐप की भाषा
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    border: lang === "en" ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: lang === "en" ? "var(--surface-2)" : "var(--surface)",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--text)",
                    cursor: "pointer"
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    border: lang === "hi" ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: lang === "hi" ? "var(--surface-2)" : "var(--surface)",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--text)",
                    cursor: "pointer"
                  }}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 4 }}>
              {personalSaved && (
                <span style={{ color: "var(--crowd-low)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={14} /> Saved
                </span>
              )}
              <button
                type="submit"
                disabled={savingPersonal}
                className="btn-pill-primary"
                style={{
                  height: 40,
                  padding: "0 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: savingPersonal ? "wait" : "pointer"
                }}
              >
                Save changes
              </button>
            </div>
          </form>
        </div>

        {/* 3. My Transit Places */}
        <div style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--ring)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="text-heading" style={{ fontSize: 16, margin: 0 }}>
              {lang === "hi" ? "मेरे पसंदीदा स्टॉप" : "My transit places"}
            </h2>
            <button
              onClick={handleAddCustomPlace}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Plus size={14} /> {lang === "hi" ? "स्थान जोड़ें" : "Add place"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--surface-2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Home size={18} style={{ color: "var(--accent)" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Home Stop</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {homeStop || "Not configured"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const val = prompt("Enter Home Bus Stop:", homeStop);
                  if (val !== null) {
                    setHomeStop(val);
                    updateProfile({ home_stop_id: val });
                  }
                }}
                style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {homeStop ? "Change" : "Add"}
              </button>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--surface-2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Briefcase size={18} style={{ color: "var(--accent)" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Work / College Stop</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {workStop || "Not configured"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const val = prompt("Enter Work Bus Stop:", workStop);
                  if (val !== null) {
                    setWorkStop(val);
                    updateProfile({ work_stop_id: val });
                  }
                }}
                style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {workStop ? "Change" : "Add"}
              </button>
            </div>

            {/* Custom Saved Places List */}
            {savedPlaces.map((sp) => (
              <div
                key={sp.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--surface-2)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={18} style={{ color: "var(--accent)" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{sp.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Stop {sp.stop_id}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSavedPlace(sp.id)}
                  style={{ background: "none", border: "none", color: "var(--crowd-high)", fontSize: 13, cursor: "pointer" }}
                  aria-label="Delete saved place"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3.5 Emergency Contacts (Safety & Women's Transit Support) */}
        <div style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--ring)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 className="text-heading" style={{ fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <HeartHandshake size={18} style={{ color: "var(--crowd-high)" }} />
                {lang === "hi" ? "आपातकालीन संपर्क" : "Emergency contacts"}
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {lang === "hi"
                  ? "एसओएस और लाइव राइड शेयरिंग के लिए विश्वसनीय संपर्क"
                  : "Trusted contacts notified during SOS & live trip sharing"}
              </div>
            </div>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Plus size={14} /> {showAddContact ? "Cancel" : "Add"}
            </button>
          </div>

          {showAddContact && (
            <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, background: "var(--surface-2)", borderRadius: 12 }}>
              <input
                type="text"
                placeholder="Contact Name (e.g. Mom, Amit)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  padding: "0 10px",
                  fontSize: 14,
                  background: "var(--surface)",
                  color: "var(--text)",
                  outline: "none"
                }}
              />
              <input
                type="tel"
                placeholder="Phone Number (+91 98765 43210)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  padding: "0 10px",
                  fontSize: 14,
                  background: "var(--surface)",
                  color: "var(--text)",
                  outline: "none"
                }}
              />
              <select
                value={newContactRel}
                onChange={(e) => setNewContactRel(e.target.value)}
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  padding: "0 10px",
                  fontSize: 14,
                  background: "var(--surface)",
                  color: "var(--text)",
                  outline: "none"
                }}
              >
                <option value="Family">Family / परिवार</option>
                <option value="Friend">Friend / दोस्त</option>
                <option value="Colleague">Colleague / सहकर्मी</option>
                <option value="Other">Other / अन्य</option>
              </select>
              <button
                type="submit"
                className="btn-pill-primary"
                style={{ height: 38, fontSize: 13, fontWeight: 600, marginTop: 4 }}
              >
                Save Emergency Contact
              </button>
            </form>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contacts.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
                No emergency contacts added yet. Add family members for safety alerts.
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "var(--surface-2)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      {c.name}
                      <span style={{
                        fontSize: 11,
                        background: "var(--surface)",
                        padding: "1px 6px",
                        borderRadius: 6,
                        color: "var(--text-muted)"
                      }}>
                        {c.relationship}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.phone}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    style={{ background: "none", border: "none", color: "var(--crowd-high)", cursor: "pointer" }}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Account Security & Sessions */}
        <div style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--ring)",
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}>
          <h2 className="text-heading" style={{ fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} /> Account security
          </h2>
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--surface-2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Current Browser Session</div>
              <div style={{ fontSize: 12, color: "var(--crowd-low)", fontWeight: 500 }}>Active now · Web App</div>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>This device</span>
          </div>

          <button
            onClick={signOut}
            style={{
              height: 40,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <LogOut size={16} /> Sign out of this device
          </button>
        </div>

        {/* 5. Data & Privacy (GDPR) */}
        <div style={{
          background: "var(--surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--ring)",
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}>
          <h2 className="text-heading" style={{ fontSize: 16, margin: 0 }}>
            Data & privacy
          </h2>

          <button
            onClick={handleDownloadData}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={16} /> Download my data (JSON export)
            </span>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <Link
              href="/privacy"
              style={{
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                gap: 6
              }}
            >
              <Shield size={14} style={{ color: "#10B981" }} /> Privacy (DPDP)
            </Link>
            <Link
              href="/terms"
              style={{
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                gap: 6
              }}
            >
              <FileText size={14} style={{ color: "#F59E0B" }} /> Terms of Service
            </Link>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid var(--crowd-high)",
              background: "transparent",
              color: "var(--crowd-high)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Trash2 size={16} /> Delete account & erase all data
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Delete Account Modal Confirmation */}
      {isDeleteModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            width: "100%",
            maxWidth: 420,
            background: "var(--surface)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "var(--ring-elevated)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--crowd-high)" }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Permanently Delete Account?</h3>
            </div>
            <p className="text-body" style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
              This will irreversibly delete your transit profile, trip history, saved places, and all personal records from our database.
            </p>
            <div>
              <label className="text-caption" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "0 14px",
                  fontSize: 15,
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmationText(""); }}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText.trim() !== "DELETE" || isDeleting}
                style={{
                  height: 40,
                  padding: "0 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--crowd-high)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: deleteConfirmationText.trim() === "DELETE" ? "pointer" : "not-allowed",
                  opacity: deleteConfirmationText.trim() === "DELETE" ? 1 : 0.5
                }}
              >
                {isDeleting ? "Deleting..." : "Erase everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
