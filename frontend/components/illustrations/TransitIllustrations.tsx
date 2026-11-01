import React from "react";

interface IllustrationProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * 1. Original Vector Illustration: Route 404 - Stop Not Found
 * Pure SVG artwork depicting an iconic DTC bus taking a scenic detour
 * with an LED board reading "ROUTE 404", a wandering GPS pin, and KM 404 milestone.
 */
export function NotFoundBusIllustration({
  width = 320,
  height = 220,
  className = "",
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-labelledby="title-404 desc-404"
      role="img"
      {...props}
    >
      <title id="title-404">Route 404 - Bus Stop Not Found</title>
      <desc id="desc-404">A geometric DTC transit bus on a scenic detour with a milestone reading 404</desc>

      {/* Background Soft Sky Arc */}
      <circle cx="160" cy="180" r="110" fill="var(--surface-2)" fillOpacity="0.7" />

      {/* Skyline Silhouette */}
      <path
        d="M60 170V130H80V170H90V145H105V170H120V120H135V170H200V135H215V170H230V140H245V170H260V170"
        stroke="var(--line)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Winding Road */}
      <path
        d="M20 185C70 170 110 195 160 180C210 165 260 185 300 180"
        stroke="var(--line)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M20 185C70 170 110 195 160 180C210 165 260 185 300 180"
        stroke="var(--surface-3)"
        strokeWidth="2"
        strokeDasharray="8 6"
        strokeLinecap="round"
      />

      {/* Floating Wandering GPS Pin */}
      <g transform="translate(68, 55)">
        <path
          d="M16 2C9.37 2 4 7.37 4 14C4 22 16 32 16 32C16 32 28 22 28 14C28 7.37 22.63 2 16 2Z"
          fill="#DC2626"
        />
        <circle cx="16" cy="13" r="5" fill="#FFFFFF" />
        <circle cx="16" cy="13" r="2.5" fill="#DC2626" />
        {/* Signal question ripple */}
        <text
          x="32"
          y="18"
          fill="#DC2626"
          fontSize="14"
          fontWeight="800"
          fontFamily="system-ui"
        >
          ?
        </text>
      </g>

      {/* Geometric DTC Green Bus */}
      <g transform="translate(115, 82)">
        {/* Bus Shadow */}
        <ellipse cx="48" cy="88" rx="46" ry="6" fill="oklch(0 0 0 / 0.12)" />

        {/* Bus Body */}
        <rect x="2" y="10" width="92" height="68" rx="14" fill="#0A6E3F" stroke="#054C2B" strokeWidth="2.5" />

        {/* Roof Accent / AC Pod */}
        <rect x="24" y="4" width="48" height="8" rx="4" fill="#F4A900" />
        <line x1="32" y1="8" x2="64" y2="8" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />

        {/* Digital LED Destination Board */}
        <rect x="14" y="18" width="68" height="13" rx="3" fill="#111827" stroke="#374151" strokeWidth="1" />
        <text
          x="48"
          y="27.5"
          fill="#F4A900"
          fontSize="8"
          fontWeight="900"
          fontFamily="monospace"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          404 : NOT FOUND
        </text>

        {/* Windshield */}
        <rect x="10" y="35" width="76" height="24" rx="4" fill="#E0F2FE" stroke="#054C2B" strokeWidth="1.8" />
        {/* Reflection */}
        <path d="M14 55L34 38H44L24 55H14Z" fill="#FFFFFF" fillOpacity="0.4" />
        {/* Dual Wipers */}
        <line x1="30" y1="56" x2="38" y2="48" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="58" y1="56" x2="66" y2="48" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />

        {/* Headlights */}
        <circle cx="16" cy="67" r="4.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
        <circle cx="80" cy="67" r="4.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />

        {/* Front Grill */}
        <line x1="36" y1="67" x2="60" y2="67" stroke="#054C2B" strokeWidth="3" strokeLinecap="round" />
        <line x1="40" y1="71" x2="56" y2="71" stroke="#054C2B" strokeWidth="2" strokeLinecap="round" />

        {/* Wheels */}
        <rect x="12" y="76" width="14" height="12" rx="4" fill="#1F2937" />
        <rect x="70" y="76" width="14" height="12" rx="4" fill="#1F2937" />
        <circle cx="19" cy="82" r="2.5" fill="#9CA3AF" />
        <circle cx="77" cy="82" r="2.5" fill="#9CA3AF" />
      </g>

      {/* Indian Transit Roadside Milestone KM 404 */}
      <g transform="translate(236, 142)">
        {/* Milestone Base */}
        <path
          d="M0 32V10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10V32H0Z"
          fill="#FFFFFF"
          stroke="#111827"
          strokeWidth="1.8"
        />
        {/* Yellow Top (State/National Highway Standard) */}
        <path
          d="M0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10H0Z"
          fill="#F4A900"
          stroke="#111827"
          strokeWidth="1.8"
        />
        <text
          x="10"
          y="23"
          fill="#111827"
          fontSize="7"
          fontWeight="800"
          fontFamily="monospace"
          textAnchor="middle"
        >
          404
        </text>
      </g>
    </svg>
  );
}

/**
 * 2. Original Vector Illustration: Empty Bus Shelter / No Active Buses
 */
export function EmptyShelterIllustration({
  width = 280,
  height = 190,
  className = "",
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Morning Sun */}
      <circle cx="210" cy="50" r="26" fill="#FDE68A" fillOpacity="0.6" />
      <circle cx="210" cy="50" r="18" fill="#F59E0B" fillOpacity="0.4" />

      {/* Ground Line */}
      <line x1="20" y1="165" x2="260" y2="165" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />

      {/* Bus Stop Shelter Structure */}
      {/* Roof */}
      <path
        d="M45 65C45 58 52 52 60 52H180C188 52 195 58 195 65V68H45V65Z"
        fill="#0A6E3F"
      />
      {/* Steel Pillars */}
      <line x1="60" y1="68" x2="60" y2="165" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      <line x1="180" y1="68" x2="180" y2="165" stroke="#374151" strokeWidth="4" strokeLinecap="round" />

      {/* Glass Back Wall */}
      <rect x="62" y="68" width="116" height="80" fill="oklch(0 0 0 / 0.04)" stroke="var(--line)" strokeWidth="1.2" />

      {/* Transit Map Board on Glass */}
      <rect x="75" y="80" width="34" height="48" rx="2" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="80" y1="90" x2="104" y2="90" stroke="#0A6E3F" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="96" x2="98" y2="96" stroke="#F4A900" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="102" x2="102" y2="102" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="85" cy="115" r="2" fill="#2563EB" />
      <circle cx="95" cy="115" r="2" fill="#0A6E3F" />

      {/* Digital ETA Indicator Display */}
      <rect x="120" y="76" width="50" height="18" rx="3" fill="#111827" />
      <circle cx="128" cy="85" r="2" fill="#22C55E" />
      <rect x="134" y="83" width="28" height="4" rx="1" fill="#F4A900" />

      {/* Waiting Passenger Bench */}
      <rect x="72" y="130" width="96" height="6" rx="2" fill="#854D0E" />
      <line x1="82" y1="136" x2="82" y2="165" stroke="#4B5563" strokeWidth="3" />
      <line x1="158" y1="136" x2="158" y2="165" stroke="#4B5563" strokeWidth="3" />

      {/* Foliage / Green City Element */}
      <circle cx="230" cy="148" r="18" fill="#16A34A" fillOpacity="0.2" />
      <circle cx="242" cy="140" r="14" fill="#16A34A" fillOpacity="0.3" />
      <line x1="236" y1="148" x2="236" y2="165" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 3. Original Vector Illustration: Satellite GPS / Offline Connection Mode
 */
export function OfflineConnectionIllustration({
  width = 240,
  height = 180,
  className = "",
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Floating Orbit Rings */}
      <ellipse cx="120" cy="85" rx="80" ry="32" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Satellite Body */}
      <g transform="translate(95, 55)">
        {/* Core module */}
        <rect x="14" y="10" width="22" height="22" rx="4" fill="#374151" stroke="#1F2937" strokeWidth="1.5" />
        <circle cx="25" cy="21" r="4" fill="#60A5FA" />

        {/* Solar Panel Left */}
        <rect x="-10" y="13" width="20" height="16" rx="2" fill="#1E3A8A" stroke="#2563EB" strokeWidth="1" />
        <line x1="-10" y1="21" x2="10" y2="21" stroke="#93C5FD" strokeWidth="1" />
        <line x1="0" y1="13" x2="0" y2="29" stroke="#93C5FD" strokeWidth="1" />

        {/* Solar Panel Right */}
        <rect x="40" y="13" width="20" height="16" rx="2" fill="#1E3A8A" stroke="#2563EB" strokeWidth="1" />
        <line x1="40" y1="21" x2="60" y2="21" stroke="#93C5FD" strokeWidth="1" />
        <line x1="50" y1="13" x2="50" y2="29" stroke="#93C5FD" strokeWidth="1" />

        {/* Antenna dish */}
        <path d="M25 32V42" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 42C17 38 33 38 33 42" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Dashed transmission waves heading downwards */}
      <path
        d="M100 120C112 114 128 114 140 120"
        stroke="#F4A900"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <path
        d="M88 135C108 126 132 126 152 135"
        stroke="#F4A900"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />

      {/* Target Marker */}
      <circle cx="120" cy="155" r="10" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="120" cy="155" r="3" fill="#DC2626" />
    </svg>
  );
}

/**
 * 4. Original Vector Illustration: Low-Floor Electric Bus Arriving
 */
export function ArrivingBusIllustration({
  width = 280,
  height = 180,
  className = "",
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Road Perspective Lines */}
      <polygon points="140,70 140,70 20,175 260,175" fill="oklch(0 0 0 / 0.03)" />
      <line x1="140" y1="95" x2="140" y2="175" stroke="#F4A900" strokeWidth="3" strokeDasharray="12 8" />

      {/* Twin Beaming Headlights Light Cones */}
      <polygon points="105,125 15,175 90,175" fill="#FEF08A" fillOpacity="0.25" />
      <polygon points="175,125 190,175 265,175" fill="#FEF08A" fillOpacity="0.25" />

      {/* Approaching Bus Body */}
      <g transform="translate(90, 50)">
        <rect x="0" y="8" width="100" height="78" rx="16" fill="#0A6E3F" stroke="#054C2B" strokeWidth="3" />

        {/* AC / EV Battery Pod on Roof */}
        <rect x="22" y="0" width="56" height="10" rx="4" fill="#F4A900" stroke="#D97706" strokeWidth="1" />
        {/* EV Lightning Bolt icon */}
        <path d="M48 2L44 6H50L48 10L54 5H49L52 2H48Z" fill="#111827" />

        {/* LED Destination Board */}
        <rect x="12" y="16" width="76" height="14" rx="3" fill="#111827" />
        <circle cx="20" cy="23" r="2.5" fill="#22C55E" />
        <text
          x="54"
          y="26"
          fill="#F4A900"
          fontSize="8.5"
          fontWeight="900"
          fontFamily="monospace"
          textAnchor="middle"
        >
          LIVE ARRIVAL
        </text>

        {/* Panoramic Windshield */}
        <rect x="8" y="34" width="84" height="30" rx="5" fill="#E0F2FE" stroke="#054C2B" strokeWidth="1.8" />
        {/* Rearview mirrors */}
        <rect x="-8" y="40" width="7" height="12" rx="2" fill="#111827" />
        <rect x="101" y="40" width="7" height="12" rx="2" fill="#111827" />

        {/* Twin Headlights with Glow */}
        <circle cx="16" cy="74" r="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
        <circle cx="84" cy="74" r="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />

        {/* Bumper Grill */}
        <rect x="34" y="72" width="32" height="6" rx="2" fill="#054C2B" />
        <line x1="38" y1="75" x2="62" y2="75" stroke="#F4A900" strokeWidth="1.5" strokeLinecap="round" />

        {/* Wheels */}
        <rect x="10" y="86" width="16" height="12" rx="4" fill="#1F2937" />
        <rect x="74" y="86" width="16" height="12" rx="4" fill="#1F2937" />
      </g>
    </svg>
  );
}
