"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Languages,
  MapPin,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  Users,
  X,
} from "lucide-react";
import BusMap from "../components/BusMap";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { post, usePoll } from "../lib/api";
import { Alert, Arrival, Bus, OCC_COLOR, Route, Stop } from "../lib/types";

// Microcopy dictionaries with full sentence-case and Hindi translations (Sections 1.2 & 1.9)
const T = {
  en: {
    search: "Search for a bus stop or landmark…",
    nearest: "Nearest stop",
    live: "LIVE",
    min: "min",
    away: "away",
    towards: "towards",
    seat: "Likely to get a seat",
    seatFew: "Few seats remaining",
    seatNone: "Standing room only",
    popular: "Major transit stops",
    none: "No buses on this stop right now. Try a nearby stop.",
    showNearby: "Show nearby stops",
    sos: "SOS",
    sosTitle: "Emergency control room alert",
    sosAsk: "Send an emergency alert to the Delhi Transport Command Centre?",
    sosConfirm: "Send alert",
    sosCancel: "Cancel",
    sosSent: "Emergency alert sent. Delhi Transport Command Centre has been notified.",
    stopsAway: "stops away",
    stopAway: "stop away",
    arriving: "Arriving now",
    full: "full",
    backToList: "← Back to arrivals",
    progressTitle: "Live trip progress",
    passed: "Passed",
    nextStop: "Next stop",
    destination: "Terminus",
    themeToggle: "Toggle dark mode",
    langToggle: "Switch language",
    adminLink: "Admin HQ",
    conductorLink: "Conductor",
    offlineNotice: "Cannot reach bus telemetry feed. Retrying connection…",
    Low: "Seats free",
    Moderate: "Getting full",
    High: "Standing room only",
  },
  hi: {
    search: "बस स्टॉप या स्थान खोजें…",
    nearest: "नज़दीकी स्टॉप",
    live: "लाइव",
    min: "मिनट",
    away: "दूर",
    towards: "की ओर",
    seat: "सीट मिलने की संभावना है",
    seatFew: "कुछ ही सीटें बची हैं",
    seatNone: "केवल खड़े रहने की जगह",
    popular: "प्रमुख बस स्टॉप",
    none: "इस स्टॉप पर अभी कोई बस नहीं आ रही है। नज़दीकी स्टॉप देखें।",
    showNearby: "नज़दीकी स्टॉप दिखाएं",
    sos: "SOS",
    sosTitle: "आपातकालीन नियंत्रण कक्ष अलर्ट",
    sosAsk: "क्या आप दिल्ली परिवहन कमांड सेंटर को आपातकालीन अलर्ट भेजना चाहते हैं?",
    sosConfirm: "अलर्ट भेजें",
    sosCancel: "रद्द करें",
    sosSent: "आपातकालीन अलर्ट भेज दिया गया है। सहायता टीम को सूचित कर दिया गया है।",
    stopsAway: "स्टॉप दूर",
    stopAway: "स्टॉप दूर",
    arriving: "अभी पहुंच रही है",
    full: "भरी हुई",
    backToList: "← वापस आगमन सूची पर",
    progressTitle: "लाइव यात्रा प्रगति",
    passed: "गुज़र चुकी है",
    nextStop: "अगला स्टॉप",
    destination: "अंतिम स्टॉप",
    themeToggle: "डार्क मोड बदलें",
    langToggle: "भाषा बदलें",
    adminLink: "प्रशासन",
    conductorLink: "कंडक्टर",
    offlineNotice: "सर्वर से संपर्क नहीं हो पा रहा है। पुनः प्रयास जारी है…",
    Low: "सीट खाली",
    Moderate: "भर रही है",
    High: "केवल खड़े रहने की जगह",
  },
};

function calculateKm(a: Stop, lat: number, lng: number) {
  const p = Math.PI / 180;
  const x =
    Math.sin(((lat - a.lat) * p) / 2) ** 2 +
    Math.cos(a.lat * p) * Math.cos(lat * p) * Math.sin(((lng - a.lng) * p) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

export default function PassengerPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStopId, setSelectedStopId] = useState<string | null>("cp");
  const [trackingBusId, setTrackingBusId] = useState<number | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sheetSnap, setSheetSnap] = useState<"peek" | "half" | "full">("half");

  const t = T[lang];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync data-theme attribute on root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle ESC key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sosModalOpen) setSosModalOpen(false);
        if (trackingBusId) setTrackingBusId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sosModalOpen, trackingBusId]);

  // Polling data hooks
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

  const stopDisplayName = (s: Stop) => (lang === "hi" ? s.name_hi : s.name);

  // Filtered stops for search autocomplete
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return stops
      .filter((s) => s.name.toLowerCase().includes(q) || s.name_hi.includes(q))
      .slice(0, 5);
  }, [searchQuery, stops]);

  const popularStops = useMemo(
    () => stops.filter((s) => ["cp", "ndls", "kashmere_gate", "nehru_place", "aiims"].includes(s.id)),
    [stops]
  );

  const activeToastAlert = alerts.find(
    (a) => !dismissedAlerts.includes(a.id) && a.type !== "bunching"
  );

  const getRouteColor = (id: string) => routes.find((r) => r.id === id)?.color ?? "#2563eb";

  function handlePickStop(id: string) {
    setSelectedStopId(id);
    setTrackingBusId(null);
    setSearchQuery("");
    setSheetSnap("half");
  }

  function handleLocateNearest() {
    const fallback = () => handlePickStop("cp");
    if (typeof navigator === "undefined" || !navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const sorted = [...stops].sort(
          (a, b) =>
            calculateKm(a, pos.coords.latitude, pos.coords.longitude) -
            calculateKm(b, pos.coords.latitude, pos.coords.longitude)
        );
        if (sorted[0]) handlePickStop(sorted[0].id);
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
      setToastMessage(t.sosSent);
      setTimeout(() => setToastMessage(null), 6000);
    } catch {
      setToastMessage("Failed to connect to control room. Please dial emergency services.");
      setTimeout(() => setToastMessage(null), 6000);
    }
  }

  // Determine seat probability copy
  function getSeatProbabilityText(prob: number) {
    if (prob >= 0.7) return t.seat;
    if (prob >= 0.4) return t.seatFew;
    return t.seatNone;
  }

  return (
    <div className="fill" style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* MapLibre Map Canvas with smooth 60fps Lerp */}
      <BusMap
        routes={routes}
        buses={buses}
        stops={stops}
        selectedStop={selectedStopId}
        selectedBusId={trackingBusId}
        onStopClick={handlePickStop}
        onBusClick={(bus) => {
          setTrackingBusId(bus.bus_id);
          setSheetSnap("half");
        }}
        mapStyle={
          theme === "dark"
            ? "https://tiles.openfreemap.org/styles/dark"
            : "https://tiles.openfreemap.org/styles/liberty"
        }
        lang={lang}
      />

      {/* Floating Top Header (Search, Language, Dark Mode) */}
      <header
        className="glass"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          right: 14,
          maxWidth: 580,
          margin: "0 auto",
          zIndex: 25,
          padding: 8,
          borderRadius: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              background: "var(--surface)",
              borderRadius: 14,
              padding: "0 12px",
              boxShadow: "var(--ring)",
            }}
          >
            <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                fontSize: 16,
                padding: "12px 10px",
                color: "var(--text)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search input"
                className="btn"
                style={{ padding: 4, minHeight: 32 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Language Toggle with AnimatePresence */}
          <button
            className="pill"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            title={t.langToggle}
            aria-label={t.langToggle}
            style={{ padding: "6px 12px", minHeight: 44 }}
          >
            <Languages size={15} style={{ color: "var(--accent)" }} aria-hidden="true" />
            <span style={{ fontWeight: 700 }}>{lang === "en" ? "हिं" : "EN"}</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            className="pill"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={t.themeToggle}
            aria-label={t.themeToggle}
            style={{ padding: "6px 12px", minHeight: 44 }}
          >
            {theme === "light" ? (
              <Moon size={16} style={{ color: "var(--text-muted)" }} />
            ) : (
              <Sun size={16} style={{ color: "var(--amber-600)" }} />
            )}
          </button>
        </div>

        {/* Autocomplete Suggestion Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: 8,
              background: "var(--surface)",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "var(--ring)",
            }}
          >
            {searchResults.map((s) => (
              <button
                key={s.id}
                onClick={() => handlePickStop(s.id)}
                className="btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontWeight: 600 }}>{stopDisplayName(s)}</span>
                <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                  {s.routes?.map((r) => `Route ${r}`).join(" · ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Real-time Alert Toast Notification */}
      <AnimatePresence>
        {(toastMessage || activeToastAlert) && (
          <motion.div
            initial={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role={toastMessage || activeToastAlert?.severity === "critical" ? "alert" : "status"}
            aria-live="polite"
            className="glass"
            style={{
              position: "fixed",
              top: 84,
              left: 14,
              right: 14,
              maxWidth: 580,
              margin: "0 auto",
              zIndex: 24,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderRadius: 16,
              background:
                activeToastAlert?.severity === "critical"
                  ? "oklch(0.55 0.2 27 / 0.15)"
                  : activeToastAlert?.severity === "warning"
                  ? "oklch(0.65 0.16 70 / 0.15)"
                  : "var(--surface)",
              border:
                activeToastAlert?.severity === "critical"
                  ? "1px solid var(--red-600)"
                  : "1px solid var(--border-glass)",
            }}
            onClick={() => activeToastAlert && setDismissedAlerts([...dismissedAlerts, activeToastAlert.id])}
          >
            <AlertTriangle
              size={18}
              style={{
                color:
                  activeToastAlert?.severity === "critical"
                    ? "var(--red-600)"
                    : activeToastAlert?.severity === "warning"
                    ? "var(--amber-600)"
                    : "var(--accent)",
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
              {toastMessage || activeToastAlert?.message}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (toastMessage) setToastMessage(null);
                else if (activeToastAlert) setDismissedAlerts([...dismissedAlerts, activeToastAlert.id]);
              }}
              style={{ padding: 4, minHeight: 32 }}
              aria-label="Dismiss alert"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <button
        className="fab"
        style={{ bottom: 270 }}
        onClick={handleLocateNearest}
        title={t.nearest}
        aria-label={t.nearest}
      >
        <MapPin size={22} style={{ color: "var(--accent)" }} />
      </button>

      <button
        className="fab sos"
        style={{ bottom: 206 }}
        onClick={() => setSosModalOpen(true)}
        title={t.sos}
        aria-label="Open emergency SOS alert dialog"
      >
        <ShieldAlert size={22} />
      </button>

      {/* Floating Live Fleet Badge */}
      <div
        className="pill"
        style={{
          position: "fixed",
          left: 14,
          bottom: 270,
          zIndex: 20,
        }}
        aria-live="polite"
      >
        <span className="dot-live" />
        <span className="text-caption" style={{ fontWeight: 700 }}>
          {t.live} · {buses.length} buses
        </span>
      </div>

      <div
        style={{
          position: "fixed",
          left: 14,
          bottom: 216,
          zIndex: 20,
          display: "flex",
          gap: 6,
        }}
      >
        <Link href="/conductor" className="pill" style={{ padding: "6px 12px", fontSize: 12 }}>
          {t.conductorLink} ↗
        </Link>
        <Link href="/admin" className="pill" style={{ padding: "6px 12px", fontSize: 12 }}>
          {t.adminLink} ↗
        </Link>
      </div>

      {/* Zomato-Style Draggable Bottom Sheet */}
      <section
        className="sheet safe-bottom"
        style={{
          height: sheetSnap === "peek" ? "22vh" : sheetSnap === "full" ? "88vh" : "54vh",
        }}
        aria-label="Arrivals and tracking sheet"
      >
        {/* Sheet drag bar */}
        <div
          className="sheet-grab"
          onClick={() =>
            setSheetSnap(sheetSnap === "peek" ? "half" : sheetSnap === "half" ? "full" : "peek")
          }
          title="Drag or tap to adjust sheet height"
        />

        {/* VIEW A: TRACKING A SPECIFIC BUS (Zomato-style delivery progress timeline) */}
        {trackingBus && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button
                className="btn"
                onClick={() => setTrackingBusId(null)}
                style={{ padding: "6px 10px", fontSize: 13, background: "var(--surface-muted)" }}
              >
                {t.backToList}
              </button>
              <span
                className="chip"
                style={{ background: getRouteColor(trackingBus.route_id) }}
              >
                {trackingBus.route_id}
              </span>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                background: "var(--surface-muted)",
              }}
            >
              <div>
                <span className="text-caption text-mono" style={{ color: "var(--text-muted)" }}>
                  {trackingBus.reg_no}
                </span>
                <div className="text-heading" style={{ marginTop: 2 }}>
                  {t.towards} {trackingBus.towards}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <Badge occupancy={trackingBus.occupancy} loadPct={trackingBus.load_pct} label={t[trackingBus.occupancy]} />
                  <span className="text-caption tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {trackingBus.speed_kmh} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* Stop sequence timeline */}
            <div style={{ marginTop: 8 }}>
              <b className="text-heading" style={{ display: "block", marginBottom: 12 }}>
                {t.progressTitle}
              </b>
              <div className="timeline">
                {trackingRoute?.stops.map((st, idx) => {
                  const isCurrent = st.id === selectedStopId;
                  const isPassed = false; // Based on progress
                  return (
                    <div
                      key={st.id}
                      className={`timeline-step ${isPassed ? "passed" : isCurrent ? "current" : "upcoming"}`}
                    >
                      <div className="timeline-dot">
                        {isCurrent ? "●" : idx + 1}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 15 }}>
                          {stopDisplayName(st)}
                        </span>
                        {isCurrent && (
                          <span className="badge" style={{ background: "var(--accent)", fontSize: 11 }}>
                            {t.nextStop}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: ARRIVALS AT SELECTED STOP */}
        {!trackingBus && selectedStop && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <span className="text-caption" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  BUS STOP
                </span>
                <h1 className="text-title" style={{ margin: "2px 0 0" }}>
                  {stopDisplayName(selectedStop)}
                </h1>
              </div>
              <button
                onClick={() => setSelectedStopId(null)}
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "var(--surface-muted)",
                }}
                aria-label="Close arrivals list"
              >
                <X size={18} />
              </button>
            </div>

            {/* Skeletons while loading */}
            {arrivals === null && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Skeleton height={80} borderRadius={16} />
                <Skeleton height={80} borderRadius={16} />
              </div>
            )}

            {/* Empty State */}
            {arrivals !== null && arrivals.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <p className="text-body" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                  {t.none}
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedStopId(null)}
                >
                  {t.showNearby}
                </button>
              </div>
            )}

            {/* Staggered Animated Arrival Rows */}
            {arrivals && arrivals.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {arrivals.map((a, i) => (
                  <motion.div
                    key={a.bus_id + a.towards}
                    initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
                    className="card"
                    onClick={() => {
                      setTrackingBusId(a.bus_id);
                      setSheetSnap("half");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <span
                        className="chip"
                        style={{ background: getRouteColor(a.route_id) }}
                      >
                        {a.route_id}
                      </span>
                      <div>
                        <div className="text-heading" style={{ fontSize: 15, fontWeight: 700 }}>
                          {t.towards} {a.towards}
                        </div>
                        <div className="text-caption text-mono" style={{ color: "var(--text-muted)", margin: "2px 0 6px" }}>
                          {a.reg_no} · {(a.distance_m / 1000).toFixed(1)} km {t.away} · {a.stops_away}{" "}
                          {a.stops_away === 1 ? t.stopAway : t.stopsAway}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Badge
                            occupancy={a.occupancy}
                            loadPct={a.load_pct}
                            label={t[a.occupancy]}
                          />
                          <span className="text-caption" style={{ color: "var(--text-dim)" }}>
                            {getSeatProbabilityText(a.seat_prob)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Huge Display ETA */}
                    <div style={{ textAlign: "right" }}>
                      {a.eta_min < 0.6 ? (
                        <span
                          className="badge"
                          style={{ background: "var(--crowd-low)", fontSize: 13, padding: "6px 12px" }}
                        >
                          {t.arriving}
                        </span>
                      ) : (
                        <div className="text-display tabular-nums" style={{ color: "var(--accent)" }}>
                          {Math.round(a.eta_min)}
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginLeft: 2 }}>
                            {t.min}
                          </span>
                        </div>
                      )}
                      <span className="text-caption" style={{ color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 4 }}>
                        Track <ArrowRight size={13} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW C: POPULAR STOPS LIST (When no stop is selected) */}
        {!trackingBus && !selectedStop && (
          <div>
            <h2 className="text-title" style={{ marginBottom: 12 }}>
              {t.popular}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {popularStops.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handlePickStop(s.id)}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    textAlign: "left",
                    padding: "14px 18px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{stopDisplayName(s)}</div>
                    <div className="text-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                      {s.routes?.map((r) => `Route ${r}`).join(" · ")}
                    </div>
                  </div>
                  <ArrowRight size={18} style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Accessible Emergency SOS Modal Dialog */}
      <AnimatePresence>
        {sosModalOpen && (
          <div
            className="dialog-backdrop"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sos-title"
            aria-describedby="sos-desc"
            onClick={() => setSosModalOpen(false)}
          >
            <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <ShieldAlert size={28} style={{ color: "var(--red-600)" }} />
                <h2 id="sos-title" className="text-title" style={{ margin: 0 }}>
                  {t.sosTitle}
                </h2>
              </div>
              <p id="sos-desc" className="text-body" style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                {t.sosAsk}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSosModalOpen(false)}
                  style={{ minWidth: 100 }}
                >
                  {t.sosCancel}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmSos}
                  style={{ minWidth: 120 }}
                  autoFocus
                >
                  {t.sosConfirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
