"use client";

import { motion } from "motion/react";
import { Bus as BusIcon, Compass, Train } from "lucide-react";

export type ModeTab = "bus" | "metro" | "intercity";

interface ModeTabsProps {
  activeTab: ModeTab;
  onSelectTab: (tab: ModeTab) => void;
  lang?: "en" | "hi";
}

export function ModeTabs({ activeTab, onSelectTab, lang = "en" }: ModeTabsProps) {
  const tabs = [
    { id: "bus" as const, label: lang === "hi" ? "बस" : "Bus", icon: BusIcon },
    { id: "metro" as const, label: lang === "hi" ? "मेट्रो" : "Metro", icon: Train, badge: "Soon" },
    { id: "intercity" as const, label: lang === "hi" ? "इंटरसिटी" : "Intercity", icon: Compass, badge: "Soon" },
  ];

  return (
    <nav className="mode-tabs-bar" aria-label="Transit modes">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`mode-tab-item ${isActive ? "active" : ""}`}
            role="tab"
            aria-selected={isActive}
          >
            <tab.icon size={17} aria-hidden="true" />
            <span>{tab.label}</span>
            {tab.badge && <span className="badge-soon">{tab.badge}</span>}
            {isActive && (
              <motion.div
                layoutId="modeTabUnderline"
                className="mode-tab-underline"
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
