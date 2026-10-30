"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "🗺️ Passenger View" },
    { href: "/conductor", label: "🚌 Conductor" },
    { href: "/admin", label: "📊 Admin" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#334155] px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            D
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Delhi Smart Transit
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-[11px] text-[#94a3b8] leading-none">
              Fleet Tracking & Management
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link flex items-center gap-1.5 ${
                  isActive ? "active font-semibold text-white" : ""
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live system pill */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#94a3b8] bg-[#1e293b] px-3 py-1.5 rounded-full border border-[#334155]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>System Live</span>
          <span className="text-[#64748b]">•</span>
          <span className="text-[#cbd5e1] font-mono">127.0.0.1:8000</span>
        </div>
      </div>
    </header>
  );
}
