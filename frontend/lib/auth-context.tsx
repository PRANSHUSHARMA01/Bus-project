"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase/client";

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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Load session from Supabase or persistent dev session
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const jwtToken = session.access_token;
          if (mounted) setToken(jwtToken);
          // Fetch profile from backend
          const res = await fetch(`${BACKEND_URL}/v1/me`, {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          if (res.ok) {
            const profile = await res.json();
            if (mounted) setUser(profile);
          } else {
            // Fallback profile from user metadata
            const meta = session.user.user_metadata || {};
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || "user@example.com",
                full_name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "Passenger",
                role: "passenger",
                language: "en",
                avatar_url: meta.avatar_url,
              });
            }
          }
        } else {
          // Check for saved local session
          const localUserStr = localStorage.getItem("smart_bus_user");
          const localToken = localStorage.getItem("smart_bus_token");
          if (localUserStr && localToken) {
            try {
              const parsed = JSON.parse(localUserStr);
              if (mounted) {
                setUser(parsed);
                setToken(localToken);
              }
            } catch (e) {
              localStorage.removeItem("smart_bus_user");
              localStorage.removeItem("smart_bus_token");
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const jwtToken = session.access_token;
        setToken(jwtToken);
        const meta = session.user.user_metadata || {};
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || "user@example.com",
          full_name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "Passenger",
          role: "passenger",
          language: "en",
          avatar_url: meta.avatar_url,
        };
        setUser(profile);
        localStorage.setItem("smart_bus_user", JSON.stringify(profile));
        localStorage.setItem("smart_bus_token", jwtToken);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setToken(null);
        localStorage.removeItem("smart_bus_user");
        localStorage.removeItem("smart_bus_token");
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      const otpPromise = supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      const timeoutPromise = new Promise<{ error?: any }>((resolve) =>
        setTimeout(() => resolve({}), 2500)
      );
      const res: any = await Promise.race([otpPromise, timeoutPromise]);
      if (res && res.error && !res.error.message?.includes("fetch")) {
        return { error: res.error.message };
      }
      return {};
    } catch (err: any) {
      return {};
    }
  };

  const verifyOtp = async (email: string, otpToken: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: "email"
      });

      if (data?.session && data.user) {
        const jwtToken = data.session.access_token;
        setToken(jwtToken);
        const isNew = !data.user.last_sign_in_at || data.user.created_at === data.user.last_sign_in_at;

        // Fetch / create backend profile
        const res = await fetch(`${BACKEND_URL}/v1/me`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        const profileData = res.ok ? await res.json() : {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.email?.split("@")[0] || "Passenger",
          role: "passenger",
          language: "en"
        };

        setUser(profileData);
        localStorage.setItem("smart_bus_user", JSON.stringify(profileData));
        localStorage.setItem("smart_bus_token", jwtToken);
        return { isNewUser: isNew };
      }

      // Dev fallback OTP verification (any 6 digit code for dev)
      if (otpToken.length === 6) {
        const devUserId = "usr_" + Math.random().toString(36).substring(2, 9);
        const name = email.split("@")[0].replace(/[._]/g, " ");
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const devToken = `dev-user-${devUserId}-passenger`;
        const devProfile: UserProfile = {
          id: devUserId,
          email,
          full_name: formattedName,
          role: "passenger",
          language: "en",
          is_new_user: true
        };
        setUser(devProfile);
        setToken(devToken);
        localStorage.setItem("smart_bus_user", JSON.stringify(devProfile));
        localStorage.setItem("smart_bus_token", devToken);
        return { isNewUser: true };
      }

      return { error: error?.message || "Invalid OTP code" };
    } catch (err: any) {
      // Dev mode fallback
      const devUserId = "usr_" + Math.random().toString(36).substring(2, 9);
      const name = email.split("@")[0];
      const devToken = `dev-user-${devUserId}-passenger`;
      const devProfile: UserProfile = {
        id: devUserId,
        email,
        full_name: name.charAt(0).toUpperCase() + name.slice(1),
        role: "passenger",
        language: "en",
        is_new_user: true
      };
      setUser(devProfile);
      setToken(devToken);
      localStorage.setItem("smart_bus_user", JSON.stringify(devProfile));
      localStorage.setItem("smart_bus_token", devToken);
      return { isNewUser: true };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
    } catch (err) {
      // Dev mock sign-in with Google
      const devUserId = "google_user_pranshu";
      const devToken = `dev-user-${devUserId}-passenger`;
      const devProfile: UserProfile = {
        id: devUserId,
        email: "pranshu@example.com",
        full_name: "Pranshu",
        role: "passenger",
        language: "en",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Pranshu",
        is_new_user: false
      };
      setUser(devProfile);
      setToken(devToken);
      localStorage.setItem("smart_bus_user", JSON.stringify(devProfile));
      localStorage.setItem("smart_bus_token", devToken);
      router.push("/");
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("smart_bus_user", JSON.stringify(updated));

    if (token) {
      try {
        await fetch(`${BACKEND_URL}/v1/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      } catch (e) {
        console.error("Failed to sync profile update with backend:", e);
      }
    }
    return true;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem("smart_bus_user");
    localStorage.removeItem("smart_bus_token");
    router.push("/login");
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/v1/me`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
    await signOut();
    return true;
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
        deleteAccount
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
