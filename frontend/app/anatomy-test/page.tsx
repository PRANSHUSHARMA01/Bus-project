"use client";

import React, { useEffect, useState } from "react";
import { MovingBus } from "@/components/anatomy/MovingBus";

export default function AnatomyTestPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const th = params.get("theme");
    if (th === "dark" || th === "light") {
      setTheme(th);
      document.documentElement.setAttribute("data-theme", th);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "16px",
        background: theme === "dark" ? "oklch(0.14 0 0)" : "oklch(0.98 0 0)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }} id="bus-harness">
        <MovingBus />
      </div>
    </div>
  );
}
