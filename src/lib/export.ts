import { createHash } from "crypto";
import { TimetableEvent } from "./types";

export function filterByClasses(
  events: TimetableEvent[],
  classes: string[] | null,
): TimetableEvent[] {
  if (!classes || classes.length === 0) return events;
  const set = new Set(classes);
  return events.filter((e) => e.classes.some((c) => set.has(c)));
}

export function parseClassesParam(param: string | null): string[] | null {
  if (param === null) return null;
  const parts = param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [];
}

/* ------------------------------- CSV ------------------------------- */

function csvEscape(value: string | undefined | null): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function formatTimeOnly(iso: string): string {
  return iso.slice(11, 16);
}

export function eventsToCsv(events: TimetableEvent[]): string {
  const header = [
    "Date",
    "Début",
    "Fin",
    "Code",
    "Cours",
    "Type",
    "Classes",
    "Groupe",
    "Salle",
    "Enseignant",
  ];
  const lines = [header.join(",")];

  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));

  for (const e of sorted) {
    const titleWithoutType = e.type
      ? e.title.replace(new RegExp(`\\s+—\\s+${e.type}$`), "")
      : e.title;
    const row = [
      formatDateOnly(e.start),
      formatTimeOnly(e.start),
      formatTimeOnly(e.end),
      e.code || "",
      titleWithoutType,
      e.type || "",
      e.classes.join(","),
      (e.group || "").replace(/\n/g, " / "),
      e.location || "",
      e.teacher || "",
    ].map(csvEscape);
    lines.push(row.join(","));
  }

  return "﻿" + lines.join("\r\n") + "\r\n";
}

/* ------------------------------- ICS ------------------------------- */

const CRLF = "\r\n";
const PRODID = "-//EDT SAPHIRE//FR";

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  let first = true;
  while (i < bytes.length) {
    const take = first ? 75 : 74;
    let end = Math.min(i + take, bytes.length);
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    chunks.push((first ? "" : " ") + bytes.slice(i, end).toString("utf8"));
    i = end;
    first = false;
  }
  return chunks.join(CRLF);
}

function formatLocalDateTime(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!m) throw new Error(`Invalid ISO datetime: ${iso}`);
  return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6]}`;
}

function formatUtcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function stableUid(e: TimetableEvent): string {
  const seed = [
    e.start,
    e.end,
    e.code || "",
    e.classes.join(","),
    e.group || "",
    e.location || "",
    e.title,
  ].join("|");
  const hash = createHash("sha1").update(seed).digest("hex").slice(0, 24);
  return `${hash}@edt-saphire`;
}

const PARIS_VTIMEZONE: string[] = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "X-LIC-LOCATION:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function eventsToIcs(
  events: TimetableEvent[],
  options: { calendarName?: string } = {},
): string {
  const stamp = formatUtcStamp(new Date());
  const name = options.calendarName || "EDT SAPHIRE";

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(name)}`,
    "X-WR-TIMEZONE:Europe/Paris",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...PARIS_VTIMEZONE,
  ];

  const body: string[] = [];
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));

  for (const e of sorted) {
    const descLines: string[] = [];
    if (e.code) descLines.push(`Code : ${e.code}`);
    if (e.type) descLines.push(`Type : ${e.type}`);
    if (e.teacher) descLines.push(`Enseignant : ${e.teacher}`);
    if (e.group) descLines.push(`Groupe : ${e.group.replace(/\n/g, " / ")}`);
    if (e.classes.length) descLines.push(`Classes : ${e.classes.join(", ")}`);
    const description = descLines.join("\n");

    const ev = [
      "BEGIN:VEVENT",
      `UID:${stableUid(e)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Paris:${formatLocalDateTime(e.start)}`,
      `DTEND;TZID=Europe/Paris:${formatLocalDateTime(e.end)}`,
      `SUMMARY:${icsEscape(e.title)}`,
    ];
    if (e.location) ev.push(`LOCATION:${icsEscape(e.location)}`);
    if (description) ev.push(`DESCRIPTION:${icsEscape(description)}`);
    if (e.classes.length) ev.push(`CATEGORIES:${e.classes.map(icsEscape).join(",")}`);
    ev.push("END:VEVENT");

    body.push(...ev);
  }

  const footer = ["END:VCALENDAR"];
  const all = [...header, ...body, ...footer].map(foldLine);
  return all.join(CRLF) + CRLF;
}
