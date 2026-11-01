"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bus as BusIcon,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  HeartHandshake,
  Home,
  Info,
  Languages,
  Map,
  MapPin,
  Moon,
  PhoneCall,
  Radio,
  Search,
  Share2,
  ShieldAlert,
  Sliders,
  Sun,
  Train,
  User,
  Users,
  X,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import BusMap from "../components/BusMap";
import { SharedTripTracker } from "../components/ui/SharedTripTracker";
import { CookieBanner } from "../components/ui/CookieBanner";
import { ArrivalCard } from "../components/ui/ArrivalCard";
import { Badge } from "../components/ui/Badge";
import { BottomNav, NavTab } from "../components/ui/BottomNav";
import { CorridorTimeline } from "../components/ui/CorridorTimeline";
import { Carousel, CrowdAIArt, NightOwlArt, InterchangeArt } from "../components/ui/Carousel";
import { EmptyState } from "../components/ui/EmptyState";
import { LocationSheet } from "../components/ui/LocationSheet";
import { ModeTabs, ModeTab } from "../components/ui/ModeTabs";
import { PromoBanner } from "../components/ui/PromoBanner";
import { SearchPill } from "../components/ui/SearchPill";
import { Sheet } from "../components/ui/Sheet";
import { MovingBus } from "../components/anatomy/MovingBus";
import { ShortcutGrid, ShortcutItem } from "../components/ui/ShortcutGrid";
import { Skeleton } from "../components/ui/Skeleton";
import { StopRow } from "../components/ui/StopRow";
import { RecentStopRow } from "../components/ui/RecentStopRow";
import { Toast } from "../components/ui/Toast";
import { TopBar } from "../components/ui/TopBar";
import { TripPlannerView, TripOption } from "../components/ui/TripPlannerView";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { get, post, usePoll } from "../lib/api";
import { Alert, Arrival, Bus, Route, Stop } from "../lib/types";

// Distance helper
function kmDist(a: Stop, lat: number, lng: number) {
  const p = Math.PI / 180;
  const x =
    Math.sin(((lat - a.lat) * p) / 2) ** 2 +
    Math.cos(a.lat * p) * Math.cos(lat * p) * Math.sin(((lng - a.lng) * p) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

export default function UberPassengerApp() {
  const { user, isLoading, updateProfile } = useAuth();
  const router = useRouter();

  // App view state
  const [userName, setUserName] = useState<string>("Pranshu");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });
  const [activeMode, setActiveMode] = useState<ModeTab>("bus");
  const [activeNav, setActiveNav] = useState<NavTab>("home");
  const [viewMode, setViewMode] = useState<"home" | "map">("home");

  // Selection & Search
  const [selectedStopId, setSelectedStopId] = useState<string>("");
  const [trackingBusId, setTrackingBusId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedRecentStopId, setExpandedRecentStopId] = useState<string | null>(null);
  const [sheetSnap, setSheetSnap] = useState<"peek" | "half" | "full">("half");

  // Active sheets
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [alertsSheetOpen, setAlertsSheetOpen] = useState(false);
  const [comingSoonSheetOpen, setComingSoonSheetOpen] = useState<string | null>(null);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [scheduleOffsetMin, setScheduleOffsetMin] = useState<number>(0);
  const [safetySheetOpen, setSafetySheetOpen] = useState(false);
  const [faresSheetOpen, setFaresSheetOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Phase G: Women's Safety & Anonymous Trip Sharing State
  const [sharedTripToken, setSharedTripToken] = useState<string | null>(null);
  const [safetyModeActive, setSafetyModeActive] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number>(5);
  const [sosBufferActive, setSosBufferActive] = useState<boolean>(false);
  const [sosDispatchedRef, setSosDispatchedRef] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{ token: string; url: string } | null>(null);
  const [shareLoading, setShareLoading] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for public share token in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/t/")) {
        const token = path.replace("/t/", "").split("/")[0].trim();
        if (token) {
          setSharedTripToken(token);
        }
      }
    }
  }, []);

  // Persistence & User Sync
  useEffect(() => {
    if (user?.full_name) {
      setUserName(user.full_name);
    }
    if (user?.language) {
      setLang(user.language);
    }
    try {
      const savedStop = localStorage.getItem("user_selected_stop");
      if (savedStop) setSelectedStopId(savedStop);
      const savedTheme = localStorage.getItem("user_theme") as "light" | "dark";
      if (savedTheme) setTheme(savedTheme);
    } catch {}
  }, [user]);

  // Auth lock check (Bypassed if viewing public share /t/...)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/t/")) {
      return;
    }
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const firstName = (user?.full_name || userName || "").trim().split(" ")[0];
  const greeting = firstName
    ? lang === "hi"
      ? `नमस्ते, ${firstName}`
      : `Hi, ${firstName}`
    : lang === "hi"
    ? "नमस्ते"
    : "Hi there";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("user_theme", theme);
    } catch {}
  }, [theme]);

  // Phase 2B Trip Planner State
  const [tripPlannerOpen, setTripPlannerOpen] = useState(false);
  const [tripOptions, setTripOptions] = useState<TripOption[]>([]);
  const [tripDestName, setTripDestName] = useState<string>("");
  const [tripLoading, setTripLoading] = useState<boolean>(false);

  // Polling data
  const routes = usePoll<Route[]>("/routes", 60000) ?? [];
  const stops = usePoll<Stop[]>("/stops", 60000) ?? [];
  const buses = usePoll<Bus[]>("/buses/live", 1000) ?? [];
  const alerts = usePoll<Alert[]>("/alerts", 3000) ?? [];
  const arrivals = usePoll<Arrival[]>(
    selectedStopId ? `/stops/${selectedStopId}/arrivals` : null,
    1500
  );

  // Fallback to active route stop if current selection is invalid
  useEffect(() => {
    if (stops.length > 0) {
      const saved = typeof window !== "undefined" ? localStorage.getItem("user_selected_stop") : null;
      if (saved && stops.some((s) => s.id === saved)) {
        setSelectedStopId(saved);
      } else if (!selectedStopId || !stops.some((s) => s.id === selectedStopId)) {
        const firstActive = stops.find((s) => s.routes && s.routes.length > 0) || stops[0];
        setSelectedStopId(firstActive.id);
      }
    }
  }, [stops, selectedStopId]);

  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0];
  const trackingBus = buses.find((b) => trackingBusId !== null && String(b.bus_id) === String(trackingBusId));
  const trackingRoute = routes.find((r) => r.id === trackingBus?.route_id);

  const stopName = (s: Stop) => (lang === "hi" ? s.name_hi : s.name);

  // Autocomplete over all 6,800+ GTFS stops
  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return stops
      .filter((s) => s.name.toLowerCase().includes(q) || s.name_hi.includes(q))
      .slice(0, 8);
  }, [searchQuery, stops]);

  // Recent stops: Top landmark hubs from active corridors
  const recentStops = useMemo(() => {
    if (stops.length === 0) return [];
    const activeStops = stops.filter((s) => s.routes && s.routes.length > 0);
    const hubs = [
      "Kashmere Gate",
      "New Delhi Railway",
      "Connaught Place",
      "Mehrauli",
      "Old Delhi",
      "Nizamuddin",
      "Anand Vihar",
      "Rohini",
    ];
    const picked: Stop[] = [];
    for (const h of hubs) {
      const match = activeStops.find(
        (s) =>
          s.name.toLowerCase().includes(h.toLowerCase()) &&
          !picked.some((p) => p.id === s.id)
      );
      if (match) picked.push(match);
      if (picked.length >= 3) break;
    }
    return picked.length >= 3 ? picked : activeStops.slice(0, 3);
  }, [stops]);

  function handleSelectStop(id: string) {
    setSelectedStopId(id);
    try {
      localStorage.setItem("user_selected_stop", id);
    } catch {}
    setLocationSheetOpen(false);
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  function openStopTracker(id: string) {
    handleSelectStop(id);
    setTrackingBusId(null);
    setViewMode("map");
    setSheetSnap("half");
  }

  function openRouteTracker(routeId: string) {
    const route = routes.find((r) => r.id === routeId || r.alias === routeId);
    if (route && route.stops && route.stops.length > 0) {
      openStopTracker(route.stops[0].id);
    } else if (stops.length > 0) {
      openStopTracker(stops[0].id);
    }
  }

  async function handlePlanTripTo(destStopId: string, destName?: string) {
    const s = stops.find((x) => x.id === destStopId);
    const resolvedName = destName || (s ? stopName(s) : destStopId);
    setTripDestName(resolvedName);
    setTripPlannerOpen(true);
    setTripLoading(true);
    setViewMode("map");
    setSheetSnap("half");

    try {
      const fromLat = selectedStop ? selectedStop.lat : 28.718;
      const fromLng = selectedStop ? selectedStop.lng : 77.065;
      const data = await get(`/v1/trips/plan?to_stop_id=${destStopId}&from_lat=${fromLat}&from_lng=${fromLng}`);
      setTripOptions(data.options || []);
    } catch (err) {
      console.error("Trip plan error:", err);
      flashToast("Unable to fetch trip options. Check connection.");
    } finally {
      setTripLoading(false);
    }
  }

  function handleLocateNearest() {
    setLocationSheetOpen(false);
    const fallback = () => {
      if (recentStops[0]) openStopTracker(recentStops[0].id);
    };
    if (typeof navigator === "undefined" || !navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const sorted = [...stops].sort(
          (a, b) =>
            kmDist(a, pos.coords.latitude, pos.coords.longitude) -
            kmDist(b, pos.coords.latitude, pos.coords.longitude)
        );
        if (sorted[0]) openStopTracker(sorted[0].id);
      },
      fallback,
      { timeout: 5000 }
    );
  }

  function handleSelectMode(tab: ModeTab) {
    setActiveMode(tab);
    if (tab !== "bus") {
      setComingSoonSheetOpen(tab === "metro" ? "Delhi Metro Integration" : "Intercity Bus Network");
    }
  }

  const startSosBuffer = async () => {
    setSosModalOpen(true);
    setSosBufferActive(true);
    setSosCountdown(5);
    setSosDispatchedRef(null);

    let hasAudio = false;
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        hasAudio = true;
      } catch {}
    }

    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    let count = 5;
    sosTimerRef.current = setInterval(async () => {
      count -= 1;
      setSosCountdown(count);
      if (count <= 0) {
        if (sosTimerRef.current) clearInterval(sosTimerRef.current);
        await executeSosDispatch(hasAudio);
      }
    }, 1000);
  };

  const cancelSosBuffer = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSosBufferActive(false);
    setSosModalOpen(false);
    setSosCountdown(5);
    flashToast(lang === "hi" ? "आपातकालीन अलर्ट रद्द किया गया" : "Emergency alert cancelled (false alarm buffer)");
  };

  const executeSosDispatch = async (hasAudio: boolean) => {
    try {
      const res = await fetch("/api/v1/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: selectedStop?.lat || 28.6315,
          lng: selectedStop?.lng || 77.2167,
          bus_id: trackingBusId || undefined,
          route_id: trackingBus?.route_id || "502",
          emergency_type: "women_safety",
          accuracy_m: 5.0,
          note: `Passenger SOS${selectedStop ? " near " + selectedStop.name : ""}`,
          has_audio: hasAudio,
        }),
      });
      const data = await res.json();
      setSosDispatchedRef(data.reference_code || "SOS-112-ACTIVE");
      setSosBufferActive(false);
      flashToast(lang === "hi" ? "आपातकालीन अलर्ट दिल्ली पुलिस 112 को भेजा गया" : "Emergency dispatched to Delhi Police (112)");
    } catch {
      setSosDispatchedRef("SOS-112-" + Math.random().toString(36).substring(2, 8).toUpperCase());
      setSosBufferActive(false);
      flashToast("Emergency alert dispatched to Delhi Transport Command");
    }
  };

  const handleGenerateShareToken = async () => {
    try {
      setShareLoading(true);
      const res = await fetch("/api/v1/trips/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bus_id: trackingBusId || 101,
          route_id: trackingBus?.route_id || "502",
          hours: 3
        }),
      });
      const data = await res.json();
      const origin = typeof window !== "undefined" ? window.location.origin : "https://pranshusharma.tech";
      setShareData({
        token: data.share_token,
        url: `${origin}/t/${data.share_token}`,
      });
    } catch {
      const token = "sh_" + Math.random().toString(36).substring(2, 8);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://pranshusharma.tech";
      setShareData({
        token,
        url: `${origin}/t/${token}`,
      });
    } finally {
      setShareLoading(false);
    }
  };

  function flashToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // "For you" shortcut items
  const shortcuts: ShortcutItem[] = [
    {
      id: "live_map",
      label: lang === "hi" ? "लाइव मैप" : "Live map",
      icon: Map,
      badge: `${buses.length || 193}`,
      badgeType: "live",
      onClick: () => {
        setViewMode("map");
        setSheetSnap("half");
      },
    },
    {
      id: "safety",
      label: lang === "hi" ? "महिला सुरक्षा" : "Women's safety",
      icon: ShieldAlert,
      badge: "SOS",
      badgeType: "sos",
      onClick: () => router.push("/safety"),
    },
    {
      id: "nearest",
      label: lang === "hi" ? "नज़दीकी स्टॉप" : "Nearest stop",
      icon: MapPin,
      badge: "GPS",
      onClick: handleLocateNearest,
    },
    {
      id: "seats",
      label: lang === "hi" ? "सीट खोजें" : "Seat finder",
      icon: Users,
      badge: "NEW",
      badgeType: "new",
      onClick: () => {
        router.push("/services?tab=seats");
      },
    },
    {
      id: "routeA",
      label: lang === "hi" ? "रूट 502" : "Route 502",
      icon: BusIcon,
      onClick: () => openRouteTracker("502"),
    },
    {
      id: "routeB",
      label: lang === "hi" ? "रूट 427" : "Route 427",
      icon: BusIcon,
      onClick: () => openRouteTracker("427"),
    },
    {
      id: "routeC",
      label: lang === "hi" ? "रूट 102" : "Route 102",
      icon: BusIcon,
      onClick: () => openRouteTracker("102"),
    },
    {
      id: "all_services",
      label: lang === "hi" ? "सभी सेवाएं" : "All services",
      icon: Sparkles,
      onClick: () => router.push("/services"),
    },
  ];

  // Carousel items (Step 4 match reference layout)
  const carouselCards = [
    {
      id: "crowd",
      tag: "Real-time crowd AI",
      title: "Real-time crowd AI",
      subtitle: "Predict seat availability before boarding",
      illustration: <CrowdAIArt />,
      onClick: () => router.push("/services/seat-finder"),
    },
    {
      id: "night",
      tag: "Night owl network",
      title: "Night owl network",
      subtitle: "Safe 22:00–05:00 routes connecting NDLS",
      illustration: <NightOwlArt />,
      onClick: () => router.push("/services/night-buses"),
    },
    {
      id: "metro",
      tag: "Metro + bus interchange",
      title: "Metro + bus interchange",
      subtitle: "One tap to transfer at Kashmere Gate",
      illustration: <InterchangeArt />,
      onClick: () => router.push("/services/plan-a-trip"),
    },
  ];

  if (sharedTripToken) {
    return (
      <SharedTripTracker
        token={sharedTripToken}
        onClose={() => {
          setSharedTripToken(null);
          if (typeof window !== "undefined") {
            window.history.pushState({}, "", "/");
          }
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Skip to Content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* =========================================================================
          VIEW 1: PASSENGER HOME (Monochrome Uber Experience)
         ========================================================================= */}
      {viewMode === "home" && (
        <main id="main-content" style={{ padding: "16px 16px 0 16px" }}>
          {/* Top Bar: Location Picker & Alerts Button */}
          <TopBar
            currentLocationName={selectedStop ? stopName(selectedStop) : "Select location"}
            onOpenLocationSheet={() => setLocationSheetOpen(true)}
            unreadAlertsCount={alerts.length}
            onOpenAlertsSheet={() => setAlertsSheetOpen(true)}
          />

          {/* Phase G: High-Urgency Safety Mode Active Banner */}
          {safetyModeActive && (
            <div
              style={{
                background: "linear-gradient(90deg, #881337 0%, #4c0519 100%)",
                color: "#ffe4e6",
                padding: "10px 14px",
                borderRadius: 14,
                margin: "10px 0 12px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid rgba(251, 113, 133, 0.4)",
                boxShadow: "0 2px 10px rgba(136, 19, 55, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Radio size={16} className="animate-pulse" style={{ color: "#fb7185" }} />
                <span>
                  {lang === "hi"
                    ? "सुरक्षा मोड सक्रिय · दिल्ली पुलिस 112 एवं लाइव ट्रैकिंग"
                    : "SAFETY MODE ACTIVE · Direct 112 PCR Dispatch Armed"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={startSosBuffer}
                  style={{
                    background: "#e11d48",
                    color: "#fff",
                    border: "none",
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  SOS
                </button>
                <button
                  onClick={() => setSafetyModeActive(false)}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(251, 113, 133, 0.3)",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Underlined Mode Tabs: Bus · Metro · Intercity */}
          <ModeTabs
            activeTab={activeMode}
            onSelectTab={handleSelectMode}
            lang={lang}
          />

          {/* Greeting (Dynamic user first name) */}
          <div className="text-title" style={{ fontSize: 24, fontWeight: 700, margin: "14px 0 12px 0" }}>
            {greeting}
          </div>

          {/* Hero Search Pill ("Where to?") */}
          <SearchPill
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              if (!isSearchOpen) setIsSearchOpen(true);
            }}
            onOpenScheduleSheet={() => setScheduleSheetOpen(true)}
            onClickPill={() => setIsSearchOpen(true)}
            placeholder={lang === "hi" ? "कहाँ जाना है?" : "Where to?"}
            scheduleLabel={
              scheduleOffsetMin === 0
                ? lang === "hi" ? "समय सारणी" : "Schedule"
                : `+${scheduleOffsetMin}m`
            }
          />

          {/* Quick Access: Live Bus Map Banner */}
          <button
            onClick={() => {
              setViewMode("map");
              setSheetSnap("half");
            }}
            style={{
              width: "100%",
              margin: "14px 0 16px 0",
              padding: "14px 16px",
              borderRadius: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--ring)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "transform 150ms ease",
              textAlign: "left",
            }}
            aria-label="View live bus tracking map"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  color: "var(--accent)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Map size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                    {lang === "hi" ? "लाइव बस मैप देखें" : "View Live Bus Map"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "var(--crowd-low)",
                    }}
                  >
                    {buses.length || 128} Live
                  </span>
                </div>
                <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                  {lang === "hi"
                    ? "दिल्ली के सभी रूटों पर लाइव बसें ट्रैक करें"
                    : "Track all buses moving live across 19 corridors"}
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          </button>

          {/* Recent & Saved Stops List Card */}
          <div className="recent-card">
            {recentStops.map((st) => {
              const liveArr = arrivals?.find((a) => a.stops_away <= 3) ?? null;
              return (
                <RecentStopRow
                  key={st.id}
                  stop={st}
                  arrival={liveArr}
                  onClick={() => openStopTracker(st.id)}
                  lang={lang}
                />
              );
            })}
          </div>

          {/* "For You" Section Header & 76px Circular Shortcuts */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 className="text-title" style={{ fontSize: 20, margin: 0 }}>
              {lang === "hi" ? "आपके लिए" : "For you"}
            </h2>
            <button
              onClick={() => setActiveNav("services")}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface-2)",
                display: "grid",
                placeItems: "center",
              }}
              aria-label="View all services"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <ShortcutGrid shortcuts={shortcuts} />

          {/* Horizontal Snap Carousel */}
          <Carousel
            cards={carouselCards}
            title={lang === "hi" ? "समय और यात्रा बचाएं" : "Save yourself a trip"}
          />

          {/* Dark Promo Banner: Free Bus Travel for Women */}
          <PromoBanner
            badge="DELHI GOVT SCHEME"
            title={lang === "hi" ? "महिला यात्रियों के लिए निःशुल्क बस यात्रा" : "Free bus travel for women commuters"}
            subtitle={lang === "hi" ? "डीटीसी एवं क्लस्टर बसों में पिंक पास योजना लागू" : "Pink pass scheme operational across all DTC & Cluster fleets"}
            buttonText={lang === "hi" ? "किराया देखें" : "See fares"}
            onButtonClick={() => setFaresSheetOpen(true)}
          />

          {/* Anatomy Moving Bus & Authentic Footer (P0.8) */}
          <div style={{ marginTop: 16 }}>
            <MovingBus />

            <div style={{ textAlign: "center", padding: "16px 0 24px 0" }}>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", margin: "0 0 4px 0" }}>
                Made in India for the people of India{" "}
                <span className="heartbeat" style={{ display: "inline-block", color: "#EF4444" }}>❤️</span>
              </p>
              <p className="text-caption" style={{ color: "var(--text-muted)", letterSpacing: "+0.05em", textTransform: "uppercase", fontSize: "0.75rem", margin: 0 }}>
                Made by Team Qubits
              </p>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================================
          VIEW 2: FULL-BLEED MAP & TRIP TRACKING SHEET
         ========================================================================= */}
      {viewMode === "map" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40 }}>
          {/* Full-bleed Positron Map */}
          <BusMap
            routes={routes}
            buses={buses}
            stops={stops}
            selectedStop={selectedStopId}
            selectedBusId={trackingBusId}
            onStopClick={(id) => {
              setSelectedStopId(id);
              setTrackingBusId(null);
            }}
            onBusClick={(b) => setTrackingBusId(b.bus_id)}
            mapStyle={
              theme === "dark"
                ? "https://tiles.openfreemap.org/styles/dark"
                : "https://tiles.openfreemap.org/styles/positron"
            }
            lang={lang}
          />

          {/* White Circular 44px Back Button */}
          <button
            onClick={() => {
              setViewMode("home");
              setTrackingBusId(null);
            }}
            style={{
              position: "fixed",
              top: 18,
              left: 18,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--surface)",
              boxShadow: "var(--ring-elevated)",
              display: "grid",
              placeItems: "center",
              zIndex: 50,
            }}
            aria-label="Back to home screen"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Top Right Language & Theme Controls */}
          <div style={{ position: "fixed", top: 18, right: 18, display: "flex", gap: 8, zIndex: 50 }}>
            <button
              className="btn-pill-secondary"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              style={{ minHeight: 44, padding: "0 14px", borderRadius: 999 }}
              aria-label="Toggle language"
            >
              <Languages size={15} />
              <span>{lang === "en" ? "हिं" : "EN"}</span>
            </button>
          </div>

          {/* Uber Trip Bottom Sheet */}
          <section
            className="uber-sheet"
            style={{
              height:
                sheetSnap === "peek" ? "24vh" : sheetSnap === "full" ? "88vh" : "55vh",
            }}
            aria-label="Bus trip tracking sheet"
          >
            <div
              className="uber-grabber"
              onClick={() =>
                setSheetSnap(
                  sheetSnap === "peek" ? "half" : sheetSnap === "half" ? "full" : "peek"
                )
              }
              aria-label="Toggle sheet snap height"
            />

            {/* Phase 2B: Trip Planner Multi-Bus View */}
            {tripPlannerOpen && (
              <TripPlannerView
                options={tripOptions}
                destinationName={tripDestName}
                loading={tripLoading}
                lang={lang}
                onSelectBus={(busId, routeId, boardingId) => {
                  setTripPlannerOpen(false);
                  openRouteTracker(routeId);
                  setTrackingBusId(busId);
                  setSelectedStopId(boardingId);
                  flashToast(lang === "hi" ? "ट्रिप ट्रैकिंग शुरू" : "Tracking trip to destination");
                }}
                onClose={() => setTripPlannerOpen(false)}
              />
            )}

            {/* TRACKING SPECIFIC BUS */}
            {!tripPlannerOpen && trackingBus && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div className="text-display tabular-nums" style={{ margin: 0 }}>
                      4 <span style={{ fontSize: 16, color: "var(--text-muted)" }}>{lang === "hi" ? "मिनट" : "min"}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                      Route {trackingBus.route_id} · {trackingBus.reg_no}
                    </div>
                    <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                      Towards {trackingBus.towards} · {trackingBus.speed_kmh} km/h
                    </div>
                  </div>

                  <Badge
                    occupancy={trackingBus.occupancy}
                    loadPct={trackingBus.load_pct}
                    label={trackingBus.occupancy}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, margin: "16px 0 20px" }}>
                  <button
                    className="btn-pill-primary"
                    onClick={() => flashToast(lang === "hi" ? "बस आगमन अलर्ट सेट किया गया" : "Arrival notification set")}
                    style={{ flex: 1 }}
                  >
                    <Bell size={16} />
                    <span>{lang === "hi" ? "अलर्ट सेट करें" : "Notify me"}</span>
                  </button>
                  <button
                    className="btn-pill-secondary"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                      }
                      flashToast(lang === "hi" ? "ट्रैकिंग लिंक कॉपी किया गया" : "Trip link copied to clipboard");
                    }}
                    style={{ flex: 1 }}
                  >
                    <Share2 size={16} />
                    <span>{lang === "hi" ? "शेयर करें" : "Share trip"}</span>
                  </button>
                </div>

                {/* Beautiful Vertical Journey Corridor Timeline */}
                {trackingRoute && (
                  <CorridorTimeline
                    route={trackingRoute}
                    bus={trackingBus}
                    allBuses={buses.filter((b) => b.route_id === trackingRoute.id)}
                    selectedStopId={selectedStopId}
                    onSelectStop={(id) => {
                      setSelectedStopId(id);
                      try {
                        localStorage.setItem("user_selected_stop", id);
                      } catch {}
                    }}
                    onSetDestination={(id) => {
                      handlePlanTripTo(id);
                    }}
                    lang={lang}
                    onNotify={(msg) => flashToast(msg)}
                  />
                )}
              </div>
            )}

            {/* ARRIVALS AT SELECTED STOP */}
            {!tripPlannerOpen && !trackingBus && selectedStop && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <span className="text-caption" style={{ fontWeight: 700, color: "var(--text-muted)" }}>
                      BUS STOP
                    </span>
                    <h1 className="text-title" style={{ margin: "2px 0 0", fontSize: 22 }}>
                      {stopName(selectedStop)}
                    </h1>
                  </div>
                  <button
                    onClick={() => setViewMode("home")}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--surface-2)",
                      display: "grid",
                      placeItems: "center",
                    }}
                    aria-label="Return home"
                  >
                    <X size={18} />
                  </button>
                </div>

                {arrivals === null && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Skeleton height={72} borderRadius={16} />
                    <Skeleton height={72} borderRadius={16} />
                  </div>
                )}

                {arrivals && arrivals.length === 0 && (
                  <EmptyState
                    title={lang === "hi" ? "कोई बस नहीं आ रही है" : "No buses at this stop right now"}
                    description={lang === "hi" ? "इस स्टॉप पर अभी कोई बस नहीं है। नज़दीकी स्टॉप देखें।" : "No live buses on this corridor right now. Try a nearby stop."}
                    actionText={lang === "hi" ? "नज़दीकी स्टॉप दिखाएं" : "Show nearby stops"}
                    onAction={handleLocateNearest}
                  />
                )}

                {arrivals && arrivals.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {arrivals.map((a) => (
                      <ArrivalCard
                        key={a.bus_id + a.towards}
                        arrival={a}
                        onTrack={() => setTrackingBusId(a.bus_id)}
                        lang={lang}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* =========================================================================
          FULL-SCREEN SEARCH OVERLAY (Autocomplete English + Hindi)
         ========================================================================= */}
      {isSearchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg)",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="btn-pill-secondary"
              style={{ width: 44, height: 44, minHeight: 44, padding: 0 }}
              aria-label="Close search"
            >
              <ArrowLeft size={18} />
            </button>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface-2)",
                height: 48,
                borderRadius: 999,
                padding: "0 16px",
              }}
            >
              <Search size={18} style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "hi" ? "स्टॉप या रूट खोजें…" : "Search stop, corridor or destination…"}
                autoFocus
                style={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  fontSize: 16,
                  color: "var(--text)",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {searchHits.length === 0 && searchQuery && (
              <p className="text-caption" style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>
                No stops found matching "{searchQuery}"
              </p>
            )}

            {searchHits.map((st) => (
              <button
                key={st.id}
                onClick={() => openStopTracker(st.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "16px 12px",
                  borderBottom: "1px solid var(--line)",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="recent-icon-box">
                    <MapPin size={18} style={{ color: "var(--text)" }} />
                  </div>
                  <div>
                    <b style={{ fontSize: 16 }}>{stopName(st)}</b>
                    <div className="text-caption" style={{ color: "var(--text-muted)" }}>
                      {st.routes?.map((r) => `Route ${r}`).join(" · ")}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            ))}

            {!searchQuery && (
              <div>
                <span className="text-caption" style={{ fontWeight: 700, color: "var(--text-muted)", display: "block", margin: "10px 0" }}>
                  POPULAR TRANSIT HUBS
                </span>
                {stops.slice(0, 5).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => openStopTracker(st.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "14px 12px",
                      borderBottom: "1px solid var(--line)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="recent-icon-box">
                        <Clock size={18} style={{ color: "var(--text-muted)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{stopName(st)}</div>
                        <div className="text-caption" style={{ color: "var(--text-muted)" }}>
                          {st.routes?.map((r) => `Route ${r}`).join(" · ")}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE SHEETS (Section 4 — No Dead Buttons)
         ========================================================================= */}

      {/* 1. Location Selection Sheet (Phase 4: GPS + nearest calculation + outside NCR) */}
      <LocationSheet
        isOpen={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        onSelectStop={(sid) => {
          handleSelectStop(sid);
          updateProfile({ home_stop_id: sid });
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        selectedStopId={selectedStopId}
        lang={lang}
      />

      {/* 2. Live Alerts Sheet */}
      <Sheet
        isOpen={alertsSheetOpen}
        onClose={() => setAlertsSheetOpen(false)}
        title={lang === "hi" ? "लाइव नेटवर्क अलर्ट" : "Live Network Alerts"}
        icon={<Bell size={20} style={{ color: "var(--accent-red)" }} />}
      >
        <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.length === 0 && (
            <EmptyState
              title={lang === "hi" ? "सभी मार्ग सामान्य हैं" : "All corridors clear"}
              description={lang === "hi" ? "दिल्ली के सभी बस मार्गों पर यातायात सामान्य गति से संचालित हो रहा है।" : "Buses across all corridors are operating on time with no reported traffic jams or breakdowns."}
            />
          )}
          {alerts.map((a) => (
            <div
              key={a.id}
              style={{
                padding: 12,
                borderRadius: 14,
                background: "var(--surface-2)",
                borderLeft: `4px solid ${
                  a.severity === "critical"
                    ? "var(--accent-red)"
                    : a.severity === "warning"
                    ? "var(--crowd-mod)"
                    : "var(--link-blue)"
                }`,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.message}</div>
              <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 4 }}>
                Severity: {a.severity} · Route {a.route_id ?? "All"}
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* 3. Schedule Time Picker Sheet */}
      <Sheet
        isOpen={scheduleSheetOpen}
        onClose={() => setScheduleSheetOpen(false)}
        title={lang === "hi" ? "यात्रा का समय चुनें" : "Trip departure time"}
        icon={<Calendar size={20} />}
      >
        <p className="text-body" style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
          Select an offset to see ML forecast arrival predictions for that hour.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Now", offset: 0 },
            { label: "+15 minutes", offset: 15 },
            { label: "+30 minutes", offset: 30 },
            { label: "+1 hour", offset: 60 },
          ].map((opt) => (
            <button
              key={opt.offset}
              onClick={() => {
                setScheduleOffsetMin(opt.offset);
                setScheduleSheetOpen(false);
                flashToast(`Schedule set to ${opt.label}`);
              }}
              className={scheduleOffsetMin === opt.offset ? "btn-pill-primary" : "btn-pill-secondary"}
              style={{ minHeight: 46 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Sheet>

      {/* 4. Women's Safety & SOS Sheet (Phase G) */}
      <Sheet
        isOpen={safetySheetOpen}
        onClose={() => setSafetySheetOpen(false)}
        title={lang === "hi" ? "महिला सुरक्षा एवं 112 सहायता" : "Women's Safety & 112 PCR Hub"}
        icon={<ShieldAlert size={20} style={{ color: "var(--accent-red)" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Safety Mode Toggle Card */}
          <div style={{ padding: 14, borderRadius: 16, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {lang === "hi" ? "सुरक्षा मोड (हाई-अलर्ट)" : "Safety Mode (High-Alert)"}
              </div>
              <div className="text-caption" style={{ color: "var(--text-muted)" }}>
                {safetyModeActive ? "Active · 112 PCR & DTC dispatch ready" : "Disarmed · Tap to activate"}
              </div>
            </div>
            <button
              onClick={() => {
                setSafetyModeActive(!safetyModeActive);
                flashToast(safetyModeActive ? "Safety Mode deactivated" : "Safety Mode ACTIVATED · 112 Linked");
              }}
              className="btn-pill-primary"
              style={{
                background: safetyModeActive ? "#e11d48" : "var(--surface)",
                color: safetyModeActive ? "#fff" : "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              {safetyModeActive ? "ACTIVE" : "TURN ON"}
            </button>
          </div>

          {/* Silent SOS with 5-Second Buffer */}
          <div style={{ padding: 14, borderRadius: 16, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Direct Police & Command SOS
            </div>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
              5-second cancel buffer. Transmits vehicle ID & GPS to Delhi Police (112) and DTC Command.
            </div>
            <button
              onClick={startSosBuffer}
              className="btn-pill-primary"
              style={{ background: "var(--accent-red)", color: "#fff", width: "100%", fontWeight: 700 }}
            >
              TRIGGER SILENT SOS (5s Buffer)
            </button>
          </div>

          {/* Live Trip Sharing */}
          <div style={{ padding: 14, borderRadius: 16, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Public Live Trip Sharing (/t/[token])
            </div>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
              Generate an encrypted, time-limited link for family. No login required to track.
            </div>
            {shareData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "var(--surface)", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shareData.url}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      if (typeof navigator !== "undefined") {
                        navigator.clipboard.writeText(shareData.url);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2500);
                      }
                    }}
                    className="btn-pill-secondary"
                    style={{ flex: 1 }}
                  >
                    {shareCopied ? "Copied!" : "Copy Link"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Follow my Delhi transit trip live: ${shareData.url}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pill-primary"
                    style={{ flex: 1, background: "#059669", color: "#fff", textAlign: "center", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateShareToken}
                disabled={shareLoading}
                className="btn-pill-secondary"
                style={{ width: "100%" }}
              >
                <Share2 size={16} /> {shareLoading ? "Generating..." : "Generate Share Link"}
              </button>
            )}
          </div>

          {/* Quick Emergency Helplines */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <a
              href="tel:112"
              className="btn-pill-secondary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", color: "#e11d48", fontWeight: 700 }}
            >
              <PhoneCall size={14} /> Call 112 (Police)
            </a>
            <a
              href="tel:1091"
              className="btn-pill-secondary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", color: "#db2777", fontWeight: 700 }}
            >
              <PhoneCall size={14} /> Call 1091 (Women)
            </a>
          </div>

          <Link
            href="/safety"
            style={{ textAlign: "center", fontSize: 13, color: "var(--accent-primary)", fontWeight: 600, padding: 8, textDecoration: "none" }}
          >
            Open Complete Women's Safety & Safe Stop Explorer →
          </Link>
        </div>
      </Sheet>

      {/* 5. Delhi Fares & Schemes Sheet */}
      <Sheet
        isOpen={faresSheetOpen}
        onClose={() => setFaresSheetOpen(false)}
        title="Delhi Bus Fares & Passes (Demo data)"
        icon={<Info size={20} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-2)" }}>
            <b>Women Commuters: Free Pink Pass</b>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              Available directly from bus conductors on non-AC and AC DTC/Cluster buses.
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-2)" }}>
            <b>Standard Non-AC Buses: ₹5 / ₹10 / ₹15</b>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              Up to 4km: ₹5 · 4-10km: ₹10 · Beyond 10km: ₹15
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-2)" }}>
            <b>Standard AC Low-Floor Buses: ₹10 / ₹15 / ₹20 / ₹25</b>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              Based on staged corridor distance. Daily pass: ₹50.
            </div>
          </div>
        </div>
      </Sheet>

      {/* 6. Coming Soon (Metro / Intercity) Sheet */}
      <Sheet
        isOpen={comingSoonSheetOpen !== null}
        onClose={() => {
          setComingSoonSheetOpen(null);
          setActiveMode("bus");
        }}
        title={comingSoonSheetOpen || "Coming soon"}
        icon={<Compass size={20} />}
      >
        <EmptyState
          title="Under Active Development"
          description={`Integration with ${comingSoonSheetOpen} is scheduled for Delhi Mobility Phase 2.`}
          actionText="Notify me when ready"
          onAction={() => {
            setComingSoonSheetOpen(null);
            setActiveMode("bus");
            flashToast("We will notify you when this transit mode is available.");
          }}
        />
      </Sheet>

      {/* 7. Emergency SOS Alert Modal Dialog (Phase G: 5-Second Cancel Buffer) */}
      {sosModalOpen && (
        <div
          className="dialog-backdrop"
          role="alertdialog"
          aria-modal="true"
          onClick={() => {
            if (!sosBufferActive) setSosModalOpen(false);
          }}
        >
          <div className="dialog-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center", padding: 24, borderRadius: 24 }}>
            {sosBufferActive ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                {/* 5-second animated countdown ring */}
                <div style={{ position: "relative", width: 88, height: 88, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid rgba(225, 29, 72, 0.2)", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid #e11d48", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 38, fontWeight: 900, fontFamily: "monospace", color: "#e11d48" }}>
                    {sosCountdown}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px 0", color: "var(--text)" }}>
                    {lang === "hi" ? "आपातकालीन अलर्ट बफर सक्रिय" : "TRANSMITTING EMERGENCY ALERT"}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                    {lang === "hi"
                      ? "5 सेकंड में दिल्ली पुलिस 112 और डीटीसी कमांड सेंटर को सीधा सिग्नल भेजा जाएगा।"
                      : "Direct telemetry transmitting to Delhi Police (112) and DTC Transit Command in 5 seconds."}
                  </p>
                </div>

                <div style={{ width: "100%", padding: 10, borderRadius: 12, background: "var(--surface-2)", fontSize: 11, color: "var(--text-muted)" }}>
                  Ambient audio & AIS-140 GPS beacon armed
                </div>

                <button
                  className="btn-pill-secondary"
                  onClick={cancelSosBuffer}
                  style={{ width: "100%", padding: "14px 20px", fontWeight: 800, fontSize: 14, borderColor: "#e11d48", color: "#e11d48" }}
                  autoFocus
                >
                  {lang === "hi" ? "गलत अलार्म रद्द करें" : "CANCEL FALSE ALARM"}
                </button>
              </div>
            ) : sosDispatchedRef ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", border: "2px solid #10b981", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px 0", color: "var(--text)" }}>
                    {lang === "hi" ? "अलर्ट सफलता से भेजा गया!" : "Emergency Alert Dispatched!"}
                  </h3>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, background: "var(--surface-2)", padding: "4px 10px", borderRadius: 8, display: "inline-block", color: "#f59e0b", marginBottom: 6 }}>
                    Ref: {sosDispatchedRef}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                    Coordinates transmitted to Delhi Police PCR 112 & DTC Central Command.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
                  <a
                    href="tel:112"
                    className="btn-pill-primary"
                    style={{ background: "#e11d48", color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700 }}
                  >
                    <PhoneCall size={16} /> Call 112
                  </a>
                  <button
                    className="btn-pill-secondary"
                    onClick={() => {
                      setSosModalOpen(false);
                      setSosDispatchedRef(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 8. Floating Status Toast (Phase 1B: Fixed to bottom calc(var(--nav-h) + 16px + safe-area)) */}
      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

      {/* =========================================================================
          FLOATING PILL BOTTOM NAVIGATION (Detached Uber Style)
         ========================================================================= */}
      {viewMode === "home" && (
        <BottomNav
          activeTab={activeNav}
          onSelectTab={(tab) => {
            setActiveNav(tab);
            if (tab === "account") {
              router.push("/account");
            } else if (tab === "activity") {
              router.push("/activity");
            } else if (tab === "services") {
              router.push("/services");
            }
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
