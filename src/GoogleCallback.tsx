import { useEffect } from "react";

export default function GoogleCallback() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");

    if (!accessToken || !idToken) {
      window.location.replace("/");
      return;
    }

    // Keep Google access token for Calendar API calls (client-side)
    localStorage.setItem("google_access_token", accessToken);

    // Exchange the Google id_token for a DRF auth token
    fetch("/api/auth/google/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("minti_auth_token", data.token);
        localStorage.setItem("minti_user", JSON.stringify(data.user));
      })
      .catch((err) => {
        console.error("Google auth exchange failed:", err);
      })
      .finally(() => {
        window.location.replace("/");
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Connecting to Google...</h1>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
