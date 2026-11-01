"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  undoAction?: () => void;
  undoLabel?: string;
}

export function Toast({
  message,
  onDismiss,
  undoAction,
  undoLabel = "Undo",
}: ToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!message) return;

    if (!isPaused) {
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, 5000); // 5s auto-dismiss
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, isPaused, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="app-toast"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <CheckCircle2
        size={20}
        strokeWidth={1.75}
        className="app-toast-icon"
        aria-hidden="true"
      />
      <span className="app-toast-text">{message}</span>
      {undoAction && (
        <button
          onClick={undoAction}
          className="app-toast-undo"
          aria-label={undoLabel}
        >
          {undoLabel}
        </button>
      )}
    </div>
  );
}
