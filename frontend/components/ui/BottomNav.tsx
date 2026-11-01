"use client";

import { motion } from "motion/react";
import { Clock, Compass, Home, User } from "lucide-react";

export type NavTab = "home" | "services" | "activity" | "account";

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang?: "en" | "hi";
}

export function BottomNav({ activeTab, onSelectTab, lang = "en" }: BottomNavProps) {
  const items = [
    { id: "home" as const, label: lang === "hi" ? "होम" : "Home", icon: Home },
    { id: "services" as const, label: lang === "hi" ? "सेवाएं" : "Services", icon: Compass },
    { id: "activity" as const, label: lang === "hi" ? "गतिविधि" : "Activity", icon: Clock },
    { id: "account" as const, label: lang === "hi" ? "खाता" : "Account", icon: User },
  ];

  return (
    <>
      {/* 28px Bottom Scroll Fade Feather Layer (Step 5 specs) */}
      <div
        className="scroll-fade-bottom"
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "calc(var(--nav-h) + 16px + env(safe-area-inset-bottom, 16px))",
          left: 0,
          right: 0,
          height: 28,
          pointerEvents: "none",
          zIndex: 35,
          background: "linear-gradient(to top, var(--paper) 0%, transparent 100%)",
          WebkitBackdropFilter: "blur(4px)",
          backdropFilter: "blur(4px)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      />
      <nav className="floating-bottom-nav" aria-label="Main App Navigation">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`nav-item-btn ${isActive ? "active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="navActiveBg"
                className="nav-active-bg"
                transition={{ duration: 0.3, bounce: 0 }}
              />
            )}
            <item.icon size={24} className="nav-item-icon" aria-hidden="true" />
            <span className="nav-item-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
    </>
  );
}
