"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TimetableEvent, CLASSES } from "@/lib/types";
import { EventContentArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import enLocale from "@fullcalendar/core/locales/en-gb";
import { useI18n } from "@/lib/i18n";

interface CalendarProps {
  events: TimetableEvent[];
}

const CLASS_COLORS: Record<string, string> = {};
for (const cls of CLASSES) {
  CLASS_COLORS[cls.id] = cls.color;
}

function getEventColor(event: TimetableEvent): string {
  if (event.type === "EXAMEN") return "#dc2626";
  if (event.classes.length === 1) {
    return CLASS_COLORS[event.classes[0]] || "#6b7280";
  }
  return "#8b5cf6";
}

export default function Calendar({ events }: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { locale } = useI18n();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const view = isMobile ? "timeGridDay" : "timeGridWeek";
    if (api.view.type !== view) api.changeView(view);
    api.setOption("headerToolbar", isMobile
      ? { left: "prev,next", center: "title", right: "today" }
      : { left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }
    );
  }, [isMobile]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    queueMicrotask(() => {
      api.setOption("locale", locale === "fr" ? frLocale : enLocale);
    });
  }, [locale]);

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: getEventColor(e),
    borderColor: getEventColor(e),
    extendedProps: {
      location: e.location,
      teacher: e.teacher,
      group: e.group,
      classes: e.classes,
      code: e.code,
      type: e.type,
    },
  }));

  return (
    <div className="min-h-0 flex-1 overflow-auto p-2 md:p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        locale={locale === "fr" ? frLocale : enLocale}
        firstDay={1}
        slotMinTime="07:30:00"
        slotMaxTime="18:00:00"
        slotLabelInterval="00:30:00"
        slotLabelContent={(arg) => {
          if (arg.date.getMinutes() !== 0) return { html: "" };
          return { html: arg.text };
        }}
        allDaySlot={false}
        weekends
        hiddenDays={[0]}
        height="100%"
        slotDuration="00:30:00"
        expandRows
        events={fcEvents}
        eventContent={renderEventContent}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        nowIndicator
      />
    </div>
  );
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function renderEventContent(eventInfo: EventContentArg) {
  const { location, teacher, group, code } = eventInfo.event.extendedProps;
  const startTime = formatTime(eventInfo.event.start);
  const endTime = formatTime(eventInfo.event.end);
  return (
    <div className="overflow-hidden p-1 text-xs leading-tight">
      <div className="font-medium opacity-80">{startTime} - {endTime}</div>
      <div className="font-semibold">{eventInfo.event.title}</div>
      {teacher && <div className="mt-0.5 opacity-80">{teacher}</div>}
      {location && <div className="opacity-60">{location}</div>}
      {group && typeof group === "string" && group.includes("\n") ? (
        <div className="mt-0.5 space-y-0.5">
          {group.split("\n").map((line: string, i: number) => (
            <div key={i} className="rounded bg-white/20 px-1 py-0.5 text-[10px]">
              {line}
            </div>
          ))}
        </div>
      ) : group ? (
        <div className="mt-0.5 inline-block rounded bg-white/20 px-1 py-0.5 text-[10px]">
          {group}
        </div>
      ) : null}
      {code && (
        <div className="text-[10px] opacity-40">{code}</div>
      )}
    </div>
  );
}
