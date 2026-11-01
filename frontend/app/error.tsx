"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "60px auto",
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--surface-2)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 16px",
        }}
      >
        <AlertTriangle size={24} style={{ color: "var(--accent-red)" }} />
      </div>
      <h2 className="text-title" style={{ fontSize: 20, marginBottom: 8 }}>
        Can't reach the bus feed
      </h2>
      <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Check your connection or try again. The telemetry stream may be reconnecting.
      </p>
      <button
        onClick={() => reset()}
        className="btn-pill-primary"
        style={{ minHeight: 44, padding: "0 22px", fontSize: 14 }}
      >
        <RefreshCw size={16} />
        <span>Try again</span>
      </button>
    </div>
  );
}
