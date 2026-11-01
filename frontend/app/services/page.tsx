"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { STATIC_SERVICES, ServiceItem } from "@/lib/services";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { FaresIllustration } from "@/components/illustrations/ServiceIllustrations";
import {
  Search,
  ArrowLeft,
  X,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const lang = user?.language || "en";

  const [searchQuery, setSearchQuery] = useState("");

  // Live filtering by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return STATIC_SERVICES;
    const q = searchQuery.toLowerCase().trim();
    return STATIC_SERVICES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.title_hi.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.subtitle_hi.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCardClick = (service: ServiceItem) => {
    router.push(`/services/${service.slug}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "16px 16px calc(var(--nav-h) + 24px + env(safe-area-inset-bottom, 16px))",
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
          gap: 16,
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/")}
              className="btn-press"
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--r-tile)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-title" style={{ margin: 0, fontSize: "1.375rem" }}>
                {lang === "hi" ? "पारगमन सेवाएं" : "Transit Services"}
              </h1>
              <p className="text-caption" style={{ color: "var(--text-muted)", margin: 0 }}>
                {lang === "hi" ? "आधिकारिक निर्देशिका · डीटीसी और दिल्ली सरकार" : "Directory · DTC & Delhi Transport Dept"}
              </p>
            </div>
          </div>
        </div>

        {/* 1. Top Search Field (Filters live) */}
        <div style={{ position: "relative", width: "100%" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "hi" ? "सेवाएं खोजें (उदा. बस, किराया, पास, सुरक्षा)..." : "Search services (e.g. bus, fares, pass, SOS)..."}
            style={{
              width: "100%",
              height: 48,
              borderRadius: "var(--r-card)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
              padding: "0 40px 0 42px",
              fontSize: "0.9375rem",
              color: "var(--text)",
              outline: "none",
            }}
            aria-label="Search transit services"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 2. Black Full-Width Promo Banner for Fares & Passes (Step 3 specs) */}
        {!searchQuery && (
          <div
            onClick={() => router.push("/services/fares-passes")}
            className="btn-press"
            style={{
              width: "100%",
              borderRadius: 20,
              background: "#000000",
              color: "#ffffff",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              position: "relative",
              overflow: "hidden",
            }}
            role="button"
            tabIndex={0}
            aria-label="Fares & Passes: Free bus travel for women commuters and DTC slabs"
          >
            {/* Left 58% Content */}
            <div style={{ width: "58%", zIndex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "+0.08em",
                  color: "oklch(0.80 0.17 75)",
                }}
              >
                DTC SCHEME · FREE PASS
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: "#ffffff",
                }}
              >
                {lang === "hi" ? "महिला यात्रियों के लिए मुफ्त सफर" : "Fares, passes & free travel"}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.3,
                }}
              >
                {lang === "hi" ? "पिंक पास योजना व डीटीसी किराया स्लैब" : "Pink pass scheme & standard DTC slabs"}
              </p>

              {/* 44px White Pill CTA */}
              <div
                style={{
                  marginTop: 6,
                  height: 38,
                  padding: "0 18px",
                  borderRadius: 999,
                  background: "#ffffff",
                  color: "#000000",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  width: "fit-content",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                <span>{lang === "hi" ? "किराया देखें" : "See fares"}</span>
                <ChevronRight size={14} strokeWidth={2.5} />
              </div>
            </div>

            {/* Right 42% Artwork */}
            <div
              style={{
                width: "40%",
                aspectRatio: "4/3",
                borderRadius: 14,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <FaresIllustration />
            </div>
          </div>
        )}

        {/* 3. Section Title "All services" + Count Chip "13" */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginInline: 4, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-heading" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)" }}>
              {lang === "hi" ? "सभी सेवाएं" : "All services"}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--surface-2)",
                color: "var(--text-muted)",
              }}
            >
              {filteredServices.length}
            </span>
          </div>
          <span className="text-caption" style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            Tap any card to open
          </span>
        </div>

        {/* 4. Large Illustrated Cards in 2-Column Grid (All 13 cards fully functional) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
          data-testid="services-grid"
        >
          {filteredServices.map((service, idx) => (
            <ServiceCard
              key={service.id}
              service={service}
              lang={lang}
              onClick={handleCardClick}
              staggerIndex={idx}
            />
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 16px",
              background: "var(--surface)",
              borderRadius: "var(--r-card)",
              boxShadow: "var(--ring-subtle)",
            }}
          >
            <p className="text-body" style={{ margin: "0 0 6px", fontWeight: 600 }}>
              {lang === "hi" ? "कोई सेवा नहीं मिली" : "No services found"}
            </p>
            <p className="text-caption" style={{ color: "var(--text-muted)", margin: 0 }}>
              {lang === "hi" ? "कृपया अलग खोज शब्द आज़माएं।" : "Try searching for bus routes, fares or emergency helplines."}
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab="services"
        onSelectTab={(tab) => router.push(tab === "home" ? "/" : `/${tab}`)}
        lang={lang as "en" | "hi"}
      />
    </div>
  );
}
