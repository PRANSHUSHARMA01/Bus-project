"use client";

import React, { useState } from "react";
import { Sheet } from "./Sheet";
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  Search,
  Check,
  Footprints,
  ChevronRight,
  Globe
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

interface NearestStop {
  stop_id: string;
  name: string;
  name_hi: string;
  lat: number;
  lng: number;
  distance_m: number;
  walking_min: number;
  active_routes: string[];
}

interface LocationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStop: (stopId: string) => void;
  onOpenSearch: () => void;
  selectedStopId?: string;
  lang?: "en" | "hi";
}

export function LocationSheet({
  isOpen,
  onClose,
  onSelectStop,
  onOpenSearch,
  selectedStopId,
  lang = "en",
}: LocationSheetProps) {
  const [geoState, setGeoState] = useState<"idle" | "requesting" | "denied" | "granted">("idle");
  const [nearestStops, setNearestStops] = useState<NearestStop[]>([]);
  const [isOutsideNcr, setIsOutsideNcr] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const requestGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("denied");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGeoState("requesting");
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(`${BACKEND_URL}/v1/stops/nearest?lat=${lat}&lng=${lng}&limit=6`);
          if (res.ok) {
            const data = await res.json();
            setNearestStops(data.stops || []);
            setIsOutsideNcr(!data.in_delhi_ncr);
            setGeoState("granted");
          } else {
            throw new Error("Failed to compute nearest stops");
          }
        } catch (e) {
          // Fallback to Connaught Place default stops
          fetchConnaughtPlaceStops();
        }
      },
      (err) => {
        setGeoState("denied");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg(
            lang === "hi"
              ? "स्थान अनुमति अस्वीकृत है। ऊपर से अपना स्टॉप खोजें या ब्राउज़र सेटिंग्स में जीपीएस सक्षम करें।"
              : "Location access is turned off. Search for your stop above, or enable location in your browser settings."
          );
        } else {
          setErrorMsg(
            lang === "hi"
              ? "जीपीएस सिग्नल प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।"
              : "Unable to retrieve your GPS location. Please check your signal and try again."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const fetchConnaughtPlaceStops = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/v1/stops/nearest?lat=28.6315&lng=77.2167&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setNearestStops(data.stops || []);
        setIsOutsideNcr(true);
        setGeoState("granted");
      }
    } catch {}
  };

  const formatDistance = (m: number) => {
    if (m < 1000) return `${m} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={lang === "hi" ? "स्थान एवं नज़दीकी स्टॉप" : "Find stops near you"}
      icon={<MapPin size={20} style={{ color: "var(--accent)" }} />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* State 1 & 2: Prompt / Trigger GPS */}
        {geoState !== "granted" && (
          <button
            onClick={requestGps}
            disabled={geoState === "requesting"}
            className="btn-pill-primary"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: geoState === "requesting" ? "wait" : "pointer"
            }}
          >
            <Navigation size={18} />
            <span>
              {geoState === "requesting"
                ? lang === "hi" ? "जीपीएस से खोज रहे हैं..." : "Finding your location..."
                : lang === "hi" ? "वर्तमान जीपीएस स्थान का उपयोग करें" : "Use current GPS location"}
            </span>
          </button>
        )}

        {/* State: Permission Denied */}
        {geoState === "denied" && (
          <div style={{
            padding: 16,
            borderRadius: 14,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <AlertCircle size={20} style={{ color: "var(--crowd-mod)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>
                {errorMsg}
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              style={{
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer"
              }}
            >
              <Search size={14} />
              <span>{lang === "hi" ? "स्टॉप मैन्युअल रूप से खोजें" : "Search stop manually"}</span>
            </button>
          </div>
        )}

        {/* State: Granted & Outside Delhi NCR Banner */}
        {geoState === "granted" && isOutsideNcr && (
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid var(--crowd-mod)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Globe size={18} style={{ color: "var(--crowd-mod)", flexShrink: 0 }} />
              <span>
                {lang === "hi"
                  ? "आप दिल्ली एनसीआर के बाहर हैं। कनाट प्लेस के स्टॉप दिखाए जा रहे हैं।"
                  : "You look outside Delhi NCR. Showing Connaught Place stops."}
              </span>
            </div>
            <button
              onClick={fetchConnaughtPlaceStops}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Delhi Center
            </button>
          </div>
        )}

        {/* State: Granted Nearest Stops List */}
        {geoState === "granted" && nearestStops.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="text-caption" style={{ fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              {lang === "hi" ? "नज़दीकी बस स्टॉप (दूरी एवं पैदल चलने का समय)" : "Nearest stops (Distance & walking time)"}
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {nearestStops.map((st) => {
                const isSelected = st.stop_id === selectedStopId;
                return (
                  <button
                    key={st.stop_id}
                    onClick={() => {
                      onSelectStop(st.stop_id);
                      onClose();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: isSelected ? "var(--surface-2)" : "var(--surface)",
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 150ms ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isSelected ? "var(--accent)" : "var(--surface-3)",
                        color: isSelected ? "var(--on-accent)" : "var(--text)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0
                      }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>
                          {lang === "hi" ? st.name_hi || st.name : st.name}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 2
                        }}>
                          <span style={{ fontWeight: 600, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                            {formatDistance(st.distance_m)}
                          </span>
                          <span>·</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontVariantNumeric: "tabular-nums" }}>
                            <Footprints size={12} /> {st.walking_min} min walk
                          </span>
                        </div>
                        {st.active_routes && st.active_routes.length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                            {st.active_routes.slice(0, 4).map((r) => (
                              <span
                                key={r}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  background: "var(--surface-3)",
                                  color: "var(--text-muted)"
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected ? (
                      <Check size={18} style={{ color: "var(--accent)" }} />
                    ) : (
                      <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual search alternative */}
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span className="text-caption" style={{ color: "var(--text-muted)" }}>
            {lang === "hi" ? "अन्य स्टॉप खोजना चाहते हैं?" : "Looking for another stop?"}
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <Search size={14} />
            <span>{lang === "hi" ? "खोजें" : "Search"}</span>
          </button>
        </div>
      </div>
    </Sheet>
  );
}
