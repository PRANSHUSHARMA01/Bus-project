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
  MapPin,
  Moon,
  Search,
  Share2,
  ShieldAlert,
  Sliders,
  Sun,
  Train,
  User,
  Users,
  X,
} from "lucide-react";
import BusMap from "../components/BusMap";
import { ArrivalCard } from "../components/ui/ArrivalCard";
import { Badge } from "../components/ui/Badge";
import { BottomNav, NavTab } from "../components/ui/BottomNav";
import { Carousel } from "../components/ui/Carousel";
import { EmptyState } from "../components/ui/EmptyState";
import { LocationSheet } from "../components/ui/LocationSheet";
import { ModeTabs, ModeTab } from "../components/ui/ModeTabs";
import { PromoBanner } from "../components/ui/PromoBanner";
import { SearchPill } from "../components/ui/SearchPill";
import { Sheet } from "../components/ui/Sheet";
import { ShortcutGrid, ShortcutItem } from "../components/ui/ShortcutGrid";
import { Skeleton } from "../components/ui/Skeleton";
import { StopRow } from "../components/ui/StopRow";
import { Toast } from "../components/ui/Toast";
import { TopBar } from "../components/ui/TopBar";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { post, usePoll } from "../lib/api";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeMode, setActiveMode] = useState<ModeTab>("bus");
  const [activeNav, setActiveNav] = useState<NavTab>("home");
  const [viewMode, setViewMode] = useState<"home" | "map">("home");

  // Selection & Search
  const [selectedStopId, setSelectedStopId] = useState<string>("");
  const [trackingBusId, setTrackingBusId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  // Auth lock check
  useEffect(() => {
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
  const trackingBus = buses.find((b) => b.bus_id === trackingBusId);
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
    const hubs = ["Kashmere Gate", "Mehrauli", "Old Delhi", "Nizamuddin", "Anand Vihar", "Rohini", "Connaught Place", "Nehru Place"];
    const matched = activeStops.filter((s) => hubs.some((h) => s.name.toLowerCase().includes(h.toLowerCase())));
    return (matched.length >= 3 ? matched : activeStops).slice(0, 3);
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

  async function handleSendSos() {
    setSosModalOpen(false);
    try {
      await post("/ingest/incident", {
        kind: "sos",
        note: `Passenger SOS${selectedStop ? " near " + selectedStop.name : ""}`,
      });
      flashToast(lang === "hi" ? "अलर्ट भेजा गया। कंट्रोल रूम को सूचित किया गया।" : "Emergency alert sent. Delhi Transport Command notified.");
    } catch {
      flashToast(lang === "hi" ? "अलर्ट दर्ज किया गया" : "SOS alert registered with command");
    }
  }

  function flashToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // "For you" shortcut items
  const shortcuts: ShortcutItem[] = [
    {
      id: "nearest",
      label: lang === "hi" ? "नज़दीकी स्टॉप" : "Nearest stop",
      icon: MapPin,
      badge: "Live",
      onClick: handleLocateNearest,
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
      id: "safety",
      label: lang === "hi" ? "महिला सुरक्षा" : "Women's safety",
      icon: ShieldAlert,
      badge: "SOS",
      onClick: () => setSafetySheetOpen(true),
    },
    {
      id: "seats",
      label: lang === "hi" ? "सीट खोजें" : "Seat finder",
      icon: Users,
      badge: "AI",
      onClick: () => {
        const best = buses.find((b) => b.occupancy === "Low");
        if (best) {
          setTrackingBusId(best.bus_id);
          setViewMode("map");
          setSheetSnap("half");
          flashToast(lang === "hi" ? `बस ${best.reg_no} में सीटें उपलब्ध हैं` : `Found seats on Bus ${best.reg_no}`);
        } else {
          flashToast(lang === "hi" ? "सीट उपलब्धता जांची जा रही है" : "Checking seat availability on current routes");
        }
      },
    },
    {
      id: "night",
      label: lang === "hi" ? "नाइट बसें" : "Night buses",
      icon: Moon,
      onClick: () => flashToast(lang === "hi" ? "नाइट बस सेवाएं रात 11:30 बजे तक सक्रिय हैं" : "Night corridors active until 23:30 from NDLS & Kashmere Gate"),
    },
    {
      id: "seniors",
      label: lang === "hi" ? "वरिष्ठ नागरिक" : "Seniors priority",
      icon: HeartHandshake,
      onClick: () => flashToast(lang === "hi" ? "सामने की 6 सीटें वरिष्ठ नागरिकों के लिए आरक्षित हैं" : "Front 6 seats reserved for senior citizens on all fleets"),
    },
  ];

  // Carousel items
  const carouselCards = [
    {
      id: "crowd",
      tag: "Real-time AI",
      title: lang === "hi" ? "मार्ग पर भीड़ की स्थिति" : "Live crowd on your route",
      subtitle: lang === "hi" ? "चढ़ने से पहले सीट मिलने की संभावना जांचें" : "Predict seat availability before boarding",
      bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
      color: "#ffffff",
      onClick: () => {
        if (recentStops[0]) openStopTracker(recentStops[0].id);
      },
    },
    {
      id: "safety",
      tag: "Safety First",
      title: lang === "hi" ? "रात में सुरक्षित यात्रा" : "Safer travel at night",
      subtitle: lang === "hi" ? "कंट्रोल रूम से सीधा आपातकालीन SOS लिंक" : "Direct SOS linked to Delhi Transport Command",
      bg: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
      color: "#ffffff",
      onClick: () => setSafetySheetOpen(true),
    },
    {
      id: "routeA",
      tag: "Smart Commute",
      title: lang === "hi" ? "प्रमुख दिल्ली रूट: 502" : "Major Delhi Corridor: 502",
      subtitle: lang === "hi" ? "महरौली से कश्मीरी गेट बस हर 5 मिनट में" : "Mehrauli - Kashmere Gate frequency 5 min",
      bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      color: "#ffffff",
      onClick: () => openRouteTracker("502"),
    },
  ];

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

          {/* Recent & Saved Stops List Card */}
          <div className="recent-card">
            {recentStops.map((st) => {
              const liveArr = arrivals?.find((a) => a.stops_away <= 3) ?? null;
              return (
                <StopRow
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

            {/* TRACKING SPECIFIC BUS */}
            {trackingBus && (
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

                {/* Progress Timeline */}
                <div>
                  <b style={{ fontSize: 15, display: "block", marginBottom: 12 }}>
                    {lang === "hi" ? "रूट के स्टॉप" : "Corridor stops"}
                  </b>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {trackingRoute?.stops.map((st) => {
                      const isCurrent = st.id === selectedStopId;
                      return (
                        <div
                          key={st.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            opacity: isCurrent ? 1 : 0.7,
                          }}
                        >
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: isCurrent ? "var(--primary)" : "var(--surface-3)",
                              border: isCurrent ? "3px solid #fff" : "none",
                              outline: isCurrent ? "2px solid var(--primary)" : "none",
                            }}
                          />
                          <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 14 }}>
                            {stopName(st)}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: "var(--surface-2)",
                                padding: "2px 8px",
                                borderRadius: 999,
                              }}
                            >
                              Next stop
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ARRIVALS AT SELECTED STOP */}
            {!trackingBus && selectedStop && (
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

      {/* 4. Women's Safety & SOS Sheet */}
      <Sheet
        isOpen={safetySheetOpen}
        onClose={() => setSafetySheetOpen(false)}
        title={lang === "hi" ? "महिला सुरक्षा एवं सहायता" : "Women's Safety & Assistance"}
        icon={<ShieldAlert size={20} style={{ color: "var(--accent-red)" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 16, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Direct Police & Command SOS
            </div>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
              Broadcasts immediate location and vehicle ID to Delhi Police and Transport Control Room.
            </div>
            <button
              onClick={() => setSosModalOpen(true)}
              className="btn-pill-primary"
              style={{ background: "var(--accent-red)", color: "#fff", width: "100%" }}
            >
              Trigger Emergency Alert
            </button>
          </div>

          <div style={{ padding: 14, borderRadius: 16, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Live Trip Sharing
            </div>
            <div className="text-caption" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
              Share your live bus location and ETA with family or emergency contacts.
            </div>
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
                flashToast("Trip tracking link copied to clipboard");
              }}
              className="btn-pill-secondary"
              style={{ width: "100%" }}
            >
              <Share2 size={16} /> Share Live Link
            </button>
          </div>
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

      {/* 7. Emergency SOS Alert Modal Dialog */}
      {sosModalOpen && (
        <div
          className="dialog-backdrop"
          role="alertdialog"
          aria-modal="true"
          onClick={() => setSosModalOpen(false)}
        >
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <ShieldAlert size={28} style={{ color: "var(--accent-red)" }} />
              <b className="text-title" style={{ fontSize: 18 }}>
                {lang === "hi" ? "आपातकालीन नियंत्रण कक्ष अलर्ट" : "Emergency SOS Confirmation"}
              </b>
            </div>
            <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              {lang === "hi"
                ? "क्या आप दिल्ली परिवहन कमांड सेंटर को आपातकालीन अलर्ट भेजना चाहते हैं?"
                : "Send an emergency alert and live coordinates to Delhi Police and Transport Control Room?"}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn-pill-secondary"
                onClick={() => setSosModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-pill-primary"
                style={{ background: "var(--accent-red)", color: "#fff" }}
                onClick={handleSendSos}
                autoFocus
              >
                Send alert
              </button>
            </div>
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
              flashToast("Recent rides and ticket passes");
            } else if (tab === "services") {
              flashToast("Delhi Smart Transit network services");
            }
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
