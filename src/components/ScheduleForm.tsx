"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { activities, activityIcon, todayLocal, type Activity, type NewSchedule } from "@/lib/schedule";

const REPEATS = [0, 3, 7, 14, 30] as const;

export default function ScheduleForm({ onSubmit, onCancel }: { onSubmit: (s: NewSchedule) => Promise<boolean>; onCancel: () => void }) {
  const t = useTranslations("schedule");
  const [title, setTitle] = useState("");
  const [activity, setActivity] = useState<Activity>("pupuk");
  const [field, setField] = useState("");
  const [due, setDue] = useState(todayLocal());
  const [repeat, setRepeat] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !due) return setError(true);
    setBusy(true);
    const ok = await onSubmit({
      title: title.trim().slice(0, 120),
      activity,
      field: field.trim().slice(0, 80) || null,
      due_date: due,
      repeat_days: repeat || null,
      note: note.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (!ok) setError(true);
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h2 className="h3">{t("addTitle")}</h2>
      <div className="chips" role="radiogroup" aria-label={t("activity")}>
        {activities.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={activity === a}
            className={`chip${activity === a ? " chip-active" : ""}`}
            onClick={() => setActivity(a)}
          >
            {activityIcon[a]} {t(`activities.${a}`)}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{t("titleLabel")}</span>
        <input className="text-input" value={title} maxLength={120} required onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} />
      </label>
      <label className="field">
        <span>{t("fieldLabel")}</span>
        <input className="text-input" value={field} maxLength={80} onChange={(e) => setField(e.target.value)} placeholder={t("fieldPlaceholder")} />
      </label>
      <div className="form-row">
        <label className="field">
          <span>{t("dateLabel")}</span>
          <input className="text-input" type="date" value={due} required onChange={(e) => setDue(e.target.value)} />
        </label>
        <label className="field">
          <span>{t("repeatLabel")}</span>
          <select className="text-input" value={repeat} onChange={(e) => setRepeat(Number(e.target.value))}>
            {REPEATS.map((n) => (
              <option key={n} value={n}>{n === 0 ? t("repeatNone") : t("repeatEvery", { days: n })}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>{t("noteLabel")}</span>
        <textarea className="text-input" rows={2} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} />
      </label>
      {error && <p className="alert alert-error" role="alert">{t("saveFailed")}</p>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t("cancel")}</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" aria-hidden /> : null} {t("save")}</button>
      </div>
    </form>
  );
}
