import { useEffect, useState } from "react";

export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function get<T = any>(path: string): Promise<T> {
  const r = await fetch(API + path);
  if (!r.ok) {
    throw new Error(`API GET failed: ${r.status}`);
  }
  return r.json();
}

export async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

/** Fetch `path` now and then every `ms` milliseconds. Returns the latest data (or null). */
export function usePoll<T>(path: string | null, ms = 1000): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!path) return;
    let alive = true;

    const load = () =>
      fetch(API + path)
        .then((r) => r.json())
        .then((d) => alive && setData(d))
        .catch(() => {});

    load();
    const id = setInterval(load, ms);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [path, ms]);

  return data;
}
