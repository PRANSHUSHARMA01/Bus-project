"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// True Isometric Projection Engine (Section 2)
// +x = forward along road (falls 30° down-right: slope = +0.57735)
// +y = left side of bus / kerb side in India (falls 30° down-left: slope = -0.57735)
// +z = vertical up (slope = vertical)
const C = Math.cos(Math.PI / 6); // 0.8660254037844386
const S = Math.sin(Math.PI / 6); // 0.5
const U = 17.5; // 17.5 px per meter
const OX = 260; // screen center X
const OY = 165; // screen center Y

export const iso = (x: number, y: number, z: number, u = U, ox = OX, oy = OY): [number, number] => {
  return [
    Math.round((ox + (x - y) * C * u) * 10) / 10,
    Math.round((oy + (x + y) * S * u - z * u) * 10) / 10,
  ];
};

const face = (pts: [number, number, number][], u = U, ox = OX, oy = OY) =>
  pts.map((p) => iso(p[0], p[1], p[2], u, ox, oy).join(",")).join(" ");

interface MovingBusProps {
  speedMultiplier?: number;
  compact?: boolean;
}

export function MovingBus({ compact = false }: MovingBusProps) {
  const [speed, setSpeed] = useState(32); // km/h
  const [phase, setPhase] = useState<"cruising" | "stopping" | "stopped" | "accelerating">("cruising");
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState(17);
  const totalSeats = 35;
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reduced motion and tab visibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsReducedMotion(mq.matches);
      if (mq.matches) {
        setDoorsOpen(true);
        setSpeed(0);
        setPhase("stopped");
      }
      const listener = (e: MediaQueryListEvent) => {
        setIsReducedMotion(e.matches);
        if (e.matches) {
          setDoorsOpen(true);
          setSpeed(0);
          setPhase("stopped");
        }
      };
      mq.addEventListener("change", listener);

      const handleVisibility = () => setIsPaused(document.hidden);
      document.addEventListener("visibilitychange", handleVisibility);

      const observer = new IntersectionObserver(
        ([entry]) => setIsPaused(!entry.isIntersecting),
        { threshold: 0.1 }
      );
      if (containerRef.current) observer.observe(containerRef.current);

      return () => {
        mq.removeEventListener("change", listener);
        document.removeEventListener("visibilitychange", handleVisibility);
        observer.disconnect();
      };
    }
  }, []);

  // 9-second stop cycle: cruise -> decelerate -> stop -> board -> accelerate
  useEffect(() => {
    if (isReducedMotion || isPaused) return;

    let timer: NodeJS.Timeout;
    const cycle = () => {
      setPhase("stopping");
      setSpeed(12);

      timer = setTimeout(() => {
        setPhase("stopped");
        setSpeed(0);
        setDoorsOpen(true);

        setTimeout(() => {
          setOccupiedSeats((prev) => (prev >= 32 ? 14 : prev + 3));
        }, 750);

        setTimeout(() => {
          setDoorsOpen(false);
          setPhase("accelerating");
          setSpeed(18);

          setTimeout(() => {
            setPhase("cruising");
            setSpeed(32);
          }, 1100);
        }, 2500);
      }, 950);
    };

    const interval = setInterval(cycle, 9000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isReducedMotion, isPaused]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setDoorsOpen((prev) => !prev);
        setSpeed((s) => (s > 0 ? 0 : 32));
        setPhase((p) => (p === "stopped" ? "cruising" : "stopped"));
      } else if (e.key === "ArrowRight") {
        setSpeed((s) => Math.min(45, s + 5));
      } else if (e.key === "ArrowLeft") {
        setSpeed((s) => Math.max(0, s - 5));
      }
    },
    []
  );

  const toggleDoors = () => {
    if (doorsOpen) {
      setDoorsOpen(false);
      setSpeed(32);
      setPhase("cruising");
    } else {
      setDoorsOpen(true);
      setSpeed(0);
      setPhase("stopped");
      setOccupiedSeats((s) => (s < 32 ? s + 2 : 14));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX !== null) {
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 10) {
        const newSpeed = Math.max(0, Math.min(45, Math.round(speed + delta * 0.2)));
        setSpeed(newSpeed);
        setDragStartX(e.clientX);
        if (newSpeed === 0) {
          setDoorsOpen(true);
          setPhase("stopped");
        } else {
          setDoorsOpen(false);
          setPhase("cruising");
        }
      }
    }
  };

  const handlePointerUp = () => setDragStartX(null);

  const loadPercent = Math.round((occupiedSeats / totalSeats) * 100);

  // Geometric Bus Dimensions (Meters):
  // Length: 11.6m (x: -5.8 to +5.8)
  // Width: 2.5m (y: -1.25 to +1.25, where +y is kerb side)
  // Height: 3.1m (z: 0.35 floor to 3.1 roof)
  const bx0 = -5.8, bx1 = 5.8;
  const by0 = -1.25, by1 = 1.25;
  const bzFloor = 0.35, bzRoof = 3.1;

  // Axles:
  const rearAxleX = -3.2;
  const frontAxleX = 3.8;

  // Edge-to-edge road & sidewalk planes (running fully past SVG bounds)
  const roadTop = face([[-24, -5.5, 0], [24, -5.5, 0], [24, 1.8, 0], [-24, 1.8, 0]]);
  const roadSide = face([[-24, 1.8, 0], [24, 1.8, 0], [24, 1.8, -0.4], [-24, 1.8, -0.4]]);
  const kerbBevel = face([[-24, 1.8, 0], [24, 1.8, 0], [24, 1.8, 0.2], [-24, 1.8, 0.2]]);
  const footpathTop = face([[-24, 1.8, 0.2], [24, 1.8, 0.2], [24, 5.2, 0.2], [-24, 5.2, 0.2]]);

  // Ground contact shadow: body footprint offset by (+x 0.5, -y 0.7) at z = 0
  const castShadow = face([
    [bx0 + 0.5, by1 - 0.7, 0],
    [bx1 + 0.5, by1 - 0.7, 0],
    [bx1 + 0.5, by0 - 0.7, 0],
    [bx0 + 0.5, by0 - 0.7, 0],
  ]);

  // Main solid faces of bus
  const bodyTop = face([[bx0, by0, bzRoof], [bx1, by0, bzRoof], [bx1, by1, bzRoof], [bx0, by1, bzRoof]]);
  const bodySide = face([[bx0, by1, bzFloor], [bx1, by1, bzFloor], [bx1, by1, bzRoof], [bx0, by1, bzRoof]]);
  const bodyFront = face([[bx1, by0, bzFloor], [bx1, by1, bzFloor], [bx1, by1, bzRoof], [bx1, by0, bzRoof]]);

  // Front bumper (z = 0.35 to 0.58)
  const bumperFront = face([[bx1 + 0.08, by0 - 0.02, 0.35], [bx1 + 0.08, by1 + 0.02, 0.35], [bx1 + 0.08, by1 + 0.02, 0.58], [bx1 + 0.08, by0 - 0.02, 0.58]]);
  const bumperTop = face([[bx1, by0 - 0.02, 0.58], [bx1 + 0.08, by0 - 0.02, 0.58], [bx1 + 0.08, by1 + 0.02, 0.58], [bx1, by1 + 0.02, 0.58]]);

  // Teal stripe along lower body (z = 0.58 to 0.88)
  const stripeSide = face([[bx0, by1, 0.58], [bx1, by1, 0.58], [bx1, by1, 0.88], [bx0, by1, 0.88]]);
  const stripeFront = face([[bx1, by0, 0.58], [bx1, by1, 0.58], [bx1, by1, 0.88], [bx1, by0, 0.88]]);

  // Front windscreen (aerodynamic rake: bottom at x = 5.80, top at x = 5.52, z: 1.05 to 2.58)
  const windscreen = face([[5.80, by0 + 0.15, 1.05], [5.80, by1 - 0.15, 1.05], [5.52, by1 - 0.15, 2.58], [5.52, by0 + 0.15, 2.58]]);
  const windscreenGlare = face([[5.76, by0 + 0.3, 1.15], [5.76, by0 + 0.7, 1.15], [5.54, by0 + 0.55, 2.48], [5.54, by0 + 0.15, 2.48]]);

  // Front Destination LED display box on front face above windscreen (x = 5.52, z = 2.65 to 3.0)
  const destBox = face([[5.52, by0 + 0.22, 2.65], [5.52, by1 - 0.22, 2.65], [5.52, by1 - 0.22, 3.0], [5.52, by0 + 0.22, 3.0]]);

  // Side Window Bays (5 bays with 0.2m pillars, sill z = 1.15, head z = 2.55)
  const windowBays = [
    { x0: -5.3, x1: -4.1, p: { name: "rear-rider", hasBag: true } },
    { x0: -3.9, x1: -2.7, p: null },
    { x0: -2.5, x1: -1.3, p: { name: "mid-rider", hasBag: false } },
    { x0: 0.5, x1: 1.7, p: null },
    { x0: 1.9, x1: 3.1, p: { name: "front-rider", hasBag: false } },
  ];

  // Doors on Kerb (+y) Side:
  // Rear door: x = -1.1 to 0.3
  // Front door: x = 3.3 to 4.7
  const doors = [
    { id: "rear-door", x0: -1.1, x1: 0.3 },
    { id: "front-door", x0: 3.3, x1: 4.7 },
  ];

  return (
    <div
      ref={containerRef}
      className="concentric-card"
      style={{
        width: "100%",
        background: "var(--surface)",
        borderRadius: 28, // Card radius 28 (art radius 20 + padding 8)
        boxShadow: "var(--ring)",
        border: "1px solid transparent",
        padding: 8,
        overflow: "hidden",
        position: "relative",
        containerType: "inline-size",
      }}
      role="region"
      aria-label="Interactive isometric Delhi electric bus figure"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 1. Full-Bleed Illustration Stage (art radius 20 inside card) */}
      <div
        onClick={toggleDoors}
        style={{
          width: "100%",
          aspectRatio: compact ? "16/10" : "6/5",
          maxHeight: compact ? 200 : 260,
          position: "relative",
          borderRadius: 20,
          background: "var(--surface-2)",
          overflow: "hidden",
          cursor: "pointer",
          touchAction: "none",
        }}
      >
        <svg
          viewBox="0 0 520 340"
          style={{ width: "100%", height: "100%", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* 4-Tone Shading & Semantic Palette */}
            <style>{`
              .sky-bg { fill: oklch(0.96 0.02 85); }
              .skyline-far { fill: oklch(0.88 0.02 260); }
              .skyline-mid { fill: oklch(0.80 0.03 260); }
              .skyline-near { fill: oklch(0.72 0.04 260); }
              
              .road-top { fill: oklch(0.30 0.01 260); }
              .road-edge { fill: oklch(0.22 0.01 260); }
              .footpath-top { fill: oklch(0.78 0.015 80); }
              .kerb-face { fill: oklch(0.65 0.015 80); }
              .markings { fill: oklch(0.95 0.03 90); }
              
              .bus-top { fill: oklch(0.88 0.15 75); stroke: oklch(0.20 0.02 260); stroke-width: 0.6; }
              .bus-side { fill: oklch(0.80 0.17 75); }
              .bus-front { fill: oklch(0.68 0.18 70); }
              .bus-trim { fill: oklch(0.20 0.02 260); }
              
              .stripe-side { fill: oklch(0.62 0.11 195); }
              .stripe-front { fill: oklch(0.50 0.12 195); }
              
              .window-glass { fill: oklch(0.92 0.04 235); stroke: oklch(0.20 0.02 260); stroke-width: 0.8; stroke-linejoin: round; }
              .window-glare { fill: oklch(0.98 0.01 235 / 0.7); }
              
              .wheel-tyre { fill: oklch(0.18 0.01 260); stroke: oklch(0.12 0.01 260); stroke-width: 0.6; }
              .wheel-hub { fill: oklch(0.55 0.02 260); }
              
              .shadow-cast { fill: oklch(0.18 0.01 260 / 0.35); }
              .shadow-contact { fill: oklch(0.10 0.01 260 / 0.75); }

              /* Dark theme overrides */
              [data-theme="dark"] .sky-bg { fill: oklch(0.16 0.02 260); }
              [data-theme="dark"] .skyline-far { fill: oklch(0.24 0.02 260); }
              [data-theme="dark"] .skyline-mid { fill: oklch(0.28 0.02 260); }
              [data-theme="dark"] .skyline-near { fill: oklch(0.32 0.03 260); }
              [data-theme="dark"] .footpath-top { fill: oklch(0.38 0.015 80); }
              [data-theme="dark"] .kerb-face { fill: oklch(0.28 0.015 80); }

              /* Seamless Parallax Translation along isometric x-axis: translate(-Δ*C, -Δ*S) */
              @keyframes scrollRoad {
                from { transform: translate(0, 0); }
                to { transform: translate(-45.47px, -26.25px); } /* exactly 3 meters along x */
              }
              @keyframes scrollSkyNear {
                from { transform: translate(0, 0); }
                to { transform: translate(-20.46px, -11.81px); }
              }
              @keyframes scrollSkyFar {
                from { transform: translate(0, 0); }
                to { transform: translate(-9.09px, -5.25px); }
              }
              @keyframes busBob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-0.6px); }
              }

              .anim-road { animation: scrollRoad 0.55s linear infinite; }
              .anim-sky-near { animation: scrollSkyNear 1.4s linear infinite; }
              .anim-sky-far { animation: scrollSkyFar 3.0s linear infinite; }
              .anim-bob { animation: busBob 2.2s ease-in-out infinite; }
            `}</style>
          </defs>

          {/* Sky Tint Background */}
          <rect width="520" height="340" className="sky-bg" />

          {/* 1. Skyline Layer 1 (Far, 0.2x speed) */}
          <g className={speed > 0 && !isReducedMotion ? "anim-sky-far" : ""}>
            <g className="skyline-far">
              {/* India Gate Silhouette */}
              <polygon points="40,95 60,95 60,130 72,130 72,95 92,95 92,60 40,60" />
              {/* Secretariat & Towers */}
              <polygon points="120,135 142,135 142,70 120,70" />
              <polygon points="152,135 174,135 174,85 152,85" />
              {/* Duplicated for loop */}
              <polygon points="320,95 340,95 340,130 352,130 352,95 372,95 372,60 320,60" />
              <polygon points="400,135 422,135 422,70 400,70" />
              <polygon points="432,135 454,135 454,85 432,85" />
            </g>
          </g>

          {/* 2. Skyline Layer 2 (Mid, 0.45x speed) */}
          <g className={speed > 0 && !isReducedMotion ? "anim-sky-near" : ""}>
            <g className="skyline-mid">
              {/* Tomb Dome & Minarets */}
              <path d="M 220,140 L 220,105 Q 240,85 260,105 L 260,140 Z" />
              <polygon points="268,140 274,140 274,78 268,78" />
              {/* Duplicated tile */}
              <path d="M 20,140 L 20,105 Q 40,85 60,105 L 60,140 Z" />
              <polygon points="68,140 74,140 74,78 68,78" />
            </g>
          </g>

          {/* 3. Ground Plane: Road, Footpath & Props */}
          <g id="ground">
            <polygon points={roadTop} className="road-top" />
            <polygon points={roadSide} className="road-edge" />
            <polygon points={kerbBevel} className="kerb-face" />
            <polygon points={footpathTop} className="footpath-top" />

            {/* Kerb Stone Joints (drawn along isometric axes) */}
            {[-12, -8, -4, 0, 4, 8, 12, 16].map((kx) => {
              const [k1x, k1y] = iso(kx, 1.8, 0);
              const [k2x, k2y] = iso(kx, 1.8, 0.2);
              return <line key={kx} x1={k1x} y1={k1y} x2={k2x} y2={k2y} stroke="oklch(0.50 0.015 80)" strokeWidth="0.8" />;
            })}

            {/* Scrolling Dashed Centre Line (at y = -1.0) */}
            <g className={speed > 0 && !isReducedMotion ? "anim-road" : ""}>
              {[-18, -12, -6, 0, 6, 12, 18, 24].map((dx) => {
                const p = face([[dx - 1.5, -1.0, 0.01], [dx + 1.5, -1.0, 0.01], [dx + 1.5, -0.85, 0.01], [dx - 1.5, -0.85, 0.01]]);
                return <polygon key={dx} points={p} className="markings" />;
              })}
            </g>

            {/* Bus Stop Shelter on Footpath (at x = 3.5, y = 3.2, z = 0.2) */}
            <g id="shelter">
              {[1.8, 3.5, 5.2].map((px) => {
                const pad = face([[px - 0.2, 3.3, 0.2], [px + 0.2, 3.3, 0.2], [px + 0.2, 3.5, 0.2], [px - 0.2, 3.5, 0.2]]);
                const post = face([[px - 0.06, 3.4, 0.2], [px + 0.06, 3.4, 0.2], [px + 0.06, 3.4, 2.7], [px - 0.06, 3.4, 2.7]]);
                return (
                  <g key={px}>
                    <polygon points={pad} fill="oklch(0.50 0.02 260)" />
                    <polygon points={post} fill="oklch(0.35 0.02 260)" />
                  </g>
                );
              })}
              {/* Translucent Shelter Glass Canopy */}
              <polygon
                points={face([[1.4, 2.2, 2.7], [5.6, 2.2, 2.7], [5.6, 3.7, 2.7], [1.4, 3.7, 2.7]])}
                fill="oklch(0.85 0.05 235 / 0.6)"
                stroke="oklch(0.30 0.02 260)"
                strokeWidth="0.8"
              />
              {/* Teak Wood Waiting Bench */}
              <polygon
                points={face([[2.2, 3.2, 0.65], [4.8, 3.2, 0.65], [4.8, 3.5, 0.65], [2.2, 3.5, 0.65]])}
                fill="oklch(0.62 0.12 65)"
              />
            </g>

            {/* DTC Stop Sign Stand (placed at x = 7.5, y = 2.6 on footpath) */}
            <g id="dtc-sign">
              {/* Base pad */}
              <polygon
                points={face([[7.35, 2.5, 0.2], [7.65, 2.5, 0.2], [7.65, 2.7, 0.2], [7.35, 2.7, 0.2]])}
                fill="oklch(0.40 0.02 260)"
              />
              {/* Tubular pole */}
              <polygon
                points={face([[7.48, 2.6, 0.2], [7.52, 2.6, 0.2], [7.52, 2.6, 2.9], [7.48, 2.6, 2.9]])}
                fill="oklch(0.30 0.02 260)"
              />
              {/* DTC Round Green Signboard */}
              {(() => {
                const [sx, sy] = iso(7.5, 2.6, 2.9);
                return (
                  <g>
                    <circle cx={sx} cy={sy} r="9" fill="oklch(0.55 0.18 150)" stroke="#ffffff" strokeWidth="1.2" />
                    <text x={sx} y={sy + 2.8} textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">
                      DTC
                    </text>
                  </g>
                );
              })()}
            </g>
          </g>

          {/* 4. Body Cast Shadow on Road Plane */}
          <polygon points={castShadow} className="shadow-cast" />

          {/* 5. Far Side Wheels (Drawn before body) */}
          <g id="far-wheels">
            {[rearAxleX, frontAxleX].map((axleX) => {
              const [wx, wy] = iso(axleX, -1.25, 0.5);
              return (
                <g key={axleX}>
                  {/* Wheel contact shadow directly under far tyre at z = 0 */}
                  <polygon
                    points={face([
                      [axleX - 0.45, -1.4, 0],
                      [axleX + 0.45, -1.4, 0],
                      [axleX + 0.45, -1.1, 0],
                      [axleX - 0.45, -1.1, 0],
                    ])}
                    className="shadow-contact"
                  />
                  {/* Isometric wheel ellipse */}
                  <g transform={`translate(${wx}, ${wy}) rotate(-30)`}>
                    <ellipse cx="0" cy="0" rx="9" ry="5.2" className="wheel-tyre" />
                    <ellipse cx="0" cy="0" rx="4.5" ry="2.6" className="wheel-hub" />
                  </g>
                </g>
              );
            })}
          </g>

          {/* 6. The Bus Body */}
          <g id="bus-body" className={speed > 0 && !isReducedMotion ? "anim-bob" : ""}>
            {/* Dark Wheel Arch Cavities */}
            {[rearAxleX, frontAxleX].map((axleX) => {
              const cavity = face([
                [axleX - 0.75, 1.25, 0.35],
                [axleX + 0.75, 1.25, 0.35],
                [axleX + 0.75, 1.25, 0.85],
                [axleX - 0.75, 1.25, 0.85],
              ]);
              return <polygon key={axleX} points={cavity} fill="oklch(0.12 0.02 260)" />;
            })}

            {/* Main Solid Faces */}
            <polygon points={bodyTop} className="bus-top" />
            <polygon points={bodySide} className="bus-side" />
            <polygon points={bodyFront} className="bus-front" />

            {/* Front Bumper Slab in Dark Ink */}
            <polygon points={bumperTop} fill="oklch(0.24 0.02 260)" />
            <polygon points={bumperFront} fill="oklch(0.18 0.02 260)" />

            {/* Delhi White Registration Plate: DL 1PC 1409 */}
            {(() => {
              const platePts = face([[bx1 + 0.09, -0.4, 0.40], [bx1 + 0.09, 0.4, 0.40], [bx1 + 0.09, 0.4, 0.52], [bx1 + 0.09, -0.4, 0.52]]);
              const [px, py] = iso(bx1 + 0.09, 0, 0.46);
              return (
                <g>
                  <polygon points={platePts} fill="#ffffff" stroke="oklch(0.20 0.02 260)" strokeWidth="0.5" />
                  <text x={px} y={py + 2} textAnchor="middle" fill="#111827" fontSize="3.8" fontWeight="bold" fontFamily="monospace">
                    DL 1PC 1409
                  </text>
                </g>
              );
            })()}

            {/* Teal Accent Stripe along Lower Body */}
            <polygon points={stripeSide} className="stripe-side" />
            <polygon points={stripeFront} className="stripe-front" />

            {/* Two Low-Profile Rounded AC Pods on Roof */}
            {[-2.8, 1.8].map((podX) => {
              const pTop = face([[podX, -0.8, 3.38], [podX + 2.0, -0.8, 3.38], [podX + 2.0, 0.8, 3.38], [podX, 0.8, 3.38]]);
              const pSide = face([[podX, 0.8, 3.1], [podX + 2.0, 0.8, 3.1], [podX + 2.0, 0.8, 3.38], [podX, 0.8, 3.38]]);
              return (
                <g key={podX}>
                  <polygon points={pTop} fill="oklch(0.35 0.02 260)" />
                  <polygon points={pSide} fill="oklch(0.24 0.02 260)" />
                </g>
              );
            })}

            {/* Front Windscreen with Aerodynamic 0.28m Rake */}
            <polygon points={windscreen} className="window-glass" />
            <polygon points={windscreenGlare} className="window-glare" />

            {/* Destination LED Board on Front Face */}
            <polygon points={destBox} fill="oklch(0.12 0.02 260)" stroke="oklch(0.25 0.02 260)" strokeWidth="0.8" />
            {(() => {
              const [dx, dy] = iso(5.52, 0, 2.82);
              return (
                <g>
                  {/* Amber Route Badge 764 */}
                  <rect x={dx - 18} y={dy - 4.5} width="11" height="7" rx="1.5" fill="oklch(0.85 0.17 75)" />
                  <text x={dx - 12.5} y={dy + 0.8} textAnchor="middle" fill="#000000" fontSize="5" fontWeight="bold" fontFamily="monospace">
                    764
                  </text>
                  {/* Destination Text */}
                  <text x={dx + 8} y={dy + 0.8} textAnchor="middle" fill="oklch(0.85 0.17 75)" fontSize="4.6" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">
                    KASHMERE GATE
                  </text>
                </g>
              );
            })()}

            {/* Twin Headlights & Warm Ground Beam Cone */}
            <polygon points={face([[5.81, -0.85, 0.65], [5.81, -0.45, 0.65], [5.81, -0.45, 0.90], [5.81, -0.85, 0.90]])} fill="#fef08a" />
            <polygon points={face([[5.81, 0.45, 0.65], [5.81, 0.85, 0.65], [5.81, 0.85, 0.90], [5.81, 0.45, 0.90]])} fill="#fef08a" />
            <polygon
              points={face([[5.80, -0.9, 0.75], [5.80, 0.9, 0.75], [10.5, 1.8, 0.01], [10.5, -2.2, 0.01]])}
              fill="oklch(0.95 0.12 85 / 0.15)"
            />

            {/* Rear Red Tail Light on near side corner */}
            <polygon points={face([[-5.81, 1.05, 0.70], [-5.81, 1.25, 0.70], [-5.81, 1.25, 0.95], [-5.81, 1.05, 0.95]])} fill="#ef4444" />

            {/* Green Electric Leaf / Bolt Badge */}
            {(() => {
              const [lx, ly] = iso(4.9, 1.255, 0.73);
              return (
                <g transform={`translate(${lx}, ${ly})`}>
                  <circle cx="0" cy="0" r="4.5" fill="oklch(0.65 0.18 150)" />
                  <path d="M -1,-2.5 L 1,-2.5 L 0,0 L 1.5,0 L -1,3 L 0,0.8 L -1.5,0.8 Z" fill="#ffffff" />
                </g>
              );
            })()}

            {/* Side Mirrors on Stalks */}
            {(() => {
              const [mx, my] = iso(5.7, 1.38, 1.85);
              return (
                <g>
                  {/* Stalk */}
                  <line x1={mx - 3} y1={my + 1} x2={mx} y2={my} stroke="oklch(0.20 0.02 260)" strokeWidth="1" />
                  {/* Mirror glass head */}
                  <rect x={mx} y={my - 5} width="2.5" height="7" rx="1" fill="oklch(0.30 0.02 260)" stroke="oklch(0.20 0.02 260)" strokeWidth="0.6" />
                </g>
              );
            })()}

            {/* Side Window Bays with Varied Glare & Human Commuters */}
            {windowBays.map(({ x0, x1, p }, idx) => {
              const winPts = face([[x0, 1.255, 1.15], [x1, 1.255, 1.15], [x1, 1.255, 2.55], [x0, 1.255, 2.55]]);
              const glareOffset = idx % 2 === 0 ? 0.3 : 0.2;
              const glarePts = face([
                [x0 + glareOffset, 1.256, 1.25],
                [x0 + glareOffset + 0.35, 1.256, 1.25],
                [x0 + glareOffset + 0.65, 1.256, 2.45],
                [x0 + glareOffset + 0.30, 1.256, 2.45],
              ]);
              const [px, py] = iso((x0 + x1) / 2, 1.05, 1.6);

              return (
                <g key={idx}>
                  <polygon points={winPts} className="window-glass" />
                  <polygon points={glarePts} className="window-glare" />

                  {/* Commuter Silhouettes */}
                  {p && (
                    <g opacity="0.75">
                      <circle cx={px} cy={py - 3} r="3" fill="oklch(0.22 0.02 260)" />
                      <path d={`M ${px - 5.5} ${py + 4.5} Q ${px} ${py - 0.5} ${px + 5.5} ${py + 4.5} Z`} fill="oklch(0.22 0.02 260)" />
                      {p.hasBag && (
                        <rect x={px + 2} y={py + 1} width="4" height="4" rx="1" fill="oklch(0.55 0.15 45)" />
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Sliding Kerb-Side Doors */}
            {doors.map(({ id, x0, x1 }) => {
              const doorW = x1 - x0;
              const slideOffset = doorsOpen ? doorW * 0.42 : 0;
              const doorway = face([[x0, 1.22, 0.35], [x1, 1.22, 0.35], [x1, 1.22, 2.55], [x0, 1.22, 2.55]]);
              const leaf1 = face([[x0 - slideOffset, 1.258, 0.38], [x0 + doorW / 2 - slideOffset, 1.258, 0.38], [x0 + doorW / 2 - slideOffset, 1.258, 2.55], [x0 - slideOffset, 1.258, 2.55]]);
              const leaf2 = face([[x0 + doorW / 2 + slideOffset, 1.258, 0.38], [x1 + slideOffset, 1.258, 0.38], [x1 + slideOffset, 1.258, 2.55], [x0 + doorW / 2 + slideOffset, 1.258, 2.55]]);

              return (
                <g key={id}>
                  <polygon points={doorway} fill="oklch(0.15 0.02 260)" />
                  <polygon points={leaf1} fill="oklch(0.24 0.02 260)" stroke="oklch(0.18 0.02 260)" strokeWidth="0.8" />
                  <polygon points={leaf2} fill="oklch(0.24 0.02 260)" stroke="oklch(0.18 0.02 260)" strokeWidth="0.8" />
                  {/* Glass pane inside each leaf */}
                  <polygon
                    points={face([[x0 - slideOffset + 0.1, 1.26, 1.1], [x0 + doorW / 2 - slideOffset - 0.1, 1.26, 1.1], [x0 + doorW / 2 - slideOffset - 0.1, 1.26, 2.35], [x0 - slideOffset + 0.1, 1.26, 2.35]])}
                    className="window-glass"
                  />
                  <polygon
                    points={face([[x0 + doorW / 2 + slideOffset + 0.1, 1.26, 1.1], [x1 + slideOffset - 0.1, 1.26, 1.1], [x1 + slideOffset - 0.1, 1.26, 2.35], [x0 + doorW / 2 + slideOffset + 0.1, 1.26, 2.35]])}
                    className="window-glass"
                  />
                </g>
              );
            })}
          </g>

          {/* 7. Near Side Wheels & Contact Shadows */}
          <g id="near-wheels">
            {[rearAxleX, frontAxleX].map((axleX) => {
              const [wx, wy] = iso(axleX, 1.27, 0.5);
              return (
                <g key={axleX}>
                  {/* Contact shadow on road surface at z = 0 */}
                  <polygon
                    points={face([
                      [axleX - 0.5, 1.1, 0],
                      [axleX + 0.5, 1.1, 0],
                      [axleX + 0.5, 1.45, 0],
                      [axleX - 0.5, 1.45, 0],
                    ])}
                    className="shadow-contact"
                  />

                  {/* Near Wheel Isometric Ellipse */}
                  <g transform={`translate(${wx}, ${wy}) rotate(-30)`}>
                    <ellipse cx="0" cy="0" rx="11" ry="6.4" className="wheel-tyre" />
                    <ellipse cx="0" cy="0" rx="5.5" ry="3.2" className="wheel-hub" />

                    {/* Rotating spokes if moving */}
                    {speed > 0 && !isReducedMotion && (
                      <g className="anim-wheel" style={{ transformOrigin: "0 0" }}>
                        <line x1="-4" y1="0" x2="4" y2="0" stroke="#ffffff" strokeWidth="1" />
                        <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="#ffffff" strokeWidth="1" />
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 2. Concentric Info Block (Step 2 specs) */}
      <div style={{ padding: "16px 8px 8px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Row 1: Title & Status Pill */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h3
            className="text-heading"
            title="Delhi electric commuter"
            style={{
              margin: 0,
              fontSize: "1.0625rem",
              fontWeight: 600,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Delhi electric commuter
          </h3>

          <div
            className="tabular-nums"
            style={{
              height: 28,
              padding: "0 10px 0 8px",
              borderRadius: "var(--r-pill)",
              background: "var(--surface-2)",
              boxShadow: "var(--ring-subtle)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--text)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: phase === "stopped" ? "var(--crowd-mod)" : "var(--crowd-low)",
                flexShrink: 0,
              }}
            />
            <span>
              {phase === "stopped" ? (
                "At stop · Doors open"
              ) : (
                <>
                  <span className="status-prefix">Cruising · </span>
                  <span>{speed} km/h</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Row 2: Caption (left) & Seat count (right) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            className="text-caption"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: "1rem" }} aria-hidden="true">👆</span>
            <span>Tap the bus to open doors</span>
          </span>

          <span
            className="tabular-nums"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {occupiedSeats} of {totalSeats} seats
          </span>
        </div>

        {/* Row 3: Occupancy Bar with Label */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color:
                  loadPercent < 50
                    ? "var(--crowd-low)"
                    : loadPercent < 80
                    ? "var(--crowd-mod)"
                    : "var(--crowd-high)",
              }}
            >
              {loadPercent < 50
                ? "Seats free"
                : loadPercent < 80
                ? "Getting full"
                : "Crowded"}
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              {loadPercent}%
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: "var(--r-pill)",
              background: "var(--surface-2)",
              overflow: "hidden",
            }}
            role="progressbar"
            aria-valuenow={loadPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Bus occupancy: ${loadPercent}%`}
          >
            <div
              style={{
                width: `${loadPercent}%`,
                height: "100%",
                borderRadius: "var(--r-pill)",
                background:
                  loadPercent < 50
                    ? "var(--crowd-low)"
                    : loadPercent < 80
                    ? "var(--crowd-mod)"
                    : "var(--crowd-high)",
                transition: "width 300ms ease-out",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
