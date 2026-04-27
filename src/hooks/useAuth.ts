import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("minti_user");
    const token = localStorage.getItem("minti_auth_token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("minti_user");
        localStorage.removeItem("minti_auth_token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(() => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      alert(
        "Missing VITE_GOOGLE_CLIENT_ID. Please configure your environment."
      );
      return;
    }
    const REDIRECT_URI = `${window.location.origin}/google-callback`;
    const SCOPE =
      "https://www.googleapis.com/auth/calendar.readonly openid email profile";

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=token id_token` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&nonce=nonce` +
      `&prompt=consent`;

    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("minti_auth_token");
    localStorage.removeItem("minti_user");
    localStorage.removeItem("google_access_token");
    setUser(null);
  }, []);

  const getAccessToken = useCallback(() => {
    return localStorage.getItem("google_access_token");
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    getAccessToken,
    isAuthenticated: !!user,
  };
}
