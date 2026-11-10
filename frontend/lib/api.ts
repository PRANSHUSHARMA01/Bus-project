import { useEffect, useState, useRef } from "react";

export const API =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined" && window.location.port === "3000"
    ? "http://127.0.0.1:8000"
    : "";

// In-memory instant cache for zero perceived lag across route transitions
const pollCache = new Map<string, any>();

export async function get<T = any>(path: string): Promise<T> {
  const r = await fetch(API + path);
  if (!r.ok) {
    throw new Error(`API GET failed: ${r.status}`);
  }
  const data = await r.json();
  pollCache.set(path, data);
  return data;
}

export async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

/**
 * High-performance polling hook:
 * - Instant paint from in-memory cache (0ms perceived lag)
 * - Auto-pauses when tab is hidden to save battery & network bandwidth
 * - Immediate background revalidation when tab regains focus
 * - Prevents overlapping requests
 */
export function usePoll<T>(path: string | null, ms = 1000): T | null {
  const [data, setData] = useState<T | null>(() => (path ? (pollCache.get(path) ?? null) : null));
  const inFlightRef = useRef(false);
  const lastTextRef = useRef<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    lastTextRef.current = null;

    // Seed state immediately if cache has it
    if (pollCache.has(path)) {
      setData(pollCache.get(path));
    }

    const load = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return; // Pause while tab is backgrounded
      }
      if (inFlightRef.current) return; // Prevent request piling

      inFlightRef.current = true;
      try {
        const res = await fetch(API + path);
        if (res.ok) {
          const text = await res.text();
          if (text === lastTextRef.current) {
            return; // Avoid redundant JSON.parse & React re-render when data hasn't changed
          }
          lastTextRef.current = text;
          const json = JSON.parse(text);
          if (alive) {
            pollCache.set(path, json);
            setData(json);
          }
        }
      } catch {
        // Keep existing cached data on intermittent network blip
      } finally {
        inFlightRef.current = false;
      }
    };

    load();
    const id = ms > 0 ? setInterval(load, ms) : null;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && ms > 0) {
        load();
      }
    };
    if (typeof document !== "undefined" && ms > 0) {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      alive = false;
      if (id !== null) clearInterval(id);
      if (typeof document !== "undefined" && ms > 0) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [path, ms]);

  return data;
}
