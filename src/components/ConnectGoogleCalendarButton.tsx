const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export default function ConnectGoogleCalendarButton() {
  const handleConnect = () => {
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
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&include_granted_scopes=true` +
      `&prompt=consent`;
    window.location.href = url;
  };

  return (
    <button
      onClick={handleConnect}
      className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition w-max"
    >
      Connect Google Calendar
    </button>
  );
}
