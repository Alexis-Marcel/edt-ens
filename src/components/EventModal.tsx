"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

interface EventModalProps {
  event: {
    title: string;
    start: Date | null;
    end: Date | null;
    backgroundColor: string;
    location?: string;
    teacher?: string;
    group?: string;
    code?: string;
    type?: string;
    classes?: string[];
  };
  onClose: () => void;
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function EventModal({ event, onClose }: EventModalProps) {
  const { locale } = useI18n();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const labels = locale === "fr"
    ? { teacher: "Enseignant", room: "Salle", type: "Type", code: "Code", group: "Groupe", close: "Fermer" }
    : { teacher: "Teacher", room: "Room", type: "Type", code: "Code", group: "Group", close: "Close" };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Color bar */}
        <div className="h-2 rounded-t-xl" style={{ backgroundColor: event.backgroundColor }} />

        <div className="p-5">
          {/* Title */}
          <h2 className="text-lg font-bold">{event.title}</h2>

          {/* Date & time */}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(event.start, locale)} · {formatTime(event.start)} – {formatTime(event.end)}
          </p>

          {/* Details */}
          <div className="mt-4 space-y-2.5 text-sm">
            {event.teacher && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 font-medium text-gray-500 dark:text-gray-400">{labels.teacher}</span>
                <span>{event.teacher}</span>
              </div>
            )}
            {event.location && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 font-medium text-gray-500 dark:text-gray-400">{labels.room}</span>
                <span>{event.location}</span>
              </div>
            )}
            {event.type && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 font-medium text-gray-500 dark:text-gray-400">{labels.type}</span>
                <span>{event.type}</span>
              </div>
            )}
            {event.code && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 font-medium text-gray-500 dark:text-gray-400">{labels.code}</span>
                <span>{event.code}</span>
              </div>
            )}
            {event.group && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 font-medium text-gray-500 dark:text-gray-400">{labels.group}</span>
                <div className="flex flex-wrap gap-1">
                  {event.group.includes("\n") ? (
                    event.group.split("\n").map((line, i) => (
                      <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                        {line}
                      </span>
                    ))
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                      {event.group}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-gray-100 py-2 text-sm font-medium transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
}
