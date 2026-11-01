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
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  HeartHandshake,
  Home,
  Languages,
  MapPin,
  Moon,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Sun,
  Train,
  User,
  Users,
  X,
} from "lucide-react";
import BusMap from "../components/BusMap";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { post, usePoll } from "../lib/api";
import { Alert, Arrival, Bus, OCC_COLOR, Route, Stop } from "../lib/types";

// Microcopy dictionaries with English and Hindi support
const T = {
  en: {
    greeting: "Hi, Pranshu",
    whereTo: "Where to?",
    schedule: "Schedule",
    currentLoc: "Current location",
    busTab: "Bus",
    metroTab: "Metro",
    intercityTab: "Intercity",
    forYou: "For you",
    waysToSave: "Save yourself a trip",
    recent: "Recent & saved stops",
    promoTitle: "Free bus travel for women commuters",
    promoSubtitle: "Pink pass scheme operational across all DTC & Cluster fleets",
    seeFares: "See fares",
    live: "LIVE",
    min: "min",
    away: "away",
    towards: "towards",
    seatLikely: "Likely to get a seat",
    seatFew: "Few seats remaining",
    seatStanding: "Standing room only",
    none: "No buses at this stop right now. Try a nearby stop.",
    showNearby: "Show nearby stops",
    sos: "Emergency SOS",
    sosTitle: "Emergency control room alert",
    sosAsk: "Send an emergency alert to Delhi Transport Command Centre?",
    sosConfirm: "Send alert",
    sosCancel: "Cancel",
    sosSent: "Emergency alert sent. Delhi Transport Command Centre notified.",
    notifyMe: "Notify me",
    shareTrip: "Share trip",
    notifiedToast: "Arrival notification set for this bus.",
    sharedToast: "Trip tracking link copied to clipboard.",
    navHome: "Home",
    navServices: "Services",
    navActivity: "Activity",
    navAccount: "Account",
    alertsTitle: "Live network alerts",
    allClear: "All corridors operating normally",
    shortcuts: {
      nearest: "Nearest stop",
      routeA: "Route A",
      routeB: "Route B",
      routeC: "Route C",
      safety: "Women's safety",
      seatFinder: "Seat finder",
      nightBus: "Night buses",
      seniors: "Seniors priority",
    },
    carousel: [
      {
        tag: "Real-time AI",
        title: "Live crowd on your route",
        subtitle: "See seat probabilities before boarding",
        bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
        color: "#fff",
      },
      {
        tag: "Safety First",
        title: "Safer travel at night",
        subtitle: "Direct SOS linked to Delhi Transport Command",
        bg: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
        color: "#fff",
      },
      {
        tag: "Smart Commute",
        title: "Your usual bus: Route A",
        subtitle: "Next bus from Connaught Place in 4 min",
        bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        color: "#fff",
      },
    ],
  },
  hi: {
    greeting: "नमस्ते, प्रांशु",
    whereTo: "कहाँ जाना है?",
    schedule: "समय सारणी",
    currentLoc: "वर्तमान स्थान",
    busTab: "बस",
    metroTab: "मेट्रो",
    intercityTab: "इंटरसिटी",
    forYou: "आपके लिए",
    waysToSave: "समय और यात्रा बचाएं",
    recent: "हाल के और पसंदीदा स्टॉप",
    promoTitle: "महिला यात्रियों के लिए निःशुल्क बस यात्रा",
    promoSubtitle: "डीटीसी एवं क्लस्टर बसों में पिंक पास योजना लागू",
    seeFares: "किराया देखें",
    live: "लाइव",
    min: "मिनट",
    away: "दूर",
    towards: "की ओर",
    seatLikely: "सीट मिलने की संभावना है",
    seatFew: "कुछ ही सीटें शेष हैं",
    seatStanding: "केवल खड़े रहने की जगह",
    none: "इस स्टॉप पर अभी कोई बस नहीं आ रही है। नज़दीकी स्टॉप देखें।",
    showNearby: "नज़दीकी स्टॉप दिखाएं",
    sos: "आपातकालीन SOS",
    sosTitle: "आपातकालीन नियंत्रण कक्ष अलर्ट",
    sosAsk: "क्या आप दिल्ली परिवहन कमांड सेंटर को आपातकालीन अलर्ट भेजना चाहते हैं?",
    sosConfirm: "अलर्ट भेजें",
    sosCancel: "रद्द करें",
    sosSent: "अलर्ट भेज दिया गया है। सहायता टीम को सूचित कर दिया गया है।",
    notifyMe: "अलर्ट सेट करें",
    shareTrip: "ट्रिप शेयर करें",
    notifiedToast: "इस बस के लिए अलर्ट सेट कर दिया गया है।",
    sharedToast: "ट्रैकिंग लिंक कॉपी हो गया है।",
    navHome: "होम",
    navServices: "सेवाएं",
    navActivity: "गतिविधि",
    navAccount: "खाता",
    alertsTitle: "लाइव अलर्ट",
    allClear: "सभी मार्ग सामान्य रूप से संचालित हैं",
    shortcuts: {
      nearest: "नज़दीकी स्टॉप",
      routeA: "रूट A",
      routeB: "रूट B",
      routeC: "रूट C",
      safety: "महिला सुरक्षा",
      seatFinder: "सीट खोजें",
      nightBus: "नाइट बसें",
      seniors: "वरिष्ठ नागरिक",
    },
    carousel: [
      {
        tag: "लाइव AI",
        title: "मार्ग पर भीड़ की स्थिति",
        subtitle: "चढ़ने से पहले सीट मिलने की संभावना जांचें",
        bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
        color: "#fff",
      },
      {
        tag: "सुरक्षा सर्वोपरि",
        title: "रात में सुरक्षित यात्रा",
        subtitle: "कंट्रोल रूम से सीधा आपातकालीन SOS",
        bg: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
        color: "#fff",
      },
      {
        tag: "स्मार्ट यात्रा",
        title: "आपकी पसंदीदा बस: रूट A",
        subtitle: "कनॉट प्लेस से अगली बस 4 मिनट में",
        bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        color: "#fff",
      },
    ],
  },
};

function kmDist(a: Stop, lat: number, lng: number) {
  const p = Math.PI / 180;
  const x =
    Math.sin(((lat - a.lat) * p) / 2) ** 2 +
    Math.cos(a.lat * p) * Math.cos(lat * p) * Math.sin(((lng - a.lng) * p) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

export default function UberPassengerHome() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<"bus" | "metro" | "intercity">("bus");
  const [activeNav, setActiveNav] = useState<"home" | "services" | "activity" | "account">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"home" | "map">("home");
  const [selectedStopId, setSelectedStopId] = useState<string | null>("cp");
  const [trackingBusId, setTrackingBusId] = useState<number | null>(null);
  const [sheetSnap, setSheetSnap] = useState<"peek" | "half" | "full">("half");
  const [alertsSheetOpen, setAlertsSheetOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = T[lang];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync data-theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
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

  const selectedStop = stops.find((s) => s.id === selectedStopId);
  const trackingBus = buses.find((b) => b.bus_id === trackingBusId);
  const trackingRoute = routes.find((r) => r.id === trackingBus?.route_id);

  const stopName = (s: Stop) => (lang === "hi" ? s.name_hi : s.name);

  // Autocomplete search hits
  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return stops
      .filter((s) => s.name.toLowerCase().includes(q) || s.name_hi.includes(q))
      .slice(0, 5);
  }, [searchQuery, stops]);

  // Recent / Saved Stops
  const recentStops = useMemo(
    () => stops.filter((s) => ["cp", "ndls", "kashmere_gate"].includes(s.id)),
    [stops]
  );

  function openStopTracker(id: string) {
    setSelectedStopId(id);
    setTrackingBusId(null);
    setSearchQuery("");
    setViewMode("map");
    setSheetSnap("half");
  }

  function handleLocateNearest() {
    const fallback = () => openStopTracker("cp");
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

  async function handleConfirmSos() {
    setSosModalOpen(false);
    try {
      await post("/ingest/incident", {
        kind: "sos",
        note: `Passenger SOS${selectedStop ? " near " + selectedStop.name : ""}`,
      });
      flashToast(t.sosSent);
    } catch {
      flashToast("Connecting to police / command line...");
    }
  }

  function flashToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: viewMode === "home" ? 90 : 0,
        }}
      >
        {/* =========================================================================
            STATE 1: UBER HOME SCREEN (Monochrome, Pill UI, Circular Shortcuts)
           ========================================================================= */}
        {viewMode === "home" && (
          <div style={{ padding: "16px 20px" }}>
            {/* Top Bar: Location + Alerts */}
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <button
                onClick={handleLocateNearest}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 999,
                }}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--link-blue)",
                    display: "inline-block",
                  }}
                />
                <span>{selectedStop ? stopName(selectedStop) : t.currentLoc}</span>
                <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
              </button>

              <button
                onClick={() => setAlertsSheetOpen(true)}
                className="btn-pill-secondary"
                style={{
                  minHeight: 40,
                  padding: "6px 14px",
                  fontSize: 13,
                  gap: 6,
                }}
                aria-label="View live alerts"
              >
                <Bell size={16} />
                <span>Alerts</span>
                {alerts.length > 0 && (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--accent-red)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {alerts.length}
                  </span>
                )}
              </button>
            </header>

            {/* Underlined Tab Switcher: Bus · Metro · Intercity */}
            <div
              style={{
                display: "flex",
                gap: 8,
                borderBottom: "1px solid var(--line)",
                marginBottom: 18,
              }}
            >
              {[
                { id: "bus", label: t.busTab, icon: BusIcon },
                { id: "metro", label: t.metroTab, icon: Train, badge: "Soon" },
                { id: "intercity", label: t.intercityTab, icon: Compass, badge: "Soon" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`uber-tab ${isActive ? "active" : ""}`}
                  >
                    <tab.icon size={17} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: "var(--surface-3)",
                          color: "var(--text-muted)",
                          fontWeight: 700,
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="uberTabUnderline"
                        className="uber-tab-underline"
                        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Greeting + Hero Search Pill ("Where to?") */}
            <div style={{ marginBottom: 24 }}>
              <div
                className="text-title"
                style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}
              >
                {t.greeting}
              </div>

              <div
                className="hero-search-pill"
                onClick={() => searchInputRef.current?.focus()}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <Search size={20} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.whereTo}
                    style={{
                      width: "100%",
                      border: 0,
                      outline: 0,
                      background: "transparent",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                      }}
                      style={{ padding: 4 }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div
                  className="hero-schedule-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    flashToast("Delhi transit schedule: 05:00 - 23:30 daily");
                  }}
                >
                  <Calendar size={14} />
                  <span>{t.schedule}</span>
                </div>
              </div>

              {/* Autocomplete Dropdown */}
              {searchHits.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    background: "var(--surface)",
                    borderRadius: 16,
                    boxShadow: "var(--ring)",
                    overflow: "hidden",
                    border: "1px solid var(--line)",
                  }}
                >
                  {searchHits.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openStopTracker(s.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "14px 18px",
                        textAlign: "left",
                        borderBottom: "1px solid var(--line)",
                      }}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "var(--surface-2)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <MapPin size={18} style={{ color: "var(--text)" }} />
                        </div>
                        <div>
                          <b style={{ fontSize: 15 }}>{stopName(s)}</b>
                          <div
                            className="text-caption"
                            style={{ color: "var(--text-muted)", marginTop: 2 }}
                          >
                            {s.routes?.map((r) => `Route ${r}`).join(" · ")}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent & Saved List Card (Hairline separated) */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 20,
                  boxShadow: "var(--ring)",
                  border: "1px solid var(--line)",
                  overflow: "hidden",
                }}
              >
                {recentStops.map((st, i) => (
                  <button
                    key={st.id}
                    onClick={() => openStopTracker(st.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "14px 18px",
                      textAlign: "left",
                      borderBottom:
                        i < recentStops.length - 1 ? "1px solid var(--line)" : "none",
                    }}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: "var(--surface-2)",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={19} style={{ color: "var(--text)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{stopName(st)}</div>
                        <div
                          className="text-caption"
                          style={{ color: "var(--text-muted)", marginTop: 1 }}
                        >
                          Delhi transit hub · {st.routes?.map((r) => `Route ${r}`).join(" · ")}
                        </div>
                        <div
                          className="text-caption"
                          style={{ color: "var(--accent-red)", fontWeight: 600, marginTop: 2 }}
                        >
                          Bus arrives in 4 min
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* "For You" Circular Shortcut Grid (4 columns) */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 className="text-title" style={{ fontSize: 20, margin: 0 }}>
                  {t.forYou}
                </h2>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--surface-2)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ChevronRight size={16} />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px 8px",
                  textAlign: "center",
                }}
              >
                {[
                  {
                    id: "nearest",
                    label: t.shortcuts.nearest,
                    icon: MapPin,
                    badge: "Live",
                    action: handleLocateNearest,
                  },
                  {
                    id: "A",
                    label: t.shortcuts.routeA,
                    icon: BusIcon,
                    badge: null,
                    action: () => openStopTracker("cp"),
                  },
                  {
                    id: "B",
                    label: t.shortcuts.routeB,
                    icon: BusIcon,
                    badge: null,
                    action: () => openStopTracker("kashmere_gate"),
                  },
                  {
                    id: "C",
                    label: t.shortcuts.routeC,
                    icon: BusIcon,
                    badge: null,
                    action: () => openStopTracker("ndls"),
                  },
                  {
                    id: "safety",
                    label: t.shortcuts.safety,
                    icon: ShieldAlert,
                    badge: "SOS",
                    action: () => setSosModalOpen(true),
                  },
                  {
                    id: "seats",
                    label: t.shortcuts.seatFinder,
                    icon: Users,
                    badge: "AI",
                    action: () => openStopTracker("nehru_place"),
                  },
                  {
                    id: "night",
                    label: t.shortcuts.nightBus,
                    icon: Moon,
                    badge: null,
                    action: () => flashToast("Night bus services run every 20m from major railway stations"),
                  },
                  {
                    id: "seniors",
                    label: t.shortcuts.seniors,
                    icon: HeartHandshake,
                    badge: null,
                    action: () => flashToast("Senior citizens reserved seats: Front 6 seats on all buses"),
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={item.action}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="shortcut-circle">
                      <item.icon size={26} style={{ color: "var(--text)" }} />
                      {item.badge && (
                        <span
                          style={{
                            position: "absolute",
                            top: -2,
                            left: -2,
                            background:
                              item.badge === "SOS" ? "var(--accent-red)" : "var(--primary)",
                            color: "var(--on-primary)",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 999,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        display: "block",
                        color: "var(--text)",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Snap Carousel */}
            <div style={{ marginBottom: 28 }}>
              <h2 className="text-title" style={{ fontSize: 20, margin: "0 0 14px" }}>
                {t.waysToSave}
              </h2>
              <div className="carousel-snap">
                {t.carousel.map((card, idx) => (
                  <div
                    key={idx}
                    className="carousel-item"
                    style={{
                      background: card.bg,
                      color: card.color,
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 160,
                    }}
                    onClick={() => openStopTracker("cp")}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: 0.9,
                      }}
                    >
                      {card.tag}
                    </span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                        {card.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.85,
                          marginTop: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {card.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Promo Banner (Free Bus Pass for Women) */}
            <div className="promo-banner" style={{ marginBottom: 28 }}>
              <div style={{ maxWidth: "80%" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  DELHI GOVT SCHEME
                </span>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    margin: "6px 0 8px",
                  }}
                >
                  {t.promoTitle}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.8)",
                    margin: "0 0 16px",
                  }}
                >
                  {t.promoSubtitle}
                </p>
                <button
                  onClick={() => flashToast("Pink ticket tokens are issued free by the conductor on board")}
                  className="btn-pill-primary"
                  style={{
                    background: "#fff",
                    color: "#000",
                    minHeight: 40,
                    padding: "8px 20px",
                    fontSize: 13,
                  }}
                >
                  {t.seeFares}
                </button>
              </div>

              {/* Decorative background shape */}
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  bottom: -20,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: UBER MAP & TRIP TRACKING FLOW (After user taps stop or route)
           ========================================================================= */}
        {viewMode === "map" && (
          <div style={{ position: "fixed", inset: 0, zIndex: 30 }}>
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
                zIndex: 40,
              }}
              aria-label="Back to home"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Top Right Language & Theme Controls */}
            <div
              style={{
                position: "fixed",
                top: 18,
                right: 18,
                display: "flex",
                gap: 8,
                zIndex: 40,
              }}
            >
              <button
                className="btn-pill-secondary"
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                style={{ minHeight: 44, padding: "0 14px", borderRadius: 999 }}
              >
                <Languages size={15} />
                <span>{lang === "en" ? "हिं" : "EN"}</span>
              </button>
            </div>

            {/* Uber Trip Bottom Sheet (3 Snap Points) */}
            <section
              className="uber-sheet"
              style={{
                height:
                  sheetSnap === "peek" ? "22vh" : sheetSnap === "full" ? "88vh" : "55vh",
              }}
            >
              {/* Grabber Handle */}
              <div
                className="uber-grabber"
                onClick={() =>
                  setSheetSnap(
                    sheetSnap === "peek" ? "half" : sheetSnap === "half" ? "full" : "peek"
                  )
                }
              />

              {/* VIEW: Tracking Specific Bus */}
              {trackingBus && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div className="text-display tabular-nums" style={{ margin: 0 }}>
                        4 <span style={{ fontSize: 16, color: "var(--text-muted)" }}>{t.min}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                        Route {trackingBus.route_id} · {trackingBus.reg_no}
                      </div>
                      <div
                        className="text-caption"
                        style={{ color: "var(--text-muted)", marginTop: 2 }}
                      >
                        {t.towards} {trackingBus.towards} · {trackingBus.speed_kmh} km/h
                      </div>
                    </div>

                    <Badge
                      occupancy={trackingBus.occupancy}
                      loadPct={trackingBus.load_pct}
                      label={t[trackingBus.occupancy === "Low" ? "seatLikely" : trackingBus.occupancy === "Moderate" ? "seatFew" : "seatStanding"]}
                    />
                  </div>

                  {/* Black "Notify me" & Grey "Share trip" Pills */}
                  <div style={{ display: "flex", gap: 10, margin: "16px 0 20px" }}>
                    <button
                      className="btn-pill-primary"
                      onClick={() => flashToast(t.notifiedToast)}
                      style={{ flex: 1 }}
                    >
                      <Bell size={16} />
                      {t.notifyMe}
                    </button>
                    <button
                      className="btn-pill-secondary"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.href);
                        }
                        flashToast(t.sharedToast);
                      }}
                      style={{ flex: 1 }}
                    >
                      <Share2 size={16} />
                      {t.shareTrip}
                    </button>
                  </div>

                  {/* Stop Progress Timeline */}
                  <div>
                    <b style={{ fontSize: 15, display: "block", marginBottom: 12 }}>
                      Trip route stops
                    </b>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {trackingRoute?.stops.map((st, idx) => {
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

              {/* VIEW: Arrivals at Selected Stop */}
              {!trackingBus && selectedStop && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <span
                        className="text-caption"
                        style={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                        }}
                      >
                        Bus Stop
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
                      aria-label="Back to home"
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
                    <div style={{ textAlign: "center", padding: "28px 16px" }}>
                      <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                        {t.none}
                      </p>
                      <button
                        className="btn-pill-secondary"
                        onClick={handleLocateNearest}
                      >
                        {t.showNearby}
                      </button>
                    </div>
                  )}

                  {arrivals && arrivals.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {arrivals.map((a) => (
                        <div
                          key={a.bus_id + a.towards}
                          onClick={() => setTrackingBusId(a.bus_id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: 16,
                            background: "var(--surface-2)",
                            cursor: "pointer",
                          }}
                          className="hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: "var(--primary)",
                                color: "var(--on-primary)",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 800,
                                fontSize: 16,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {a.route_id}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>
                                {t.towards} {a.towards}
                              </div>
                              <div
                                className="text-caption text-mono"
                                style={{ color: "var(--text-muted)", margin: "2px 0 4px" }}
                              >
                                {a.reg_no} · {(a.distance_m / 1000).toFixed(1)} km {t.away} · {a.stops_away} stops
                              </div>
                              <Badge
                                occupancy={a.occupancy}
                                loadPct={a.load_pct}
                                label={a.occupancy === "Low" ? t.seatLikely : a.occupancy === "Moderate" ? t.seatFew : t.seatStanding}
                              />
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div className="text-display tabular-nums" style={{ fontSize: 26, margin: 0 }}>
                              {Math.round(a.eta_min)}
                              <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 2 }}>
                                {t.min}
                              </span>
                            </div>
                            <span
                              className="text-caption"
                              style={{
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 2,
                                marginTop: 2,
                              }}
                            >
                              Track <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* =========================================================================
            FLOATING PILL BOTTOM NAVIGATION (Detached Uber Style)
           ========================================================================= */}
        {viewMode === "home" && (
          <nav className="floating-bottom-nav" aria-label="Main Navigation">
            {[
              { id: "home", label: t.navHome, icon: Home, action: () => setViewMode("home") },
              { id: "services", label: t.navServices, icon: Compass, action: () => openStopTracker("cp") },
              { id: "activity", label: t.navActivity, icon: Clock, action: () => openStopTracker("ndls") },
              {
                id: "account",
                label: t.navAccount,
                icon: User,
                action: () => {
                  setLang(lang === "en" ? "hi" : "en");
                  flashToast(lang === "en" ? "भाषा बदलकर हिंदी कर दी गई है" : "Language set to English");
                },
              },
            ].map((nav) => {
              const isActive = activeNav === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveNav(nav.id as any);
                    nav.action();
                  }}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <nav.icon size={19} />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Live Alerts Bottom Sheet */}
        {alertsSheetOpen && (
          <div
            className="dialog-backdrop"
            onClick={() => setAlertsSheetOpen(false)}
          >
            <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={20} style={{ color: "var(--accent-red)" }} />
                  <b className="text-title" style={{ fontSize: 18 }}>
                    {t.alertsTitle}
                  </b>
                </div>
                <button onClick={() => setAlertsSheetOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {alerts.length === 0 && (
                  <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                    {t.allClear}
                  </p>
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
            </div>
          </div>
        )}

        {/* Emergency SOS Confirmation Dialog */}
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
                  {t.sosTitle}
                </b>
              </div>
              <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                {t.sosAsk}
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="btn-pill-secondary"
                  onClick={() => setSosModalOpen(false)}
                >
                  {t.sosCancel}
                </button>
                <button
                  className="btn-pill-primary"
                  style={{ background: "var(--accent-red)", color: "#fff" }}
                  onClick={handleConfirmSos}
                  autoFocus
                >
                  {t.sosConfirm}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Status Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
              background: "var(--primary)",
              color: "var(--on-primary)",
              padding: "10px 20px",
              borderRadius: 999,
              boxShadow: "var(--ring-elevated)",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
