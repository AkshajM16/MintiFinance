import { useState, useEffect, useCallback } from "react";
import { CalendarEvent, User } from "@/types";
import { eventsApi } from "@/services/api";
import { fetchGoogleCalendarEvents, analyzeEvent } from "@/utils/calendar";

export function useCalendar(user: User | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.list();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const syncCalendar = useCallback(
    async (accessToken: string) => {
      if (!user) return;

      try {
        setSyncing(true);
        setError(null);

        const rawEvents = await fetchGoogleCalendarEvents(accessToken);

        const analyzed = rawEvents.map((event: any) => {
          const analysis = analyzeEvent(event);
          return {
            id: event.id,
            title: event.summary || "Untitled Event",
            description: event.description || "",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            category: analysis.category,
            spendingProbability: analysis.spendingProbability,
            expectedSpendingRange: analysis.expectedSpendingRange,
            spendingCategories: analysis.spendingCategories,
            confidence: analysis.confidence,
            keywords: analysis.keywords,
            raw: event,
          };
        });

        // Sync with Django backend (no user object needed — auth token handles it)
        await eventsApi.sync(analyzed);

        await fetchEvents();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to sync calendar"
        );
        console.error("Calendar sync error:", err);
      } finally {
        setSyncing(false);
      }
    },
    [user, fetchEvents]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    syncing,
    fetchEvents,
    syncCalendar,
  };
}
