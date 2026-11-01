import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "80px auto",
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
        <Compass size={24} style={{ color: "var(--text)" }} />
      </div>
      <h1 className="text-title" style={{ fontSize: 22, marginBottom: 8 }}>
        Route or stop not found
      </h1>
      <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        The corridor or terminal you are looking for is not currently in the Delhi Transit system.
      </p>
      <Link
        href="/"
        className="btn-pill-primary"
        style={{ textDecoration: "none", display: "inline-flex" }}
      >
        <ArrowLeft size={16} />
        <span>Return to home</span>
      </Link>
    </div>
  );
}
