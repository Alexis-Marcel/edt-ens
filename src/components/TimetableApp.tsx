"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Calendar from "./Calendar";
import { CLASSES, TimetableEvent } from "@/lib/types";


export default function TimetableApp() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    () => new Set(CLASSES.map((c) => c.id))
  );

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/timetable");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data: TimetableEvent[] = await res.json();
      setEvents(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const toggleClass = useCallback((classId: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  }, []);

  const filteredEvents = events.filter((event) => {
    return event.classes.some((c) => selectedClasses.has(c));
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        selectedClasses={selectedClasses}
        onToggleClass={toggleClass}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Emploi du temps — SAPHIRE
            </h1>
            {loading && (
              <p className="text-sm text-gray-500">Chargement...</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {lastUpdate
                ? `Dernière MAJ : ${lastUpdate.toLocaleTimeString("fr-FR")}`
                : ""}
            </p>
            <p className="text-xs text-gray-400">
              {filteredEvents.length} événements
            </p>
          </div>
        </header>
        <Calendar events={filteredEvents} />
      </main>
    </div>
  );
}
