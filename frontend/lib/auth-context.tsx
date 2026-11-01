"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "./api";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "passenger" | "conductor" | "admin";
  language: "en" | "hi";
  avatar_url?: string;
  phone?: string;
  home_stop_id?: string;
  work_stop_id?: string;
  is_new_user?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  token: string | null;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string; isNewUser?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session from self-hosted backend or local cache
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // 1. First attempt: check active session via /api/v1/auth/me (uses httpOnly cookie or stored token)
        const savedToken = typeof window !== "undefined" ? localStorage.getItem("smart_bus_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (savedToken) {
          headers["Authorization"] = `Bearer ${savedToken}`;
        }

        const meRes = await fetch(`${API}/api/v1/auth/me`, {
          method: "GET",
          headers,
          credentials: "include"
        });

        if (meRes.ok) {
          const profile = await meRes.json();
          if (mounted) {
            setUser(profile);
            if (savedToken) setToken(savedToken);
            localStorage.setItem("smart_bus_user", JSON.stringify(profile));
          }
          return;
        }

        // 2. Second attempt: token may need refresh
        const refreshRes = await fetch(`${API}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          credentials: "include"
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (mounted) {
            setUser(data.user);
            setToken(data.access_token);
            localStorage.setItem("smart_bus_user", JSON.stringify(data.user));
            localStorage.setItem("smart_bus_token", data.access_token);
          }
          return;
        }

        // 3. Fallback to localStorage offline profile if present
        const localUserStr = localStorage.getItem("smart_bus_user");
        if (localUserStr) {
          try {
            const parsed = JSON.parse(localUserStr);
            if (mounted) {
              setUser(parsed);
              if (savedToken) setToken(savedToken);
            }
          } catch {
            localStorage.removeItem("smart_bus_user");
            localStorage.removeItem("smart_bus_token");
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      const res = await fetch(`${API}/api/v1/auth/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          language: user?.language || "en",
          purpose: "login"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || "Failed to send verification code. Please try again." };
      }
      return {};
    } catch (err: any) {
      return { error: "Network error connecting to authentication service." };
    }
  };

  const verifyOtp = async (email: string, otpCode: string) => {
    try {
      const res = await fetch(`${API}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || "Invalid or expired verification code." };
      }

      if (data.user) {
        setUser(data.user);
        setToken(data.access_token);
        localStorage.setItem("smart_bus_user", JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem("smart_bus_token", data.access_token);
        }
        return { isNewUser: false };
      }

      return { error: "Unexpected response from authentication service." };
    } catch (err: any) {
      return { error: "Network error during verification." };
    }
  };

  const signInWithGoogle = async () => {
    // Redirect to self-hosted Google OAuth start endpoint
    window.location.href = `${API}/api/v1/auth/google/start`;
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/v1/profile`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const updated = await res.json();
        const merged = { ...user, ...updated };
        setUser(merged);
        localStorage.setItem("smart_bus_user", JSON.stringify(merged));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const signOut = async () => {
    try {
      await fetch(`${API}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        credentials: "include"
      });
    } catch {
      // Ignore network errors on logout
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("smart_bus_user");
    localStorage.removeItem("smart_bus_token");
    router.push("/login");
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/v1/account`, {
        method: "DELETE",
        headers,
        credentials: "include"
      });

      if (res.ok) {
        await signOut();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        token,
        signInWithEmail,
        verifyOtp,
        signInWithGoogle,
        updateProfile,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
