const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

export default function GoogleLoginButton() {
  const handleLogin = () => {
    if (!CLIENT_ID) {
      alert(
        "Missing VITE_GOOGLE_CLIENT_ID. Please configure your environment."
      );
      return;
    }
    const REDIRECT_URI = `${window.location.origin}/google-callback`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${REDIRECT_URI}` +
      `&response_type=token id_token` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&include_granted_scopes=true` +
      `&prompt=consent` +
      `&nonce=${Date.now()}`;
    window.location.href = url;
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold mt-4"
    >
      Sign in with Google
    </button>
  );
}
