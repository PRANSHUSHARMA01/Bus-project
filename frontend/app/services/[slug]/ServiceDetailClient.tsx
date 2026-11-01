"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceItem } from "@/lib/services";
import { getServiceIllustration } from "@/components/illustrations/ServiceIllustrations";
import { BottomNav } from "@/components/ui/BottomNav";
import { PillButton } from "@/components/ui/PillButton";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Clock,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  Bus,
  Search,
  MapPin,
  ChevronRight,
  ExternalLink,
  Users,
  Copy
} from "lucide-react";

interface Props {
  service: ServiceItem;
}

export default function ServiceDetailClient({ service }: Props) {
  const router = useRouter();
  const [complaintSubmitted, setComplaintSubmitted] = useState<string | null>(null);
  const [complaintCategory, setComplaintCategory] = useState("Overcharging");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [routeQuery, setRouteQuery] = useState("");

  const isSafety = service.category === "safety" || service.slug.includes("safety");

  const handleFileComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `DTC-${Math.floor(100000 + Math.random() * 900000)}`;
    setComplaintSubmitted(ticketId);
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
        {/* Top Header with Back button returning to /services */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <button
            onClick={() => router.push("/services")}
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
            aria-label="Back to Services"
          >
            <ArrowLeft size={18} />
          </button>

          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "+0.05em",
              color: "var(--text-muted)",
            }}
          >
            Transit Directory
          </span>

          <div style={{ width: 40 }} />
        </div>

        {/* Hero Illustration Card */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: 24,
            overflow: "hidden",
            position: "relative",
            background: "var(--surface-2)",
            boxShadow: "var(--ring)",
          }}
        >
          {getServiceIllustration(service.id)}
          {service.badge && (
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                height: 24,
                padding: "0 10px",
                borderRadius: 999,
                background: service.badge === "SOS" ? "oklch(0.55 0.24 27)" : "var(--primary)",
                color: "#ffffff",
                boxShadow: "0 0 0 2px var(--paper), 0 2px 6px rgba(0,0,0,0.2)",
                fontSize: 11,
                lineHeight: "24px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "+0.05em",
              }}
            >
              {service.badge}
            </span>
          )}
        </div>

        {/* Title & One-line Subtitle */}
        <div>
          <h1 className="text-display" style={{ margin: "0 0 4px 0", fontSize: "1.75rem" }}>
            {service.title}
          </h1>
          <p className="text-body" style={{ color: "var(--text-muted)", margin: 0 }}>
            {service.subtitle} · Official DTC & Delhi Transport Information
          </p>
        </div>

        {/* Content Block 1: Structured Specifications Table */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 20,
            padding: "16px",
            boxShadow: "var(--ring)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 className="text-heading" style={{ margin: 0, fontSize: "1rem" }}>
            Service Specifications
          </h2>
          <p className="text-body" style={{ color: "var(--text)", margin: 0, fontSize: "0.9375rem" }}>
            {service.details.summary}
          </p>

          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "var(--r-tile)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 4,
            }}
          >
            {service.details.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.875rem",
                  borderBottom: idx < service.details.items.length - 1 ? "1px solid var(--border)" : "none",
                  paddingBottom: idx < service.details.items.length - 1 ? 8 : 0,
                }}
              >
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{item.label}</span>
                <span className="tabular-nums" style={{ fontWeight: 600, color: "var(--text)", textAlign: "right" }}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Block 2: Interactive Service Specific Experience */}
        {service.slug === "find-a-bus" && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "16px",
              boxShadow: "var(--ring)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h2 className="text-heading" style={{ margin: 0, fontSize: "1rem" }}>
              Active Corridors & Stop Timelines
            </h2>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search route (e.g. 502, 427, 102)..."
                value={routeQuery}
                onChange={(e) => setRouteQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: "var(--r-tile)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  padding: "0 14px 0 40px",
                  fontSize: "0.9375rem",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <Search size={18} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {[
                { no: "502", from: "Mehrauli Terminal", to: "Old Delhi Railway Station", freq: "Every 8 min", first: "05:15", last: "23:00" },
                { no: "427", from: "Nizamuddin Railway Station", to: "Mehrauli Terminal", freq: "Every 12 min", first: "05:40", last: "22:45" },
                { no: "102", from: "Rohini Sector 22", to: "ISBT Kashmere Gate", freq: "Every 10 min", first: "05:00", last: "23:15" },
                { no: "TMS (+)", from: "Lajpat Nagar Ring Road", to: "Ring Road Express", freq: "Every 6 min", first: "05:30", last: "23:30" }
              ]
                .filter((r) => !routeQuery || r.no.includes(routeQuery) || r.from.toLowerCase().includes(routeQuery.toLowerCase()))
                .map((r) => (
                  <div
                    key={r.no}
                    style={{
                      padding: 12,
                      borderRadius: "var(--r-tile)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>Route {r.no}</span>
                        <span style={{ fontSize: "0.75rem", padding: "1px 6px", borderRadius: 4, background: "var(--surface)", color: "oklch(0.50 0.18 150)", fontWeight: 600 }}>{r.freq}</span>
                      </div>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>{r.from} ➔ {r.to}</p>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Service span: {r.first} – {r.last}</span>
                    </div>
                    <PillButton size="sm" variant="secondary" onClick={() => router.push("/")}>
                      Track
                    </PillButton>
                  </div>
                ))}
            </div>
          </div>
        )}

        {service.slug === "fares-passes" && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "16px",
              boxShadow: "var(--ring)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h2 className="text-heading" style={{ margin: 0, fontSize: "1rem" }}>
              Delhi Transit Fare Slabs (DTC & Cluster)
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-2)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Standard Non-AC</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.25rem", fontWeight: 800 }}>₹5 – ₹15</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>₹5 (up to 4km), ₹10 (up to 10km), ₹15 (10km+)</p>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-2)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Low-Floor AC</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.25rem", fontWeight: 800 }}>₹10 – ₹25</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>₹10 (0-4km), ₹15 (4-8km), ₹20 (8-12km), ₹25 (12km+)</p>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 12, background: "oklch(0.62 0.24 355 / 0.1)", border: "1px solid oklch(0.62 0.24 355 / 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 800, color: "oklch(0.55 0.24 355)" }}>Pink Pass Scheme</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "oklch(0.62 0.24 355)", color: "#fff", padding: "1px 6px", borderRadius: 999 }}>100% FREE</span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--text)" }}>
                Free single-journey travel for all women commuters across all DTC and DIMTS Cluster buses. Obtain physical pink ticket from the bus conductor on boarding.
              </p>
            </div>
          </div>
        )}

        {service.slug === "report-problem" && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "16px",
              boxShadow: "var(--ring)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h2 className="text-heading" style={{ margin: 0, fontSize: "1rem" }}>
              Lodge a Transit Grievance
            </h2>

            {complaintSubmitted ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={40} style={{ color: "oklch(0.50 0.18 150)", margin: "0 auto 10px" }} />
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.125rem" }}>Grievance Registered Successfully</h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Your official DTC ticket ID is:
                </p>
                <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: 8, background: "var(--surface-2)", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "+0.05em" }}>
                  {complaintSubmitted}
                </div>
                <p style={{ margin: "12px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Resolution turnaround is typically 48 hours. Updates will be sent via SMS.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFileComplaint} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Complaint Category</label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: "var(--r-tile)",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      padding: "0 12px",
                      color: "var(--text)",
                    }}
                  >
                    <option>Conductor Overcharging</option>
                    <option>Bus Skipped Designated Stop</option>
                    <option>AC / Cooling Breakdown</option>
                    <option>Rash Driving / Safety Hazard</option>
                    <option>Lost Property on Fleet</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Bus Registration / Route No.</label>
                  <input
                    type="text"
                    placeholder="e.g. DL 1PC 1409 or Route 502"
                    required
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: "var(--r-tile)",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      padding: "0 12px",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <PillButton type="submit" variant="primary" size="lg" style={{ width: "100%", marginTop: 4 }}>
                  Generate Tracking Ticket
                </PillButton>
              </form>
            )}
          </div>
        )}

        {service.slug === "feedback" && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "16px",
              boxShadow: "var(--ring)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h2 className="text-heading" style={{ margin: 0, fontSize: "1rem" }}>
              Commuter Experience Rating
            </h2>
            {feedbackSent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={40} style={{ color: "oklch(0.50 0.18 150)", margin: "0 auto 10px" }} />
                <h3 style={{ margin: "0 0 4px 0" }}>Thank you for your feedback!</h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Your rating helps the Delhi Transport Department improve bus comfort and frequency.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  How was the comfort and punctuality of your recent commute?
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "10px 0" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "2rem",
                        cursor: "pointer",
                        color: star <= feedbackRating ? "oklch(0.80 0.17 75)" : "var(--border)",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <PillButton variant="primary" size="lg" onClick={() => setFeedbackSent(true)}>
                  Submit Rating
                </PillButton>
              </div>
            )}
          </div>
        )}

        {/* Emergency Dialing Shortcut for Helpline Services */}
        {service.slug === "emergency-helplines" && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: "16px",
              boxShadow: "var(--ring)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <h2 className="text-heading" style={{ margin: 0, fontSize: "1rem" }}>
              One-Tap Emergency Dispatch
            </h2>
            {[
              { name: "Delhi Police & PCR", no: "112", desc: "Centralized Emergency Hotline", color: "oklch(0.58 0.23 27)" },
              { name: "Women's Distress Helpline", no: "1091", desc: "Delhi Police Special Unit", color: "oklch(0.55 0.24 355)" },
              { name: "DTC Central Lost & Found", no: "011-23370210", desc: "Scindia House HQ", color: "oklch(0.55 0.22 262)" },
              { name: "Ambulance / Medical", no: "102", desc: "Government Ambulance Fleet", color: "oklch(0.70 0.18 150)" }
            ].map((e) => (
              <a
                key={e.no}
                href={`tel:${e.no}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem", display: "block" }}>{e.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{e.desc}</span>
                </div>
                <span style={{ fontWeight: 800, color: e.color, fontSize: "1.125rem" }}>📞 {e.no}</span>
              </a>
            ))}
          </div>
        )}

        {/* Action Button at bottom */}
        <PillButton
          variant={isSafety ? "danger" : "primary"}
          size="lg"
          onClick={() => {
            if (service.slug === "safety-sos") router.push("/safety");
            else router.push("/");
          }}
          style={{ width: "100%", marginTop: 8 }}
        >
          {service.details.actionLabel || "Explore Service"}
        </PillButton>
      </div>

      <BottomNav
        activeTab="services"
        onSelectTab={(tab) => router.push(tab === "home" ? "/" : `/${tab}`)}
      />
    </div>
  );
}
