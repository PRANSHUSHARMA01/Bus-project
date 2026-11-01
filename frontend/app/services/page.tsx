"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sheet } from "@/components/ui/Sheet";
import { BottomNav } from "@/components/ui/BottomNav";
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
  ChevronRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

interface ServiceItem {
  id: string;
  title: string;
  title_hi: string;
  description: string;
  description_hi: string;
  icon: string;
  badge?: string;
  link?: string;
}

interface ServiceSection {
  category: string;
  category_hi: string;
  services: ServiceItem[];
}

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const lang = user?.language || "en";

  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [activeSheet, setActiveSheet] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/v1/services`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setSections(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
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

  const handleServiceClick = (s: ServiceItem) => {
    if (s.link && s.link.startsWith("tel:")) {
      window.location.href = s.link;
      return;
    }
    if (s.link && s.link.startsWith("/")) {
      router.push(s.link);
      return;
    }
    setActiveSheet(s);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      padding: "20px 16px 100px",
      display: "flex",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        gap: 22
      }}>
        {/* Header */}
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
          <div>
            <h1 className="text-display" style={{ fontSize: 24, margin: 0 }}>
              {lang === "hi" ? "दिल्ली पारगमन सेवाएं" : "Transit Services"}
            </h1>
            <p className="text-caption" style={{ color: "var(--text-muted)", margin: 0 }}>
              {lang === "hi" ? "आधिकारिक डीटीसी और दिल्ली सरकार पारगमन निर्देशिका" : "Official DTC & Delhi Government transit directory"}
            </p>
          </div>
        </div>

        {/* Categories & Service Items */}
        {sections.map((sec, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 className="text-heading" style={{ fontSize: 15, margin: "4px 4px", color: "var(--text)" }}>
              {lang === "hi" ? sec.category_hi : sec.category}
            </h2>

            <div style={{
              background: "var(--surface)",
              borderRadius: 20,
              boxShadow: "var(--ring)",
              overflow: "hidden",
              border: "1px solid transparent"
            }}>
              {sec.services.map((item, itemIdx) => (
                <button
                  key={item.id}
                  onClick={() => handleServiceClick(item)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px",
                    background: "none",
                    border: "none",
                    borderBottom: itemIdx < sec.services.length - 1 ? "1px solid var(--border)" : "none",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 150ms ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: item.id.startsWith("police") || item.id.startsWith("women") ? "rgba(239, 68, 68, 0.12)" : "var(--surface-2)",
                      color: item.id.startsWith("police") || item.id.startsWith("women") ? "var(--crowd-high)" : "var(--accent)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0
                    }}>
                      {getIconComponent(item.icon)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>
                          {lang === "hi" ? item.title_hi : item.title}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "var(--surface-3)",
                            color: "var(--text-muted)"
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                        {lang === "hi" ? item.description_hi : item.description}
                      </div>
                    </div>
                  </div>
                  {item.link && item.link.startsWith("tel:") ? (
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "var(--crowd-high)",
                      display: "grid",
                      placeItems: "center"
                    }}>
                      <PhoneCall size={16} />
                    </div>
                  ) : (
                    <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Service Detail Interactive Sheet */}
      {activeSheet && (
        <Sheet
          isOpen={Boolean(activeSheet)}
          onClose={() => setActiveSheet(null)}
          title={lang === "hi" ? activeSheet.title_hi : activeSheet.title}
          icon={getIconComponent(activeSheet.icon)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {lang === "hi" ? activeSheet.description_hi : activeSheet.description}
            </p>

            {activeSheet.id === "seat-finder" && (
              <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-2)", fontSize: 13, lineHeight: 1.5 }}>
                <strong>How it works:</strong> Our ML algorithm models passenger demand per stop and time of day. When waiting for a bus, buses with &lt;40% load are highlighted green so you have a guaranteed seat.
              </div>
            )}

            {activeSheet.id === "fares-passes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Non-AC DTC Buses</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>₹5 (up to 4 km) · ₹10 (4–10 km) · ₹15 (&gt;10 km)</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>AC Low-Floor / Electric Buses</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>₹10 (up to 4 km) · ₹15 (4–8 km) · ₹20 (8–12 km) · ₹25 (&gt;12 km)</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Daily All-Route Pass</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Non-AC: ₹40/day · AC Pass: ₹50/day (Valid all DTC/DIMTS routes)</div>
                </div>
              </div>
            )}

            {activeSheet.id === "women-safety" && (
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--crowd-low)", fontSize: 13, lineHeight: 1.5 }}>
                <strong style={{ color: "var(--crowd-low)" }}>Pink Pass Free Travel:</strong> Women travel 100% free across all DTC and Cluster buses in Delhi. Single-journey pink tickets are issued by the conductor onboard. Every bus has an assigned Home Guard / Civil Defence Marshal.
              </div>
            )}

            <button
              onClick={() => setActiveSheet(null)}
              className="btn-pill-primary"
              style={{
                height: 44,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                width: "100%",
                cursor: "pointer",
                marginTop: 8
              }}
            >
              Understood
            </button>
          </div>
        </Sheet>
      )}

      {/* Floating Pill Bottom Navigation */}
      <BottomNav
        activeTab="services"
        onSelectTab={(tab) => {
          if (tab === "home") router.push("/");
          else if (tab === "activity") router.push("/activity");
          else if (tab === "account") router.push("/account");
        }}
        lang={lang}
      />
    </div>
  );
}
