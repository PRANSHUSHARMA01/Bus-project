"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title, children, icon }: SheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-modal-title"
      onClick={onClose}
    >
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon}
            <h2 id="sheet-modal-title" className="text-title" style={{ fontSize: 18, margin: 0 }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "grid",
              placeItems: "center",
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
