"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

interface DatePickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
  anchorEl: HTMLElement | null;
}

const MONTH_NAMES: Record<string, string[]> = {
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const DAY_NAMES: Record<string, string[]> = {
  fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DatePicker({ currentDate, onSelect, anchorEl }: DatePickerProps) {
  const { locale } = useI18n();
  const [viewDate, setViewDate] = useState(() => startOfMonth(currentDate));
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Position the dropdown below the anchor
  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
    });
  }, [anchorEl]);

  // Close on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node) && anchorEl && !anchorEl.contains(e.target as Node)) {
      onSelect(currentDate); // close without changing
    }
  }, [onSelect, currentDate, anchorEl]);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [handleOutsideClick]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const months = MONTH_NAMES[locale] || MONTH_NAMES.fr;
  const days = DAY_NAMES[locale] || DAY_NAMES.fr;

  // Build calendar grid (Monday = 0)
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  if (!pos) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold">
          {months[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {days.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center text-sm">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, currentDate);
          return (
            <button
              key={date.getTime()}
              onClick={() => onSelect(date)}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors
                ${isSelected
                  ? "bg-blue-600 font-semibold text-white"
                  : isToday
                    ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
        <button
          onClick={() => onSelect(today)}
          className="w-full rounded-lg py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
        >
          {locale === "fr" ? "Aujourd'hui" : "Today"}
        </button>
      </div>
    </div>
  );
}
