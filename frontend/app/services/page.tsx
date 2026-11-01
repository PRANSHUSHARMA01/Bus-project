"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { STATIC_SERVICES, ServiceItem } from "@/lib/services";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { Sheet } from "@/components/ui/Sheet";
import { BottomNav } from "@/components/ui/BottomNav";
import { PillButton } from "@/components/ui/PillButton";
import {
  Search,
  ArrowLeft,
  X,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Bus
} from "lucide-react";

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const lang = user?.language || "en";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>(["find_bus", "fares_passes", "safety_sos", "night_buses"]);

  // Filter services by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return STATIC_SERVICES;
    const q = searchQuery.toLowerCase().trim();
    return STATIC_SERVICES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.title_hi.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.description_hi.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCardClick = (service: ServiceItem) => {
    // Add to recently used
    setRecentIds((prev) => [service.id, ...prev.filter((id) => id !== service.id)].slice(0, 5));

    // Open detailed sheet with full specifications & working action button
    setSelectedService(service);
  };

  const handleRecentClick = (id: string) => {
    const s = STATIC_SERVICES.find((item) => item.id === id);
    if (s) handleCardClick(s);
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

        {/* 1. Top Search Field (Search services) */}
        <div style={{ position: "relative", width: "100%" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "hi" ? "सेवाएं खोजें (बस, पास, 112, टाइमटेबल)..." : "Search services (Bus, Passes, 112, Schedule)..."}
            style={{
              width: "100%",
              height: 48,
              borderRadius: "var(--r-pill)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring-subtle)",
              padding: "0 40px 0 42px",
              fontSize: "0.9375rem",
              color: "var(--text)",
              outline: "none",
            }}
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

        {/* 2. Recently Used Quick Row */}
        {!searchQuery && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              className="text-caption"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "+0.05em",
                marginInlineStart: 4,
              }}
            >
              {lang === "hi" ? "हाल ही में उपयोग किए गए" : "Recently used"}
            </span>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {recentIds.map((id) => {
                const s = STATIC_SERVICES.find((item) => item.id === id);
                if (!s) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleRecentClick(id)}
                    className="btn-press"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: "var(--r-pill)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--ring-subtle)",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <span>{lang === "hi" ? s.title_hi : s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Two-Column Grid of ServiceCards (>= 9 visible cards!) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginInline: 4 }}>
            <span className="text-heading" style={{ fontSize: "1rem" }}>
              {lang === "hi" ? "सभी सेवाएं" : "All Services"}
            </span>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>
              {filteredServices.length} {lang === "hi" ? "उपलब्ध" : "available"}
            </span>
          </div>

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
      </div>

      {/* 4. Interactive Detail Sheet for each Service (No Dead Links!) */}
      {selectedService && (
        <Sheet
          isOpen={true}
          onClose={() => setSelectedService(null)}
          title={lang === "hi" ? selectedService.title_hi : selectedService.title}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 16 }}>
            {selectedService.badge && (
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "var(--r-chip)",
                  background: "var(--surface-2)",
                  color: "var(--accent)",
                }}
              >
                {selectedService.badge}
              </span>
            )}

            <p className="text-body" style={{ margin: 0, color: "var(--text)" }}>
              {lang === "hi"
                ? selectedService.details?.summary_hi || selectedService.description_hi
                : selectedService.details?.summary || selectedService.description}
            </p>

            {/* Structured Specifications Table */}
            {selectedService.details?.items && selectedService.details.items.length > 0 && (
              <div
                style={{
                  background: "var(--surface-2)",
                  borderRadius: "var(--r-tile)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {selectedService.details.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.875rem",
                      borderBottom:
                        i < (selectedService.details?.items.length || 0) - 1 ? "1px solid var(--border)" : "none",
                      paddingBottom: i < (selectedService.details?.items.length || 0) - 1 ? 8 : 0,
                    }}
                  >
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                      {lang === "hi" ? item.label_hi : item.label}
                    </span>
                    <span className="tabular-nums" style={{ fontWeight: 600, color: "var(--text)", textAlign: "right" }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Button */}
            {selectedService.details?.actionLabel && (
              <PillButton
                variant={selectedService.category === "safety" ? "danger" : "primary"}
                size="lg"
                onClick={() => {
                  const target = selectedService.details?.actionLink || selectedService.link || "/";
                  if (target.startsWith("tel:")) {
                    window.location.href = target;
                  } else {
                    setSelectedService(null);
                    router.push(target);
                  }
                }}
                style={{ width: "100%", marginTop: 8 }}
              >
                {lang === "hi" ? selectedService.details.actionLabel_hi : selectedService.details.actionLabel}
              </PillButton>
            )}
          </div>
        </Sheet>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab="services"
        onSelectTab={(tab) => router.push(tab === "home" ? "/" : `/${tab}`)}
        lang={lang as "en" | "hi"}
      />
    </div>
  );
}
