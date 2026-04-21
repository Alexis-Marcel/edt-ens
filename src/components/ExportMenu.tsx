"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface ExportMenuProps {
  selectedClasses: Set<string>;
}

function buildQuery(classes: Set<string>): string {
  const list = [...classes].sort();
  if (list.length === 0) return "";
  return `?classes=${encodeURIComponent(list.join(","))}`;
}

export default function ExportMenu({ selectedClasses }: ExportMenuProps) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const labels =
    locale === "fr"
      ? {
          button: "Exporter",
          csv: "Télécharger en CSV",
          ics: "Lien iCalendar",
          copy: "Copier le lien",
          copied: "Lien copié !",
          subscribe: "S'abonner (Apple Calendar)",
          googleHint:
            "Google Calendar : Ajouter un agenda → « À partir de l'URL » → coller le lien iCal. Google actualise ~toutes les 24 h.",
          appleHint:
            "Apple Calendar se met à jour automatiquement (fréquence réglable dans les préférences du calendrier).",
          noSelection: "Sélectionne au moins une classe",
        }
      : {
          button: "Export",
          csv: "Download as CSV",
          ics: "iCalendar link",
          copy: "Copy link",
          copied: "Link copied!",
          subscribe: "Subscribe (Apple Calendar)",
          googleHint:
            "Google Calendar: Add calendar → “From URL” → paste the iCal link. Google refreshes ~every 24h.",
          appleHint:
            "Apple Calendar auto-refreshes (interval configurable in calendar preferences).",
          noSelection: "Select at least one class",
        };

  const hasSelection = selectedClasses.size > 0;
  const query = buildQuery(selectedClasses);
  const csvHref = `/api/export/csv${query}`;

  const icsPath = `/api/export/ics${query}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const icsHttpsUrl = origin ? `${origin}${icsPath}` : icsPath;
  const icsWebcalUrl = origin ? icsHttpsUrl.replace(/^https?:/, "webcal:") : icsPath;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(icsHttpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be unavailable
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {labels.button}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          {!hasSelection ? (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {labels.noSelection}
            </p>
          ) : (
            <>
              <a
                href={csvHref}
                download
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v7.69l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l1.72 1.72V3.75A.75.75 0 0110 3zM3.5 14.25a.75.75 0 01.75.75v1.25c0 .138.112.25.25.25h11a.25.25 0 00.25-.25V15a.75.75 0 011.5 0v1.25A1.75 1.75 0 0115.5 18h-11a1.75 1.75 0 01-1.75-1.75V15a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
                {labels.csv}
              </a>

              <div className="mx-2 my-1 border-t border-gray-100 dark:border-gray-700" />

              <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {labels.ics}
              </div>

              <a
                href={icsWebcalUrl}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zM3.5 8v7.25c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V8h-13z" clipRule="evenodd" />
                </svg>
                {labels.subscribe}
              </a>

              <button
                onClick={handleCopy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
                {copied ? labels.copied : labels.copy}
              </button>

              <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                {labels.appleHint}
              </p>
              <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                {labels.googleHint}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
