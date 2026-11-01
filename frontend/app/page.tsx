"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BusMap from "../components/BusMap";
import { post, usePoll } from "../lib/api";
import { Alert, Arrival, Bus, OCC_COLOR, Route, Stop } from "../lib/types";

const T = {
  en: {
    search: "Search a bus stop",
    nearest: "Nearest stop",
    live: "LIVE",
    min: "min",
    away: "away",
    towards: "towards",
    seat: "Seat chance",
    popular: "Popular stops",
    none: "No buses on the way right now",
    sos: "SOS",
    sosAsk: "Send an emergency alert to the transport control room?",
    sosSent: "SOS sent. Help is being alerted.",
    Low: "Seats free",
    Moderate: "Moderate",
    High: "Crowded",
    arriving: "Arriving",
    full: "full",
    stop: "stop",
    stops: "stops",
  },
  hi: {
    search: "बस स्टॉप खोजें",
    nearest: "नज़दीकी स्टॉप",
    live: "लाइव",
    min: "मिनट",
    away: "दूर",
    towards: "की ओर",
    seat: "सीट की संभावना",
    popular: "प्रमुख स्टॉप",
    none: "अभी कोई बस रास्ते में नहीं है",
    sos: "SOS",
    sosAsk: "क्या आप कंट्रोल रूम को आपातकालीन अलर्ट भेजना चाहते हैं?",
    sosSent: "SOS भेज दिया गया है। सहायता भेजी जा रही है।",
    Low: "सीट खाली",
    Moderate: "मध्यम",
    High: "भीड़",
    arriving: "आ रही है",
    full: "भरी",
    stop: "स्टॉप",
    stops: "स्टॉप",
  },
};

function km(a: Stop, lat: number, lng: number) {
  const p = Math.PI / 180;
  const x =
    Math.sin(((lat - a.lat) * p) / 2) ** 2 +
    Math.cos(a.lat * p) * Math.cos(lat * p) * Math.sin(((lng - a.lng) * p) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

export default function Passenger() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const t = T[lang];

  const routes = usePoll<Route[]>("/routes", 60000) ?? [];
  const stops = usePoll<Stop[]>("/stops", 60000) ?? [];
  const buses = usePoll<Bus[]>("/buses/live", 1000) ?? [];
  const alerts = usePoll<Alert[]>("/alerts", 3000) ?? [];
  const arrivals = usePoll<Arrival[]>(sel ? `/stops/${sel}/arrivals` : null, 1500) ?? [];

  const stop = stops.find((s) => s.id === sel);
  const name = (s: Stop) => (lang === "hi" ? s.name_hi : s.name);

  const hits = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n
      ? stops
          .filter((s) => s.name.toLowerCase().includes(n) || s.name_hi.includes(n))
          .slice(0, 5)
      : [];
  }, [q, stops]);

  const popular = stops.filter((s) =>
    ["cp", "ndls", "kashmere_gate", "nehru_place", "aiims"].includes(s.id)
  );

  const toast = alerts.find((a) => !dismissed.includes(a.id) && a.type !== "bunching");
  const routeColor = (id: string) => routes.find((r) => r.id === id)?.color ?? "#2563eb";

  function pick(id: string) {
    setSel(id);
    setQ("");
  }

  function findNearest() {
    const fallback = () => pick("cp");
    if (typeof navigator === "undefined" || !navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const best = [...stops].sort(
          (a, b) =>
            km(a, p.coords.latitude, p.coords.longitude) -
            km(b, p.coords.latitude, p.coords.longitude)
        )[0];
        if (best) pick(best.id);
      },
      fallback,
      { timeout: 5000 }
    );
  }

  async function sos() {
    if (!window.confirm(t.sosAsk)) return;
    await post("/ingest/incident", {
      kind: "sos",
      note: `Passenger SOS${stop ? " near " + stop.name : ""}`,
    });
    setNote(t.sosSent);
    setTimeout(() => setNote(""), 5000);
  }

  return (
    <div className="fill">
      <BusMap
        routes={routes}
        buses={buses}
        stops={stops}
        selectedStop={sel}
        onStopClick={pick}
        lang={lang}
      />

      <div className="search glass">
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={"  " + t.search}
          />
          <button
            className="pill"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
        </div>
        {hits.length > 0 && (
          <div className="suggest">
            {hits.map((s) => (
              <button key={s.id} onClick={() => pick(s.id)}>
                {name(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {(note || toast) && (
        <div
          className={"toast glass " + (note ? "info" : toast?.severity)}
          onClick={() => toast && setDismissed([...dismissed, toast.id])}
        >
          {note || toast?.message}
        </div>
      )}

      <button
        className="fab"
        style={{ bottom: 250 }}
        onClick={findNearest}
        title={t.nearest}
      >
        📍
      </button>
      <button className="fab sos" style={{ bottom: 190 }} onClick={sos}>
        {t.sos}
      </button>

      <div
        style={{ position: "fixed", left: 12, bottom: 250, zIndex: 18 }}
        className="pill"
      >
        <span className="dot-live" />
        {t.live} · {buses.length}
      </div>

      <Link
        href="/admin"
        style={{ position: "fixed", left: 12, bottom: 296, zIndex: 18 }}
        className="pill"
      >
        Admin ↗
      </Link>

      <div className="sheet">
        <div className="grab" />
        {!stop && (
          <>
            <b>{t.popular}</b>
            {popular.map((s) => (
              <div
                className="row"
                key={s.id}
                onClick={() => pick(s.id)}
                style={{ cursor: "pointer" }}
              >
                <span>{name(s)}</span>
                <span className="muted">
                  {s.routes?.map((r) => "Route " + r).join(" · ")}
                </span>
              </div>
            ))}
          </>
        )}

        {stop && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <b style={{ fontSize: 20 }}>{name(stop)}</b>
              <button
                onClick={() => setSel(null)}
                style={{
                  background: "transparent",
                  fontSize: 20,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                }}
                className="hover:bg-slate-100 active:scale-[0.96] transition-transform"
                aria-label="Close arrivals sheet"
              >
                ✕
              </button>
            </div>
            {arrivals.length === 0 && <p className="muted">{t.none}</p>}
            {arrivals.map((a) => (
              <div className="row" key={a.bus_id + a.towards}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span
                    className="chip"
                    style={{ background: routeColor(a.route_id) }}
                  >
                    {a.route_id}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {t.towards} {a.towards}
                    </div>
                    <div className="muted">
                      {a.reg_no} · {(a.distance_m / 1000).toFixed(1)} km {t.away} ·{" "}
                      {a.stops_away} {a.stops_away === 1 ? t.stop : t.stops}
                    </div>
                    <span
                      className="badge"
                      style={{ background: OCC_COLOR[a.occupancy] }}
                    >
                      {t[a.occupancy]} · {a.load_pct}% {t.full}
                    </span>{" "}
                    <span className="muted">
                      {t.seat} {Math.round(a.seat_prob * 100)}%
                    </span>
                  </div>
                </div>
                <div className="eta">
                  {a.eta_min < 0.6 ? (
                    t.arriving
                  ) : (
                    <>
                      {Math.round(a.eta_min)}
                      <small> {t.min}</small>
                    </>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
