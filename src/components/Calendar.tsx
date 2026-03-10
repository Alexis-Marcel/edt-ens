"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TimetableEvent, CLASSES } from "@/lib/types";
import { EventContentArg } from "@fullcalendar/core";

interface CalendarProps {
  events: TimetableEvent[];
}

const CLASS_COLORS: Record<string, string> = {};
for (const cls of CLASSES) {
  CLASS_COLORS[cls.id] = cls.color;
}

function getEventColor(event: TimetableEvent): string {
  if (event.classes.length === 1) {
    return CLASS_COLORS[event.classes[0]] || "#6b7280";
  }
  // Multi-class (common courses) — use a neutral purple
  return "#8b5cf6";
}

export default function Calendar({ events }: CalendarProps) {
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
    <div className="flex-1 overflow-auto p-4 min-h-0">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        locale="fr"
        firstDay={1}
        slotMinTime="07:30:00"
        slotMaxTime="18:00:00"
        slotLabelInterval="00:30:00"
        slotLabelContent={(arg) => {
          if (arg.date.getMinutes() !== 0) return { html: "" };
          return { html: arg.text };
        }}
        allDaySlot={false}
        weekends={false}
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
        <div className="mt-0.5 rounded bg-white/20 px-1 py-0.5 text-[10px] inline-block">
          {group}
        </div>
      ) : null}
      {code && (
        <div className="opacity-40 text-[10px]">{code}</div>
      )}
    </div>
  );
}
