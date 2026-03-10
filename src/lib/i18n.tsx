"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type Locale = "fr" | "en";

interface Translations {
  title: string;
  classes: string;
  loading: string;
  lastUpdate: string;
  events: string;
}

const translations: Record<Locale, Translations> = {
  fr: {
    title: "EDT — SAPHIRE",
    classes: "Classes",
    loading: "Chargement...",
    lastUpdate: "MAJ",
    events: "événements",
  },
  en: {
    title: "Timetable — SAPHIRE",
    classes: "Classes",
    loading: "Loading...",
    lastUpdate: "Updated",
    events: "events",
  },
};

interface I18nContextType {
  locale: Locale;
  t: Translations;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "fr",
  t: translations.fr,
  toggleLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "en" || saved === "fr") setLocale(saved);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "fr" ? "en" : "fr";
      localStorage.setItem("locale", next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
