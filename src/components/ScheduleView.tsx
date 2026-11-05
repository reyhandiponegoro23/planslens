"use client";

import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  buildIcs,
  dayToDate,
  daysBetween,
  downloadIcs,
  groupOf,
  harvestDate,
  progress,
  todayLocal,
  toRow,
  type Group,
  type NewPlanting,
  type Schedule,
} from "@/lib/schedule";
import { toast } from "@/lib/toast";
import ConfirmDialog from "./ConfirmDialog";
import { TrashIcon } from "./Icons";
import ScheduleForm from "./ScheduleForm";

const ORDER: Group[] = ["ready", "growing", "harvested"];
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
    const byHarvest = (a: Schedule, b: Schedule) => (harvestDate(a) ?? "9999").localeCompare(harvestDate(b) ?? "9999");
    map.get("ready")!.sort(byHarvest);
    map.get("growing")!.sort(byHarvest);
    map.get("harvested")!.sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
    return map;
  }, [items, today]);
  const active = items.filter((s) => !s.done_at);
  const harvestSummary = (s: Schedule) => t("calendarSummary", { crop: s.title });

  async function add(p: NewPlanting) {
    const { data, error } = await supabase.from("schedules").insert(toRow(p)).select(FIELDS).single();
    if (error || !data) {
      console.error("Saving planting failed", error);
      return false;
    }
    setItems((prev) => [...prev, data as Schedule]);
    setAdding(false);
    toast(t("saved"), "success");
    return true;
  }

  async function toggleHarvested(s: Schedule) {
    const done_at = s.done_at ? null : new Date().toISOString();
    const { error } = await supabase.from("schedules").update({ done_at }).eq("id", s.id);
    if (error) return toast(t("saveFailed"), "error");
    setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, done_at } : x)));
    if (done_at) toast(t("markedHarvested"), "success");
  }

  async function remove(s: Schedule) {
    const { error } = await supabase.from("schedules").delete().eq("id", s.id);
    if (error) return toast(t("saveFailed"), "error");
    setItems((prev) => prev.filter((x) => x.id !== s.id));
    toast(t("deleted"), "success");
  }

  const fmt = (day: string) => format.dateTime(dayToDate(day), { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="stack-lg">
      <div className="schedule-summary card">
        <div>
          <strong className="big-number">{groups.get("ready")!.length}</strong>
          <span className="muted">{t("readyCount")}</span>
        </div>
        <div>
          <strong className="big-number">{groups.get("growing")!.length}</strong>
          <span className="muted">{t("growingCount")}</span>
        </div>
        <div className="schedule-actions">
          <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={adding}>＋ {t("add")}</button>
          {active.some((s) => s.repeat_days) && (
            <button className="btn btn-ghost" onClick={() => downloadIcs("panen-plantlens.ics", buildIcs(active, harvestSummary))}>
              📅 {t("exportAll")}
            </button>
          )}
        </div>
      </div>

      {adding && <ScheduleForm onSubmit={add} onCancel={() => setAdding(false)} />}

      {active.length === 0 && !adding && (
        <section className="card empty">
          <p style={{ fontWeight: 600, margin: 0 }}>🌱 {t("empty")}</p>
          <p className="muted" style={{ margin: 0 }}>{t("emptyHint")}</p>
        </section>
      )}

      {(["ready", "growing"] as const).map((g) => {
        const list = groups.get(g)!;
        if (!list.length) return null;
        return (
          <section key={g} className="stack">
            <h2 className={`section-title${g === "ready" ? " text-ready" : ""}`}>{t(`groups.${g}`)} · {list.length}</h2>
            <ul className="list">
              {list.map((s) => {
                const h = harvestDate(s);
                const left = h ? daysBetween(today, h) : null;
                return (
                  <li key={s.id} className="planting-row">
                    <div className="planting-main">
                      <strong>🌱 {s.title}</strong>
                      <span className="muted small">{t("plantedOn", { date: fmt(s.due_date) })}</span>
                      {h ? (
                        <span className="small">
                          🧺 {t("harvestOn", { date: fmt(h) })} ·{" "}
                          <span className={left! <= 0 ? "text-ready" : "muted"}>
                            {left! <= 0 ? t("readyNow") : t("daysLeft", { days: left! })}
                          </span>
                        </span>
                      ) : (
                        <span className="muted small">{t("noEstimate")}</span>
                      )}
                      {h && (
                        <div className="progress" aria-hidden>
                          <span style={{ width: `${Math.round(progress(s, today) * 100)}%` }} />
                        </div>
                      )}
                      {s.note && <span className="ai-note small">🤖 {s.note}</span>}
                    </div>
                    <div className="planting-actions">
                      <button className="btn btn-soft small-btn" onClick={() => toggleHarvested(s)}>✓ {t("markHarvested")}</button>
                      {h && (
                        <button className="icon-btn" title={t("exportOne")} aria-label={t("exportOne")} onClick={() => downloadIcs(`panen-${s.title}.ics`, buildIcs([s], harvestSummary))}>
                          📅
                        </button>
                      )}
                      <button className="icon-btn" aria-label={t("delete")} onClick={() => setToDelete(s)}><TrashIcon size={18} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {groups.get("harvested")!.length > 0 && (
        <section className="stack">
          <button className="link-button section-title" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>
            {showDone ? "▾" : "▸"} {t("groups.harvested")} · {groups.get("harvested")!.length}
          </button>
          {showDone && (
            <ul className="list">
              {groups.get("harvested")!.map((s) => (
                <li key={s.id} className="planting-row is-done">
                  <div className="planting-main">
                    <strong>🧺 {s.title}</strong>
                    <span className="muted small">
                      {t("plantedOn", { date: fmt(s.due_date) })} · {t("harvestedOn", { date: format.dateTime(new Date(s.done_at!), { dateStyle: "medium" }) })}
                    </span>
                  </div>
                  <div className="planting-actions">
                    <button className="link-button small" onClick={() => toggleHarvested(s)}>{t("undoHarvest")}</button>
                    <button className="icon-btn" aria-label={t("delete")} onClick={() => setToDelete(s)}><TrashIcon size={18} /></button>
                  </div>
                </li>
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
