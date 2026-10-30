/**
 * Smart Public Bus Tracking & Fleet Management System
 * Universal Type-Safe API Client
 * Location: Delhi, India
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ==============================================================================
// 1. TYPE DECLARATIONS & INTERFACES
// ==============================================================================

export interface Stop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  route: string;
}

export interface RouteInfo {
  id: string;
  name: string;
  color: string;
  description: string;
  stop_ids: number[];
  bus_count: number;
}

export interface BusLive {
  bus_id: string;
  route: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  passengers: number;
  capacity: number;
  occupancy_rate: number;
  crowd_status: "Comfortable" | "Standing Room Only" | "Overcrowded";
  status: "active" | "emergency" | "idle";
  next_stop_id?: number;
  next_stop_name?: string;
  last_updated: string;
}

export interface ArrivalItem {
  bus_id: string;
  route: string;
  distance_km: number;
  eta_min: number;
  speed_kmh: number;
  passengers: number;
  capacity: number;
}

export interface StopArrivalsResponse {
  stop_id: number;
  stop_name: string;
  route: string;
  arrivals: ArrivalItem[];
}

export interface BusOccupancyResponse {
  bus_id: string;
  route: string;
  passengers: number;
  capacity: number;
  occupancy_pct: number;
  is_overcrowded: boolean;
  status: string;
  historical_avg_passengers: number;
}

export interface AlertItem {
  id: number;
  bus_id: string;
  route: string;
  type: "BUNCHING" | "OVERCROWDING" | "SOS";
  sub_type?: string;
  message: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  lat?: number;
  lng?: number;
}

export interface ForecastResponse {
  route: string;
  hour: number;
  predicted_passengers_per_hour: number;
  model_source: string;
  peak_status: string;
}

export interface AdviceItem {
  id: number;
  type: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  source_route: string | null;
  target_route: string | null;
  recommended_transfers: number;
  rationale: string;
  action: string;
  projected_wait_reduction_min: number;
}

export interface AdviceResponse {
  fleet_averages: {
    Route_A_occupancy_pct: number;
    Route_B_occupancy_pct: number;
    Route_C_occupancy_pct: number;
  };
  recommendations: AdviceItem[];
}

export interface WhatIfResponse {
  route: string;
  baseline_buses: number;
  simulated_buses: number;
  demand_multiplier: number;
  baseline_headway_minutes: number;
  projected_headway_minutes: number;
  wait_time_reduction_minutes: number;
  projected_bus_occupancy_pct: number;
  crowding_risk: "HIGH" | "MODERATE" | "LOW";
  hourly_operational_cost_delta_inr: number;
}

// ==============================================================================
// 2. NETWORK HELPER WRAPPER FUNCTIONS
// ==============================================================================

async function safeFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Fetch failed for [${endpoint}]:`, error);
    throw error;
  }
}

// ==============================================================================
// 3. API CLIENT SERVICE METHODS
// ==============================================================================

export async function fetchHealth(): Promise<{ status: string; active_buses: number }> {
  return safeFetch("/health");
}

export async function fetchStops(route?: string): Promise<Stop[]> {
  const q = route ? `?route=${encodeURIComponent(route)}` : "";
  return safeFetch<Stop[]>(`/stops${q}`);
}

export async function fetchRoutes(): Promise<RouteInfo[]> {
  return safeFetch<RouteInfo[]>("/routes");
}

export async function fetchLiveBuses(): Promise<BusLive[]> {
  return safeFetch<BusLive[]>("/buses/live");
}

export async function fetchStopArrivals(stopId: number): Promise<StopArrivalsResponse> {
  return safeFetch<StopArrivalsResponse>(`/stops/${stopId}/arrivals`);
}

export async function fetchBusOccupancy(busId: string): Promise<BusOccupancyResponse> {
  return safeFetch<BusOccupancyResponse>(`/buses/${encodeURIComponent(busId)}/occupancy`);
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  return safeFetch<AlertItem[]>("/alerts");
}

export async function ingestBoarding(payload: {
  bus_id: string;
  boarded?: number;
  alighted?: number;
  current_passengers?: number;
}): Promise<void> {
  await safeFetch("/ingest/boarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function triggerSosAlert(payload: {
  bus_id: string;
  alert_type: "BREAKDOWN" | "MEDICAL" | "ACCIDENT" | "SECURITY";
  message: string;
  lat?: number;
  lng?: number;
}): Promise<void> {
  await safeFetch("/alerts/sos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchForecast(route: string = "A", hour?: number): Promise<ForecastResponse> {
  const q = hour !== undefined ? `?route=${route}&hour=${hour}` : `?route=${route}`;
  return safeFetch<ForecastResponse>(`/forecast${q}`);
}

export async function fetchAdvice(): Promise<AdviceResponse> {
  return safeFetch<AdviceResponse>("/advice");
}

export async function fetchWhatIf(
  route: string,
  addBuses: number,
  demandMultiplier: number
): Promise<WhatIfResponse> {
  return safeFetch<WhatIfResponse>(
    `/whatif?route=${route}&add_buses=${addBuses}&demand_multiplier=${demandMultiplier}`
  );
}
