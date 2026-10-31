import { startGoogleLogin } from "@/lib/oauth";
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

  const login = useCallback(() => { void startGoogleLogin(); }, []);

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
