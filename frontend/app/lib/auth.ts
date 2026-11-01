"use client";

export interface UserSession {
  token: string;
  role: "admin" | "conductor" | "passenger";
  email: string;
  name: string;
}

const TOKEN_KEY = "delhi_transit_token";
const USER_KEY = "delhi_transit_user";

export function saveSession(session: UserSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function hasRole(allowed: ("admin" | "conductor" | "passenger")[]): boolean {
  const session = getSession();
  if (!session) return false;
  return allowed.includes(session.role);
}
