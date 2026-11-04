"use client";

import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  activityIcon,
  buildIcs,
  dayToDate,
  downloadIcs,
  groupOf,
  nextDueDate,
  todayLocal,
  type Group,
  type NewSchedule,
  type Schedule,
} from "@/lib/schedule";
import { toast } from "@/lib/toast";
import ConfirmDialog from "./ConfirmDialog";
import { CheckIcon, TrashIcon } from "./Icons";
import ScheduleForm from "./ScheduleForm";

const ORDER: Group[] = ["overdue", "today", "week", "later", "done"];
const FIELDS = "id,title,activity,field,due_date,repeat_days,note,done_at,created_at";

export default function ScheduleView({ initial }: { initial: Schedule[] }) {
  const t = useTranslations("schedule");
  const format = useFormatter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initial);
  const [adding, setAdding] = useState(initial.length === 0);
  const [showDone, setShowDone] = useState(false);
  const [toDelete, setToDelete] = useState<Schedule | null>(null);

  const today = todayLocal();
  const groups = useMemo(() => {
    const map = new Map<Group, Schedule[]>(ORDER.map((g) => [g, []]));
    for (const s of items) map.get(groupOf(s, today))!.push(s);
    map.get("done")!.sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
    return map;
  }, [items, today]);
  const pending = items.filter((s) => !s.done_at);
  const dueNow = groups.get("overdue")!.length + groups.get("today")!.length;

  const label = (a: Schedule["activity"]) => t(`activities.${a}`);

  async function add(input: NewSchedule) {
    const { data, error } = await supabase.from("schedules").insert(input).select(FIELDS).single();
    if (error || !data) return false;
    setItems((prev) => [...prev, data as Schedule]);
    setAdding(false);
    toast(t("saved"), "success");
    return true;
  }

  async function toggleDone(s: Schedule) {
    const done_at = s.done_at ? null : new Date().toISOString();
    const { error } = await supabase.from("schedules").update({ done_at }).eq("id", s.id);
    if (error) return toast(t("saveFailed"), "error");
    setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, done_at } : x)));
    // Completing a repeating task schedules the next one.
    if (done_at && s.repeat_days) {
      const next: NewSchedule = {
        title: s.title,
        activity: s.activity,
        field: s.field,
        note: s.note,
        repeat_days: s.repeat_days,
        due_date: nextDueDate(s.due_date, s.repeat_days, today),
      };
      const { data } = await supabase.from("schedules").insert(next).select(FIELDS).single();
      if (data) {
        setItems((prev) => [...prev, data as Schedule]);
        toast(t("nextCreated", { date: format.dateTime(dayToDate(next.due_date), { dateStyle: "medium" }) }), "success");
        return;
      }
    }
    if (done_at) toast(t("markedDone"), "success");
  }

  async function remove(s: Schedule) {
    const { error } = await supabase.from("schedules").delete().eq("id", s.id);
    if (error) return toast(t("saveFailed"), "error");
    setItems((prev) => prev.filter((x) => x.id !== s.id));
    toast(t("deleted"), "success");
  }

  const relative = (day: string) => {
    if (day === today) return t("today");
    return format.dateTime(dayToDate(day), { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="stack-lg">
      <div className="schedule-summary card">
        <div>
          <strong className="big-number">{dueNow}</strong>
          <span className="muted">{t("dueNow")}</span>
        </div>
        <div>
          <strong className="big-number">{pending.length}</strong>
          <span className="muted">{t("pending")}</span>
        </div>
        <div className="schedule-actions">
          <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={adding}>+ {t("add")}</button>
          {pending.length > 0 && (
            <button className="btn btn-ghost" onClick={() => downloadIcs("jadwal-plantlens.ics", buildIcs(pending, label))}>
              📅 {t("exportAll")}
            </button>
          )}
        </div>
      </div>

      {adding && <ScheduleForm onSubmit={add} onCancel={() => setAdding(false)} />}

      {pending.length === 0 && !adding && (
        <section className="card empty">
          <p style={{ fontWeight: 600, margin: 0 }}>🗓️ {t("empty")}</p>
          <p className="muted" style={{ margin: 0 }}>{t("emptyHint")}</p>
        </section>
      )}

      {ORDER.filter((g) => g !== "done").map((g) => {
        const list = groups.get(g)!;
        if (!list.length) return null;
        return (
          <section key={g} className="stack">
            <h2 className={`section-title${g === "overdue" ? " text-danger" : ""}`}>{t(`groups.${g}`)} · {list.length}</h2>
            <ul className="list">
              {list.map((s) => (
                <ScheduleRow key={s.id} s={s} overdue={g === "overdue"} when={relative(s.due_date)} onToggle={toggleDone} onDelete={setToDelete} onExport={() => downloadIcs(`jadwal-${s.due_date}.ics`, buildIcs([s], label))} />
              ))}
            </ul>
          </section>
        );
      })}

      {groups.get("done")!.length > 0 && (
        <section className="stack">
          <button className="link-button section-title" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>
            {showDone ? "▾" : "▸"} {t("groups.done")} · {groups.get("done")!.length}
          </button>
          {showDone && (
            <ul className="list">
              {groups.get("done")!.map((s) => (
                <ScheduleRow key={s.id} s={s} when={relative(s.due_date)} onToggle={toggleDone} onDelete={setToDelete} />
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="muted small" style={{ textAlign: "center" }}>{t("reminderNote")}</p>

      <ConfirmDialog
        open={!!toDelete}
        danger
        title={t("deleteTitle")}
        body={t("deleteBody")}
        confirmLabel={t("delete")}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const s = toDelete;
          setToDelete(null);
          if (s) remove(s);
        }}
      />
    </div>
  );
}

type RowProps = {
  s: Schedule;
  when: string;
  overdue?: boolean;
  onToggle: (s: Schedule) => void;
  onDelete: (s: Schedule) => void;
  onExport?: () => void;
};

function ScheduleRow({ s, when, overdue, onToggle, onDelete, onExport }: RowProps) {
  const t = useTranslations("schedule");
  const done = !!s.done_at;
  return (
    <li className={`schedule-row${done ? " is-done" : ""}`}>
      <button
        className={`check${done ? " checked" : ""}`}
        role="checkbox"
        aria-checked={done}
        aria-label={done ? t("markUndone") : t("markDone")}
        onClick={() => onToggle(s)}
      >
        {done && <CheckIcon size={16} />}
      </button>
      <div className="schedule-text">
        <strong>{activityIcon[s.activity]} {s.title}</strong>
        <span className="muted small">
          <span className={overdue ? "text-danger" : undefined}>{when}</span>
          {s.field && <> · {s.field}</>}
          {s.repeat_days && <> · 🔁 {t("repeatEvery", { days: s.repeat_days })}</>}
        </span>
        {s.note && <span className="muted small schedule-note">{s.note}</span>}
      </div>
      {onExport && (
        <button className="icon-btn" aria-label={t("exportOne")} title={t("exportOne")} onClick={onExport}>📅</button>
      )}
      <button className="icon-btn" aria-label={t("delete")} onClick={() => onDelete(s)}><TrashIcon size={18} /></button>
    </li>
  );
}
