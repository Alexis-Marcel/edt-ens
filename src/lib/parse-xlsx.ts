import {
  TimetableEvent,
  COURSE_NAMES,
  COURSE_CLASSES,
} from "./types";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUcpMyhtvJxa8F-_HLUV4TzRId3vT5pv_PQuphKtdZqg-2QWikElY0_TSX_TY4aA/pub?gid=819491925&single=true&output=csv";

// Time slots as they appear in col 0
const TIME_SLOTS: Record<string, { startH: number; startM: number; endH: number; endM: number }> = {
  "8h-9h":         { startH: 8,  startM: 0,  endH: 9,  endM: 0 },
  "9h-10h":        { startH: 9,  startM: 0,  endH: 10, endM: 0 },
  "10h15-11h15":   { startH: 10, startM: 15, endH: 11, endM: 15 },
  "11h15-12h15":   { startH: 11, startM: 15, endH: 12, endM: 15 },
  "13h30-14h30":   { startH: 13, startM: 30, endH: 14, endM: 30 },
  "14h30-15h30":   { startH: 14, startM: 30, endH: 15, endM: 30 },
  "15h45-16h45":   { startH: 15, startM: 45, endH: 16, endM: 45 },
  "16h45-17h45":   { startH: 16, startM: 45, endH: 17, endM: 45 },
};

// Day names as they appear in the spreadsheet
const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// Rows per day block (header + 4 morning + 1 continuation + 4 afternoon + 2 separators = 12)
const ROWS_PER_DAY = 12;

// Column offset ranges within each 18-col week block
// Each track gets 6 columns; we scan all of them for content
interface TrackRange {
  id: string;
  classes: string[];
  min: number;
  max: number; // inclusive
}
const TRACKS: TrackRange[] = [
  { id: "GC", classes: ["GC"], min: 0, max: 5 },
  { id: "GM", classes: ["GM"], min: 6, max: 11 },
  { id: "GE", classes: ["GE"], min: 12, max: 17 },
];

// French month names for date parsing
const FRENCH_MONTHS: Record<string, number> = {
  "janvier": 0, "février": 1, "mars": 2, "avril": 3,
  "mai": 4, "juin": 5, "juillet": 6, "août": 7,
  "septembre": 8, "octobre": 9, "novembre": 10, "décembre": 11,
};

function parseFrenchDate(dateStr: string): Date | null {
  // "26 janvier 2026"
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = FRENCH_MONTHS[parts[1].toLowerCase()];
  const year = parseInt(parts[2]);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n") {
        row.push(current);
        current = "";
        rows.push(row);
        row = [];
      } else if (ch === "\r") {
        // skip
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function extractCourseCode(text: string): string | null {
  // Match patterns like "225", "212", "UE225", etc.
  const match = text.match(/\b(2[0-4]\d)\b/);
  return match ? match[1] : null;
}

function extractCourseType(text: string): string | null {
  const match = text.match(/\b(CM\d*|TD\d*|TP\d*|BE\d*|Examen|PRES)\b/i);
  return match ? match[1].toUpperCase() : null;
}

function extractLocation(text: string): string | null {
  // Match room patterns like "salle 1O07**", "1Z14**", "Amphi 1B26"
  const salleMatch = text.match(/salle\s*([\w/*]+\**)/i);
  if (salleMatch) return salleMatch[1];
  const roomMatch = text.match(/\b([O\dM][A-GI-Z]\d{2}[a-z]?\**)(?:\s*\(([^)]+)\))?/);
  if (roomMatch) {
    // Normalize O (letter) to 0 (zero) — CSV sometimes has O instead of 0
    const room = roomMatch[1].replace(/^O/, "0");
    const suffix = roomMatch[2] ? ` (${roomMatch[2]})` : "";
    return room + suffix;
  }
  const amphiMatch = text.match(/Amphi\s+(\w+)/i);
  if (amphiMatch) return `Amphi ${amphiMatch[1]}`;
  const laboMatch = text.match(/Labo\s+([\w]+)/i);
  if (laboMatch) return `Labo ${laboMatch[1]}`;
  return null;
}

/**
 * Extract multiple rooms with their project/group names from text like:
 * "salles 0T06* (Moucharabieh), 0T06* (Bridge), 1Z28** (CoBRA) et 2Z42** (Eolienne domestique) + 0W57** et 0W61** (salles informatiques)"
 * Returns array of { name, room } objects, or null if not a multi-room text.
 */
function extractMultiRooms(text: string): { name: string; room: string }[] | null {
  if (!text.match(/salles?\s+/i)) return null;

  const roomRe = /\b([O\dM][A-GI-Z]\d{2}[a-z]?\**)(?:\s*\(([^)]+)\))?/g;
  const results: { name: string; room: string }[] = [];
  let m;
  while ((m = roomRe.exec(text)) !== null) {
    const room = m[1].replace(/^O/, "0");
    const name = m[2] || "";
    // Skip generic suffixes like "salles informatiques selon besoin"
    if (name && !name.match(/^salle/i)) {
      results.push({ name, room });
    } else if (!name) {
      results.push({ name: room, room });
    }
  }
  return results.length > 1 ? results : null;
}

function extractTeacher(text: string): string | null {
  // Match patterns like "A. Sergent", "M. Chapon", "C. De Sa", "J. Bourgain-Wilbal"
  // Supports multi-part last names and hyphenated names
  const teachers: string[] = [];
  const re = /\b([A-Z])\.\s*([A-ZÀ-Ü][a-zà-ü]+(?:-[A-ZÀ-Ü][a-zà-ü]+)*(?:[ \t]+[A-ZÀ-Ü][a-zà-ü]+(?:-[A-ZÀ-Ü][a-zà-ü]+)*)*)\b/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    teachers.push(`${m[1]}. ${m[2]}`);
  }
  return teachers.length > 0 ? teachers.join(", ") : null;
}

function extractGroup(text: string): string | null {
  const match = text.match(/Gr(?:oupe)?\s*(\d)/i);
  return match ? `Gr${match[1]}` : null;
}

interface EnglishGroup {
  level: string;
  teacher: string;
  location: string;
}

function extractEnglishGroups(text: string): EnglishGroup[] {
  // Parse English group info like "Lower-Intermediate C. Colin 1Z68 / Intermediate 2 G. Pappaioannou 1Z62"
  const groups: EnglishGroup[] = [];
  const parts = text.split(/\s*\/\s*/);
  for (const part of parts) {
    const match = part.match(/(Lower-Intermediate|Upper-Intermediate|Intermediate\s*[12]?|Advanced)/i);
    if (match) {
      const level = match[1].trim();
      const teacherMatch = part.slice(part.indexOf(match[1]) + match[1].length).match(/\s+([A-Z][\.\w]*\s+[\w]+)/);
      const teacher = teacherMatch ? teacherMatch[1].trim() : "";
      const roomMatch = part.match(/\b(\d[A-GI-Z]\d{2}\**)\b/);
      const location = roomMatch ? roomMatch[1] : "";
      groups.push({ level, teacher, location });
    }
  }
  return groups;
}

function extractExplicitTimeRange(
  text: string,
): { startH: number; startM: number; endH: number; endM: number } | null {
  // Match full range patterns like "8h00-11h00", "9h-11h", "13h30-16h30"
  const match = text.match(
    /(\d{1,2})h(\d{2})?\s*[-–]\s*(\d{1,2})h(\d{2})?/
  );
  if (!match) return null;
  const startH = parseInt(match[1]);
  const startM = match[2] ? parseInt(match[2]) : 0;
  const endH = parseInt(match[3]);
  const endM = match[4] ? parseInt(match[4]) : 0;
  if (startH < 7 || startH > 20 || endH < 7 || endH > 20) return null;
  if (endH < startH || (endH === startH && endM <= startM)) return null;
  return { startH, startM, endH, endM };
}

function extractExplicitStartTime(
  text: string,
): { startH: number; startM: number } | null {
  // Match "Début 8h30", "début 9h", "Debut 8H30", etc.
  const match = text.match(/[Dd][ée]but\s+(\d{1,2})[hH](\d{2})?/);
  if (!match) return null;
  const startH = parseInt(match[1]);
  const startM = match[2] ? parseInt(match[2]) : 0;
  if (startH < 7 || startH > 20) return null;
  return { startH, startM };
}

function isSkippable(text: string): boolean {
  const t = text.trim().toUpperCase();
  return t === "VACANCES" || t === "FÉRIÉ" || t === "FERIE" || t === "Férié" || t === "";
}

function cell(rows: string[][], r: number, c: number): string {
  if (r < 0 || r >= rows.length) return "";
  if (c < 0 || c >= rows[r].length) return "";
  return rows[r][c].trim();
}

interface WeekInfo {
  weekNum: number;
  baseCol: number; // first content column for this week
}

function findWeeks(row0: string[]): WeekInfo[] {
  const weeks: WeekInfo[] = [];

  // First week (week 4) starts at col 1, has no number but has "Semaine" at col 1
  // Actually the first week may not have a number. Let's detect from row 0.
  // Row 0 pattern: "x", "Semaine", ..., "5", "Semaine", ..., "6", "Semaine", ...

  // Find all week number markers
  for (let j = 0; j < row0.length; j++) {
    const val = row0[j].trim();
    if (/^\d+$/.test(val) && parseInt(val) >= 1 && parseInt(val) <= 53) {
      // The week data starts at j+1 (the "Semaine" label is there, but data cols follow)
      weeks.push({ weekNum: parseInt(val), baseCol: j + 1 });
    }
  }

  // Handle first week (before any numbered week)
  // The first "Semaine" at col 1 is the first week
  if (row0[1]?.trim() === "Semaine" && weeks.length > 0) {
    // First week number = first found week - 1
    const firstWeekNum = weeks[0].weekNum - 1;
    weeks.unshift({ weekNum: firstWeekNum, baseCol: 1 });
  }

  return weeks;
}

interface DayInfo {
  dayName: string;
  date: Date;
  headerRow: number; // row index of the day header
}

function findDays(rows: string[][], weekBase: number): DayInfo[] {
  const days: DayInfo[] = [];
  const dateCol = weekBase + 9; // date appears at offset 9

  for (let i = 1; i < rows.length; i++) {
    const dayCell = cell(rows, i, weekBase);
    if (DAY_NAMES.includes(dayCell)) {
      const dateStr = cell(rows, i, dateCol);
      const date = parseFrenchDate(dateStr);
      if (date) {
        days.push({ dayName: dayCell, date, headerRow: i });
      }
    }
  }
  return days;
}

// Time slot rows relative to day header row
// Paired as consecutive slots that can be merged (2h blocks)
const TIME_SLOT_OFFSETS = [
  { offset: 1, slot: "8h-9h" },
  { offset: 2, slot: "9h-10h" },
  { offset: 3, slot: "10h15-11h15" },
  { offset: 4, slot: "11h15-12h15" },
  // offset 5 = continuation row
  { offset: 6, slot: "13h30-14h30" },
  { offset: 7, slot: "14h30-15h30" },
  { offset: 8, slot: "15h45-16h45" },
  { offset: 9, slot: "16h45-17h45" },
];

// Consecutive slot pairs: if content in first and empty in second → 2h event
const SLOT_PAIRS: [string, string][] = [
  ["8h-9h", "9h-10h"],
  ["10h15-11h15", "11h15-12h15"],
  ["13h30-14h30", "14h30-15h30"],
  ["15h45-16h45", "16h45-17h45"],
];

// Combined end time when two consecutive slots merge
const MERGED_END: Record<string, { endH: number; endM: number }> = {
  "8h-9h":       { endH: 10, endM: 0 },
  "10h15-11h15": { endH: 12, endM: 15 },
  "13h30-14h30": { endH: 15, endM: 30 },
  "15h45-16h45": { endH: 17, endM: 45 },
};

// 4-slot blocks: first pair can extend into the second pair (full morning/afternoon)
const QUAD_BLOCKS: { first: string; secondPairSlots: [number, number]; endH: number; endM: number }[] = [
  // Morning: 8h-9h pair extends into 10h15-11h15 pair → 8h-12h15
  { first: "8h-9h", secondPairSlots: [3, 4], endH: 12, endM: 15 },
  // Afternoon: 13h30-14h30 pair extends into 15h45-16h45 pair → 13h30-17h45
  { first: "13h30-14h30", secondPairSlots: [8, 9], endH: 17, endM: 45 },
];

function createEvent(
  id: string,
  text: string,
  detailText: string,
  date: Date,
  slot: string,
  classes: string[],
  group?: string,
  endOverride?: { endH: number; endM: number },
): TimetableEvent[] {
  if (isSkippable(text)) return [];

  const timeInfo = TIME_SLOTS[slot];
  if (!timeInfo) return [];

  const code = extractCourseCode(text);
  if (!code) {
    if (!text.match(/Rattrapage|Examen|Projet|Soutenance/i)) return [];
  }

  const projetMatch = !code ? text.match(/Projet\s+\w+/i) : null;
  const courseName = code ? (COURSE_NAMES[code] || `UE${code}`) : (projetMatch ? projetMatch[0] : text.substring(0, 30));
  const courseClasses = code ? (COURSE_CLASSES[code] || classes) : classes;
  const type = extractCourseType(text);
  const location = extractLocation(text) || extractLocation(detailText);

  // Try to extract explicit time range or start time from text
  const fullText = text + " " + detailText;
  const explicitTime = extractExplicitTimeRange(fullText);
  const explicitStart = !explicitTime ? extractExplicitStartTime(fullText) : null;

  const startH = explicitTime ? explicitTime.startH : (explicitStart ? explicitStart.startH : timeInfo.startH);
  const startM = explicitTime ? explicitTime.startM : (explicitStart ? explicitStart.startM : timeInfo.startM);
  const endH = explicitTime ? explicitTime.endH : (endOverride ? endOverride.endH : timeInfo.endH);
  const endM = explicitTime ? explicitTime.endM : (endOverride ? endOverride.endM : timeInfo.endM);

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const startStr = `${dateStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`;
  const endStr = `${dateStr}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;

  const title = type ? `${courseName} — ${type}` : courseName;
  const codeStr = code ? `UE${code}` : "";

  // For English (207), list all groups in the group field
  if (code === "207" && detailText) {
    const englishGroups = extractEnglishGroups(detailText);
    if (englishGroups.length > 0) {
      const groupLines = englishGroups.map((g) => {
        const parts = [g.level];
        if (g.teacher) parts.push(g.teacher);
        if (g.location) parts.push(g.location);
        return parts.join(" · ");
      });
      return [{
        id,
        title,
        code: codeStr,
        start: startStr,
        end: endStr,
        classes: courseClasses,
        group: groupLines.join("\n"),
        location: undefined,
        teacher: undefined,
        type: type || undefined,
        rawText: text,
      }];
    }
  }

  // Multi-room events (e.g. Projet SAPHIRE with multiple rooms/projects)
  const multiRooms = extractMultiRooms(fullText);
  if (multiRooms) {
    const groupLines = multiRooms.map((r) =>
      r.name !== r.room ? `${r.name} · ${r.room}` : r.room,
    );
    return [{
      id,
      title,
      code: codeStr,
      start: startStr,
      end: endStr,
      classes: courseClasses,
      group: groupLines.join("\n"),
      location: undefined,
      teacher: undefined,
      type: type || undefined,
      rawText: text,
    }];
  }

  // Extract teacher from main text or detail text
  const teacher = extractTeacher(text) || extractTeacher(detailText);

  const textGroup = extractGroup(text) || extractGroup(detailText);
  const finalGroup = group || textGroup;

  return [{
    id,
    title,
    code: codeStr,
    start: startStr,
    end: endStr,
    classes: courseClasses,
    group: finalGroup || undefined,
    location: location || undefined,
    teacher: teacher || undefined,
    type: type || undefined,
    rawText: text,
  }];
}

export async function fetchAndParseXlsx(): Promise<TimetableEvent[]> {
  const response = await fetch(CSV_URL, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }
  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 10) {
    throw new Error("CSV appears empty or malformed");
  }

  const weeks = findWeeks(rows[0]);
  const events: TimetableEvent[] = [];
  let eventId = 0;

  for (const week of weeks) {
    const days = findDays(rows, week.baseCol);

    for (const day of days) {
      // Track which slots have already been consumed by a 2h merge
      const consumed = new Set<string>(); // key: `${colOffset}-${slot}`

      for (const { offset, slot } of TIME_SLOT_OFFSETS) {
        const rowIdx = day.headerRow + offset;
        const timeCell = cell(rows, rowIdx, 0);

        if (timeCell && !TIME_SLOTS[timeCell]) continue;

        // Check if this slot can be merged with the next one (2h block)
        const pair = SLOT_PAIRS.find((p) => p[0] === slot);
        const nextSlotOffset = pair
          ? TIME_SLOT_OFFSETS.find((t) => t.slot === pair[1])?.offset
          : undefined;
        const nextRowIdx = nextSlotOffset !== undefined
          ? day.headerRow + nextSlotOffset
          : -1;

        // Helper: check if a column should be a 2h or 4h event
        // Returns end time override and optional extra row indices for detail gathering
        function checkMerge(colOffset: number, _track: TrackRange): { endH: number; endM: number; extraRows?: number[] } | undefined {
          if (!pair || nextRowIdx < 0) return undefined;
          if (consumed.has(`${colOffset}-${slot}`)) return undefined;

          const nextCell = cell(rows, nextRowIdx, week.baseCol + colOffset);
          const nextCode = nextCell ? extractCourseCode(nextCell) : null;
          const currentText = cell(rows, rowIdx, week.baseCol + colOffset);
          const currentCode = currentText ? extractCourseCode(currentText) : null;

          if (currentCode && (!nextCell || !nextCode || nextCode === currentCode)) {
            consumed.add(`${colOffset}-${pair[1]}`);

            // Check if this can extend to a 4-slot block (full morning or afternoon)
            const quad = QUAD_BLOCKS.find((q) => q.first === slot);
            if (quad) {
              const thirdRowIdx = day.headerRow + quad.secondPairSlots[0];
              const fourthRowIdx = day.headerRow + quad.secondPairSlots[1];
              const thirdCell = cell(rows, thirdRowIdx, week.baseCol + colOffset);
              const thirdCode = thirdCell ? extractCourseCode(thirdCell) : null;
              const fourthCell = cell(rows, fourthRowIdx, week.baseCol + colOffset);

              // Check if the same course code appears in ANY column at the third row
              let sameCodeElsewhere = false;
              for (let off = 0; off < 18; off++) {
                if (off === colOffset) continue;
                const otherText = cell(rows, thirdRowIdx, week.baseCol + off);
                if (otherText && extractCourseCode(otherText) === currentCode) {
                  sameCodeElsewhere = true;
                  break;
                }
              }

              const fourthCode = fourthCell ? extractCourseCode(fourthCell) : null;
              if (
                (!thirdCell || !thirdCode) &&
                (!fourthCell || !fourthCode) &&
                !sameCodeElsewhere
              ) {
                const thirdSlot = TIME_SLOT_OFFSETS.find((t) => t.offset === quad.secondPairSlots[0])?.slot;
                const fourthSlot = TIME_SLOT_OFFSETS.find((t) => t.offset === quad.secondPairSlots[1])?.slot;
                if (thirdSlot) consumed.add(`${colOffset}-${thirdSlot}`);
                if (fourthSlot) consumed.add(`${colOffset}-${fourthSlot}`);
                return { endH: quad.endH, endM: quad.endM, extraRows: [thirdRowIdx, fourthRowIdx] };
              }
            }

            return MERGED_END[slot];
          }
          return undefined;
        }

        // --- Process each track by scanning its column range ---
        for (const track of TRACKS) {
          // Find all columns with content in this track's range
          const activeCols: { col: number; text: string; code: string | null }[] = [];
          for (let off = track.min; off <= track.max; off++) {
            if (consumed.has(`${off}-${slot}`)) continue;
            const text = cell(rows, rowIdx, week.baseCol + off);
            if (text) {
              const code = extractCourseCode(text);
              activeCols.push({ col: off, text, code });
            }
          }

          if (activeCols.length === 0) continue;

          // Filter to columns that have a course code (ignore pure detail columns)
          const mainCols = activeCols.filter((c) => c.code);
          if (mainCols.length === 0) continue;

          for (const mc of mainCols) {
            const merge = checkMerge(mc.col, track);

            // Gather detail from other columns without a different code
            let detail = "";
            for (const ac of activeCols) {
              if (ac.col === mc.col) continue;
              if (ac.code && ac.code !== mc.code) continue; // different course, skip
              detail = detail ? `${detail} - ${ac.text}` : ac.text;
            }

            // Also gather detail from merged rows (next row + quad extra rows)
            if (merge && nextRowIdx > 0) {
              const otherMainCols = new Set(mainCols.filter((m) => m.col !== mc.col && m.code !== mc.code).map((m) => m.col));
              const detailRows = [nextRowIdx, ...(merge.extraRows || [])];
              for (const detailRowIdx of detailRows) {
                for (let off = track.min; off <= track.max; off++) {
                  if (otherMainCols.has(off)) continue;
                  const rowText = cell(rows, detailRowIdx, week.baseCol + off);
                  if (!rowText) continue;
                  const rowCode = extractCourseCode(rowText);
                  if (rowCode && rowCode !== mc.code) continue;
                  if (off === mc.col && (!rowCode || rowCode === mc.code)) {
                    detail = detail ? `${detail} - ${rowText}` : rowText;
                  } else if (off !== mc.col) {
                    detail = detail ? `${detail} - ${rowText}` : rowText;
                  }
                }
              }
            }

            events.push(...createEvent(
              String(++eventId), mc.text, detail, day.date, slot, track.classes,
              undefined, merge,
            ));
          }
        }
      }
    }
  }

  // Post-process: 1) merge consecutive time slots, 2) merge same-slot groups
  const consecutive = mergeConsecutiveEvents(events);
  return mergeSameSlotGroups(consecutive);
}

function mergeConsecutiveEvents(events: TimetableEvent[]): TimetableEvent[] {
  const sorted = [...events].sort((a, b) => {
    const classA = a.classes.join(",");
    const classB = b.classes.join(",");
    if (classA !== classB) return classA.localeCompare(classB);
    return a.start.localeCompare(b.start);
  });

  const merged: TimetableEvent[] = [];
  let i = 0;

  while (i < sorted.length) {
    const current = { ...sorted[i] };
    while (i + 1 < sorted.length) {
      const next = sorted[i + 1];
      if (
        current.code &&
        current.code === next.code &&
        current.classes.join(",") === next.classes.join(",") &&
        current.group === next.group &&
        current.end === next.start
      ) {
        current.end = next.end;
        i++;
      } else {
        break;
      }
    }
    merged.push(current);
    i++;
  }

  return merged;
}

function mergeSameSlotGroups(events: TimetableEvent[]): TimetableEvent[] {
  // Group events by (code, start, end, classes)
  const key = (e: TimetableEvent) =>
    `${e.code}|${e.start}|${e.end}|${e.classes.join(",")}`;

  const groups = new Map<string, TimetableEvent[]>();
  for (const e of events) {
    if (!e.code) {
      // No code — can't group, keep as-is
      groups.set(`__nocode_${e.id}`, [e]);
      continue;
    }
    const k = key(e);
    const arr = groups.get(k);
    if (arr) arr.push(e);
    else groups.set(k, [e]);
  }

  const result: TimetableEvent[] = [];
  for (const arr of groups.values()) {
    if (arr.length === 1) {
      result.push(arr[0]);
      continue;
    }

    // Merge multiple events into one
    const base = { ...arr[0] };
    const groupLines: string[] = [];

    // Check if events have different types (e.g. TP1 vs TP2)
    const types = new Set(arr.map((e) => e.type).filter(Boolean));
    const hasMultipleTypes = types.size > 1;

    for (const e of arr) {
      const parts: string[] = [];
      // If types differ (TP1/TP2), use the type as group label
      if (hasMultipleTypes && e.type) parts.push(e.type);
      if (e.group) parts.push(e.group);
      if (e.teacher) parts.push(e.teacher);
      if (e.location) parts.push(e.location);
      if (parts.length > 0) groupLines.push(parts.join(" · "));
    }

    if (groupLines.length > 0) {
      base.group = groupLines.join("\n");
    }

    // If types differ, use generic type in title (TP instead of TP1)
    if (hasMultipleTypes && base.type) {
      const genericType = base.type.replace(/\d+$/, "");
      base.title = base.title.replace(/ — \w+$/, ` — ${genericType}`);
      base.type = genericType;
    }

    // Clear teacher/location since they're now in the group lines
    base.teacher = undefined;
    base.location = undefined;
    result.push(base);
  }

  return result;
}
