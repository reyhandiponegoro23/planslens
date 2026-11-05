// Farm schedule = planting records. Stored in the existing `schedules` table:
//   title       crop name            due_date     planting date
//   repeat_days days until harvest   note         AI's harvest explanation
//   activity    always "tanam"       done_at      when it was harvested
// Dates are local calendar days ("YYYY-MM-DD"), never converted through UTC.

export type Schedule = {
  id: string;
  title: string;
  activity: string;
  field: string | null;
  due_date: string;
  repeat_days: number | null;
  note: string | null;
  done_at: string | null;
  created_at: string;
};

export type NewPlanting = { crop: string; plantedOn: string; harvestDays: number | null; harvestNote: string | null };

export function toRow(p: NewPlanting) {
  return {
    title: p.crop.slice(0, 120),
    activity: "tanam",
    field: null,
    due_date: p.plantedOn,
    repeat_days: p.harvestDays,
    note: p.harvestNote?.slice(0, 1000) || null,
  };
}

/** Common crops, keyed for translation; anything else can be typed in. */
export const crops = [
  { key: "padi", icon: "🌾" },
  { key: "jagung", icon: "🌽" },
  { key: "cabaiMerah", icon: "🌶️" },
  { key: "cabaiRawit", icon: "🌶️" },
  { key: "tomat", icon: "🍅" },
  { key: "bawangMerah", icon: "🧅" },
  { key: "kedelai", icon: "🫘" },
  { key: "kacangTanah", icon: "🥜" },
  { key: "terong", icon: "🍆" },
  { key: "mentimun", icon: "🥒" },
  { key: "kangkung", icon: "🥬" },
  { key: "sawi", icon: "🥬" },
  { key: "semangka", icon: "🍉" },
  { key: "singkong", icon: "🌿" },
  { key: "kentang", icon: "🥔" },
  { key: "wortel", icon: "🥕" },
] as const;
export type CropKey = (typeof crops)[number]["key"];

const pad = (n: number) => String(n).padStart(2, "0");

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function daysBetween(from: string, to: string): number {
  const [a, b] = [from, to].map((s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

/** A Date at local noon for formatting, so no timezone can push it to another day. */
export function dayToDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function harvestDate(s: Schedule): string | null {
  return s.repeat_days ? addDays(s.due_date, s.repeat_days) : null;
}

export type Group = "ready" | "growing" | "harvested";

export function groupOf(s: Schedule, today = todayLocal()): Group {
  if (s.done_at) return "harvested";
  const h = harvestDate(s);
  return h && h <= today ? "ready" : "growing";
}

/** 0–1 progress from planting to estimated harvest. */
export function progress(s: Schedule, today = todayLocal()): number {
  if (!s.repeat_days) return 0;
  return Math.max(0, Math.min(1, daysBetween(s.due_date, today) / s.repeat_days));
}

// ---- Calendar export (.ics): a reminder on the estimated harvest day ----

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function buildIcs(items: Schedule[], summary: (s: Schedule) => string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const events = items.flatMap((s) => {
    const h = harvestDate(s);
    if (!h) return [];
    const day = h.replace(/-/g, "");
    return [
      [
        "BEGIN:VEVENT",
        `UID:${s.id}-harvest@plantlens`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${day}T070000`,
        `DTEND:${day}T073000`,
        `SUMMARY:${icsEscape(summary(s))}`,
        `DESCRIPTION:${icsEscape(s.note ?? "")}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "TRIGGER:-P1D",
        `DESCRIPTION:${icsEscape(summary(s))}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"),
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PlantLens AI//Jadwal//ID", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

export function downloadIcs(filename: string, ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
