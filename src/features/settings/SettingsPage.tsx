import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useTheme } from "@/lib/theme";
import { User } from "@/types";

interface SettingsPageProps {
  user: User;
  calendarConnected: boolean;
  onSignOut: () => void;
  onResyncCalendar: () => Promise<void>;
}

export function SettingsPage({ user, calendarConnected, onSignOut, onResyncCalendar }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const [defaultBudget, setDefaultBudget] = useState("2000");
  const [currency, setCurrency] = useState("USD");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  useEffect(() => {
    const budget = localStorage.getItem("minti_default_budget");
    const preferredCurrency = localStorage.getItem("minti_currency");
    if (budget) setDefaultBudget(budget);
    if (preferredCurrency) setCurrency(preferredCurrency);
  }, []);

  const saveDefaults = () => {
    localStorage.setItem("minti_default_budget", defaultBudget);
    localStorage.setItem("minti_currency", currency);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your profile, calendar sync, and budgeting defaults.</p>
      </div>

      <Card className="glass">
        <CardContent className="p-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-gray-300">Name: {user.name || "Not provided"}</p>
          <p className="text-gray-300">Email: {user.email}</p>
          {user.picture && (
            <img
              src={user.picture}
              alt="User avatar"
              className="w-12 h-12 rounded-full border border-gray-600 mt-2"
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Calendar</h2>
          <p className="text-gray-300">
            Status: {calendarConnected ? "Connected" : "Not connected"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onResyncCalendar}>Re-sync</Button>
            <Button variant="danger" onClick={() => {
              localStorage.removeItem("google_access_token");
              localStorage.removeItem("google_id_token");
              window.location.reload();
            }}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Budget Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              value={defaultBudget}
              onChange={(e) => setDefaultBudget(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              placeholder="Default monthly budget"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <Button onClick={saveDefaults}>Save Defaults</Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
            Email alerts
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={inAppNotifications}
              onChange={(e) => setInAppNotifications(e.target.checked)}
            />
            In-app notifications
          </label>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Theme</h2>
            <p className="text-gray-400">Switch between light and dark mode.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Use light mode" : "Use dark mode"}
          </Button>
        </CardContent>
      </Card>

      <Button variant="danger" onClick={onSignOut}>Sign out</Button>
    </div>
  );
}
