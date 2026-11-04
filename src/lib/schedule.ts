// Farm schedule (Jadwal) types and date helpers. Dates are local calendar days ("YYYY-MM-DD"),
// never converted through UTC, so a task due "today" stays today in Indonesia.

export const activities = ["tanam", "pupuk", "semprot", "siram", "panen", "lainnya"] as const;
export type Activity = (typeof activities)[number];

export const activityIcon: Record<Activity, string> = {
  tanam: "🌱",
  pupuk: "🧪",
  semprot: "💦",
  siram: "🚿",
  panen: "🧺",
  lainnya: "📌",
};

export type Schedule = {
  id: string;
  title: string;
  activity: Activity;
  field: string | null;
  due_date: string;
  repeat_days: number | null;
  note: string | null;
  done_at: string | null;
  created_at: string;
};

export type NewSchedule = Pick<Schedule, "title" | "activity" | "field" | "due_date" | "repeat_days" | "note">;

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

/** A Date at local noon for formatting, so no timezone can push it to another day. */
export function dayToDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Next due date after completing a repeating task: step by `repeat` until it is today or later. */
export function nextDueDate(due: string, repeat: number, today = todayLocal()): string {
  let next = addDays(due, repeat);
  while (next < today) next = addDays(next, repeat);
  return next;
}

export type Group = "overdue" | "today" | "week" | "later" | "done";

export function groupOf(s: Schedule, today = todayLocal()): Group {
  if (s.done_at) return "done";
  if (s.due_date < today) return "overdue";
  if (s.due_date === today) return "today";
  if (s.due_date <= addDays(today, 7)) return "week";
  return "later";
}

// ---- Calendar export (.ics) so the phone's own calendar sends the reminder ----

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function icsEvent(s: Schedule, labels: { activity: string }): string {
  const day = s.due_date.replace(/-/g, "");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${s.id}@plantlens`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`,
    // Floating local time: 07:00 on the due day, wherever the phone is.
    `DTSTART:${day}T070000`,
    `DTEND:${day}T073000`,
    `SUMMARY:${icsEscape(`${activityIcon[s.activity]} ${s.title}`)}`,
    `DESCRIPTION:${icsEscape([labels.activity, s.field, s.note].filter(Boolean).join("\n"))}`,
  ];
  if (s.repeat_days) lines.push(`RRULE:FREQ=DAILY;INTERVAL=${s.repeat_days}`);
  lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT0M", `DESCRIPTION:${icsEscape(s.title)}`, "END:VALARM", "END:VEVENT");
  return lines.join("\r\n");
}

export function buildIcs(items: Schedule[], activityLabel: (a: Activity) => string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PlantLens AI//Jadwal//ID",
    "CALSCALE:GREGORIAN",
    ...items.map((s) => icsEvent(s, { activity: activityLabel(s.activity) })),
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
