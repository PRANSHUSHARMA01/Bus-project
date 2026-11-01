import Link from "next/link";
import { ArrowLeft, Compass, MapPin } from "lucide-react";
import { NotFoundBusIllustration } from "@/components/illustrations/TransitIllustrations";

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 540,
        margin: "40px auto 80px",
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      {/* Original 404 Vector Transit Illustration */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <NotFoundBusIllustration width={300} height={205} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent-red, #DC2626)",
            background: "rgba(220, 38, 38, 0.08)",
            padding: "4px 12px",
            borderRadius: 999,
          }}
        >
          Corridor Deviation · 404
        </span>
      </div>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--text)",
          margin: "0 0 6px",
        }}
      >
        Route 404: Stop Not Found
      </h1>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-muted)",
          margin: "0 0 16px",
        }}
      >
        बस स्टॉप या रूट नहीं मिला
      </h2>

      <p
        style={{
          color: "var(--text-muted)",
          fontSize: 14,
          lineHeight: 1.6,
          maxWidth: 420,
          margin: "0 auto 28px",
        }}
      >
        The transit corridor, terminal, or page you are looking for is currently off-grid or not served by Delhi Transport Corporation.
      </p>

      {/* Quick Corridor Suggestions */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "16px 20px",
          textAlign: "left",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-dim)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Compass size={14} />
          <span>Active Delhi High-Frequency Corridors</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link
            href="/?route=102"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface-2)",
              textDecoration: "none",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>Route 102 · Rohini Sector 22 ⇄ Mori Gate</span>
            <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Every 4m</span>
          </Link>
          <Link
            href="/?route=502"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface-2)",
              textDecoration: "none",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>Route 502 · Mehrauli ⇄ Kashmere Gate</span>
            <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Every 5m</span>
          </Link>
          <Link
            href="/?route=764"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface-2)",
              textDecoration: "none",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>Route 764 · Najafgarh Terminal ⇄ Nehru Place</span>
            <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Every 6m</span>
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link
          href="/"
          className="btn-pill-primary"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Live Transit Map</span>
        </Link>
      </div>
    </div>
  );
}
