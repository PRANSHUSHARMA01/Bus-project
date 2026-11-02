"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // If there is any auth redirect hash or code, process it client-side
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("smart_bus_token", token);
    }
    const next = params.get("next") || "/";
    router.replace(next);
  }, [router]);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--surface)" }}>
      <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
        <p style={{ fontWeight: 600, color: "var(--text)" }}>Completing authentication...</p>
      </div>
    </div>
  );
}
