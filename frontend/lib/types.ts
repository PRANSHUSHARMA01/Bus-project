export type Occupancy = "Low" | "Moderate" | "High";

export interface Stop {
  id: string;
  name: string;
  name_hi: string;
  lat: number;
  lng: number;
  d?: number;
  routes?: string[];
}

export interface Route {
  id: string;
  name: string;
  color: string;
  length_m: number;
  path: [number, number][];
  buses: number;
  stops: Stop[];
}

export interface Bus {
  bus_id: number;
  reg_no: string;
  route_id: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  onboard: number;
  capacity: number;
  load_pct: number;
  occupancy: Occupancy;
  towards: string;
  last_seen_s: number;
  broken: boolean;
}

export interface Arrival {
  bus_id: number;
  reg_no: string;
  route_id: string;
  towards: string;
  eta_min: number;
  distance_m: number;
  stops_away: number;
  occupancy: Occupancy;
  load_pct: number;
  seat_prob: number;
  speed_kmh: number;
  broken: boolean;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  type: string;
  route_id: string | null;
  message: string;
}

export interface FleetItem {
  bus_id: number;
  reg_no: string;
  route_id: string;
  route_name: string;
  capacity: number;
}

export interface Kpis {
  active_buses: number;
  fleet: number;
  avg_speed_kmh: number;
  crowded_buses: number;
  on_time_pct: number;
  passengers_today: number;
  model: { mae_model?: number; mae_baseline?: number };
}

export interface ForecastRoute {
  series: { hour: number; passengers: number }[];
  peak: { hour: number; passengers: number };
  needed: number;
  have: number;
}

export interface Recommendation {
  from_route: string;
  to_route: string;
  buses: number;
  reason: string;
}

export const OCC_COLOR: Record<Occupancy, string> = {
  Low: "#16a34a",
  Moderate: "#f59e0b",
  High: "#dc2626",
};
