"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { CLASSES } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  selectedClasses: Set<string>;
  onToggleClass: (classId: string) => void;
  spreadsheetUrl: string;
}

function buildQuery(classes: Set<string>): string {
  const list = [...classes].sort();
  if (list.length === 0) return "";
  return `?classes=${encodeURIComponent(list.join(","))}`;
}

export default function MobileMenu({
  open,
  onClose,
  selectedClasses,
  onToggleClass,
  spreadsheetUrl,
}: MobileMenuProps) {
  const { locale, t, toggleLocale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const labels =
    locale === "fr"
      ? {
          classes: "Classes",
          export: "Exporter",
          csv: "Télécharger en CSV",
          subscribe: "S'abonner (Apple Calendar)",
          copy: "Copier le lien iCal",
          copied: "Lien copié !",
          googleHint: "Google Calendar : « Ajouter depuis URL ».",
          appleHint: "Apple Calendar : se met à jour automatiquement.",
          noClasses: "Sélectionne au moins une classe",
          more: "Plus",
          rawView: t.rawView,
          language: "Langue",
          theme: "Thème",
          light: "Clair",
          dark: "Sombre",
          close: "Fermer",
        }
      : {
          classes: "Classes",
          export: "Export",
          csv: "Download as CSV",
          subscribe: "Subscribe (Apple Calendar)",
          copy: "Copy iCal link",
          copied: "Link copied!",
          googleHint: "Google Calendar: “Add from URL”.",
          appleHint: "Apple Calendar auto-refreshes.",
          noClasses: "Select at least one class",
          more: "More",
          rawView: t.rawView,
          language: "Language",
          theme: "Theme",
          light: "Light",
          dark: "Dark",
          close: "Close",
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

  const isDark = resolvedTheme === "dark";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={!open}
        aria-label="Menu"
        {...(!open && { inert: "" as unknown as boolean })}
        className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl transition-transform dark:border-gray-700 dark:bg-gray-800 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">EDT — SAPHIRE</h2>
          <button
            onClick={onClose}
            aria-label={labels.close}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M4.28 3.22a.75.75 0 00-1.06 1.06L8.94 10l-5.72 5.72a.75.75 0 101.06 1.06L10 11.06l5.72 5.72a.75.75 0 101.06-1.06L11.06 10l5.72-5.72a.75.75 0 00-1.06-1.06L10 8.94 4.28 3.22z" clipRule="evenodd" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Classes */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {labels.classes}
            </h3>
            <div className="space-y-2">
              {CLASSES.map((cls) => {
                const selected = selectedClasses.has(cls.id);
                return (
                  <label
                    key={cls.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleClass(cls.id)}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: cls.color }}
                    />
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: cls.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {cls.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Export */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {labels.export}
            </h3>
            {hasSelection ? (
              <div className="space-y-1">
                <a
                  href={csvHref}
                  download
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v7.69l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l1.72 1.72V3.75A.75.75 0 0110 3zM3.5 14.25a.75.75 0 01.75.75v1.25c0 .138.112.25.25.25h11a.25.25 0 00.25-.25V15a.75.75 0 011.5 0v1.25A1.75 1.75 0 0115.5 18h-11a1.75 1.75 0 01-1.75-1.75V15a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  </svg>
                  {labels.csv}
                </a>
                <a
                  href={icsWebcalUrl}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zM3.5 8v7.25c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V8h-13z" clipRule="evenodd" />
                  </svg>
                  {labels.subscribe}
                </a>
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                  {copied ? labels.copied : labels.copy}
                </button>
                <p className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">
                  {labels.appleHint} {labels.googleHint}
                </p>
              </div>
            ) : (
              <p className="px-2 text-sm text-gray-500 dark:text-gray-400">{labels.noClasses}</p>
            )}
          </section>

          {/* More */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {labels.more}
            </h3>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              {labels.rawView}
            </a>

            <div className="mt-2 flex items-center justify-between rounded-lg px-2 py-2.5">
              <span className="text-sm text-gray-700 dark:text-gray-200">{labels.language}</span>
              <button
                onClick={toggleLocale}
                className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {locale === "fr" ? "FR → EN" : "EN → FR"}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg px-2 py-2.5">
              <span className="text-sm text-gray-700 dark:text-gray-200">{labels.theme}</span>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {isDark ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
                    </svg>
                    {labels.dark}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
                    </svg>
                    {labels.light}
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
