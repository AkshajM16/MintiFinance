import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/services/api";
type Alert = { id: string; budget_name: string; status: string; threshold: number; spent: string; limit: string; period_start: string; period_end: string };

export function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch("/api/alerts?limit=10", { headers: getAuthHeaders(), signal: controller.signal });
        if (!response.ok) throw new Error("Alerts unavailable");
        const data = await response.json();
        setAlerts(data.results); setError(false);
      } catch { if (!controller.signal.aborted) setError(true); }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 3000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  return <section aria-label="Budget alerts" className="mb-6 rounded-xl border border-gray-700 bg-gray-900/70 p-4 text-white">
    <h2 className="font-semibold">Budget alerts</h2>
    {error && <p role="status">Unable to refresh alerts. Retrying shortly.</p>}
    {!error && alerts.length === 0 && <p className="text-sm text-gray-400">No budget thresholds reached yet.</p>}
    <ul className="space-y-2 mt-2" aria-live="polite">{alerts.map(alert => <li key={alert.id} className={alert.threshold === 100 ? "text-red-300" : "text-amber-200"}>
      <strong>{alert.status}: {alert.budget_name}</strong> — {alert.threshold}% threshold reached.
      <span className="block text-sm">${Number(alert.spent).toFixed(2)} spent of ${Number(alert.limit).toFixed(2)} · {alert.period_start.slice(0, 10)} to {alert.period_end.slice(0, 10)} (UTC, end exclusive)</span>
    </li>)}</ul>
  </section>;
}
