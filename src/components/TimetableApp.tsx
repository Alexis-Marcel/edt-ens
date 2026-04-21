"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Calendar from "./Calendar";
import ThemeToggle from "./ThemeToggle";
import ExportMenu from "./ExportMenu";
import { useI18n } from "@/lib/i18n";
import { CLASSES, TimetableEvent } from "@/lib/types";

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUcpMyhtvJxa8F-_HLUV4TzRId3vT5pv_PQuphKtdZqg-2QWikElY0_TSX_TY4aA/pubhtml?gid=819491925&single=true";

export default function TimetableApp() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { locale, t, toggleLocale } = useI18n();

  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    () => new Set(CLASSES.map((c) => c.id))
  );

  // Restore saved selection after hydration
  useEffect(() => {
    const saved = localStorage.getItem("selectedClasses");
    if (saved) {
      try {
        const arr = JSON.parse(saved) as string[];
        if (arr.length > 0) setSelectedClasses(new Set(arr));
      } catch { /* ignore */ }
    }
  }, []);

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
      localStorage.setItem("selectedClasses", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const filteredEvents = events.filter((event) =>
    event.classes.some((c) => selectedClasses.has(c))
  );

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <Sidebar
        selectedClasses={selectedClasses}
        onToggleClass={toggleClass}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <img src="/saphire.png" alt="SAPHIRE" className="h-8 w-8 md:h-10 md:w-10" />
            <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
              {t.title}
            </h1>
            {loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.loading}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden md:block text-right mr-2">
              <p className="text-xs text-gray-400">
                {lastUpdate
                  ? `${t.lastUpdate} : ${lastUpdate.toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-GB")}`
                  : ""}
              </p>
              <p className="text-xs text-gray-400">
                {filteredEvents.length} {t.events}
              </p>
            </div>
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              {t.rawView}
            </a>
            <ExportMenu selectedClasses={selectedClasses} />
            <button
              onClick={toggleLocale}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>
            <ThemeToggle />
          </div>
        </header>
        <Calendar events={filteredEvents} />
      </main>
    </div>
  );
}
