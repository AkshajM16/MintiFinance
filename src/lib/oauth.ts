export async function startGoogleLogin() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) { alert("Google sign-in is not configured."); return; }
  try {
    const response = await fetch("/api/auth/google/start/");
    if (!response.ok) throw new Error("Login unavailable");
    const { state, nonce } = await response.json();
    sessionStorage.setItem("minti_oauth_state", state);
    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: `${window.location.origin}/google-callback`,
      response_type: "token id_token", scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
      state, nonce, prompt: "consent",
    });
    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch { alert("Sign-in is temporarily unavailable. Please try again."); }
}
