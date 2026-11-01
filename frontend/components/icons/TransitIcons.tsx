import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * 1. Geometric Low-Floor DTC Bus Icon
 * Handcrafted vector representing Delhi's iconic green CNG & electric buses
 * with LED destination display, windshield, and dual headlights.
 */
export function BusGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Bus Body */}
      <rect x="3" y="3" width="18" height="15" rx="3.5" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.8" />
      {/* LED Destination Board */}
      <rect x="6.5" y="5" width="11" height="2" rx="0.8" fill={color} />
      {/* Windshield */}
      <rect x="5" y="8.5" width="14" height="4.5" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2" />
      {/* Headlights */}
      <circle cx="6.5" cy="15" r="1.2" fill={color} />
      <circle cx="17.5" cy="15" r="1.2" fill={color} />
      {/* Grill line */}
      <line x1="10" y1="15" x2="14" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Wheels */}
      <rect x="5" y="18" width="3" height="3" rx="1" fill={color} />
      <rect x="16" y="18" width="3" height="3" rx="1" fill={color} />
    </svg>
  );
}

/**
 * 2. Metro Interchange Transfer Badge
 * Represents seamless multimodal transfer between DTC bus network and Delhi Metro.
 */
export function MetroTransferGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.08" />
      {/* Stylized M-train tracks */}
      <path
        d="M7 16V9L12 13L17 9V16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="15.5" r="0.8" fill={color} />
      <circle cx="14.5" cy="15.5" r="0.8" fill={color} />
    </svg>
  );
}

/**
 * 3. Bus Stop & Modern Shelter Marker
 */
export function StopMarkerGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Shelter Roof */}
      <path d="M3 6.5C3 5.67157 3.67157 5 4.5 5H19.5C20.3284 5 21 5.67157 21 6.5V7H3V6.5Z" fill={color} />
      {/* Pillar */}
      <line x1="5.5" y1="7" x2="5.5" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18.5" y1="7" x2="18.5" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Bench */}
      <rect x="7" y="14" width="10" height="1.8" rx="0.9" fill={color} />
      {/* Station Sign flag */}
      <rect x="8.5" y="8" width="7" height="4" rx="1" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1" />
      <line x1="10" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 4. Live Pulse Real-Time GPS Wave
 */
export function LivePulseGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="3" fill={color} />
      <path
        d="M8.5 8.5C6.5 10.5 6.5 13.5 8.5 15.5M15.5 8.5C17.5 10.5 17.5 13.5 15.5 15.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5.5 5.5C2.5 8.5 2.5 15.5 5.5 18.5M18.5 5.5C21.5 8.5 21.5 15.5 18.5 18.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

/**
 * 5. DTC AC Low-Floor Climate Indicator
 */
export function ACBusGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Snowflake core */}
      <line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7.75" y1="7.75" x2="16.25" y2="16.25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16.25" y1="7.75" x2="7.75" y2="16.25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 6. Electric Clean Transit (EV Fleet)
 */
export function EVBusGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M13 2L4 14H12L11 22L20 10H12L13 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 7. Seat Chance / Occupancy Probability Gauge
 */
export function SeatChanceGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Ergonomic transit seat */}
      <path
        d="M6 4C6 3.44772 6.44772 3 7 3H9C9.55228 3 10 3.44772 10 4V13H17C18.1046 13 19 13.8954 19 15V17H8C6.89543 17 6 16.1046 6 15V4Z"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Seat leg base */}
      <line x1="8" y1="17" x2="8" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="17" x2="16" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 8. Official DTC Conductor / Crew Badge
 */
export function ConductorBadgeGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Badge Shield */}
      <path
        d="M12 3L4 6.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V6.5L12 3Z"
        stroke={color}
        strokeWidth="1.8"
        fill={color}
        fillOpacity="0.12"
        strokeLinejoin="round"
      />
      {/* Badge Star */}
      <path
        d="M12 8L13.2 10.8L16.2 11.1L13.9 13.1L14.6 16L12 14.4L9.4 16L10.1 13.1L7.8 11.1L10.8 10.8L12 8Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * 9. Cash & UPI Passenger Transit Ticket
 */
export function TransitTicketGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.08" />
      {/* Ticket notches */}
      <path d="M3 11C4.10457 11 5 11.4477 5 12C5 12.5523 4.10457 13 3 13" fill="var(--bg)" stroke={color} strokeWidth="1.5" />
      <path d="M21 11C19.8954 11 19 11.4477 19 12C19 12.5523 19.8954 13 21 13" fill="var(--bg)" stroke={color} strokeWidth="1.5" />
      {/* Barcode bars */}
      <line x1="8" y1="9" x2="8" y2="15" stroke={color} strokeWidth="1.5" />
      <line x1="10.5" y1="9" x2="10.5" y2="15" stroke={color} strokeWidth="2.5" />
      <line x1="13.5" y1="9" x2="13.5" y2="15" stroke={color} strokeWidth="1" />
      <line x1="15.5" y1="9" x2="15.5" y2="15" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/**
 * 10. Women's Transit Safety & 112 SOS Shield
 */
export function SafetyShieldGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M12 2L4 5.5V11C4 16.5 7.5 21.2 12 22.5C16.5 21.2 20 16.5 20 11V5.5L12 2Z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 11. Transit Network & Schematic Map Icon
 */
export function RouteMapGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2" />
      <circle cx="18" cy="8" r="2.5" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2" />
      <circle cx="12" cy="18" r="2.5" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2" />
      <path d="M8 7.5L15.5 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 8.5V14L10 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 10.5V15L14 17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 12. Urgent SOS Emergency Beacon
 */
export function SOSBeaconGlyph({ size = 24, color = "currentColor", className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <polygon points="12,2 22,20 2,20" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.15" strokeLinejoin="round" />
      <line x1="12" y1="8" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.2" fill={color} />
    </svg>
  );
}
