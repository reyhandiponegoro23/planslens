"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { addDays, crops, dayToDate, daysBetween, todayLocal, type NewPlanting } from "@/lib/schedule";

type Estimate = { status: "idle" | "loading" | "done" | "failed"; days?: number; note?: string };

export default function ScheduleForm({ onSubmit, onCancel }: { onSubmit: (p: NewPlanting) => Promise<boolean>; onCancel: () => void }) {
  const t = useTranslations("schedule");
  const format = useFormatter();
  const [crop, setCrop] = useState("");
  const [picking, setPicking] = useState(false);
  const [custom, setCustom] = useState("");
  const [plantedOn, setPlantedOn] = useState(todayLocal());
  const [harvestOn, setHarvestOn] = useState("");
  const [estimate, setEstimate] = useState<Estimate>({ status: "idle" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"noCrop" | "badHarvest" | "saveFailed" | null>(null);
  const requestId = useRef(0);

  // Ask the AI for the usual days-to-harvest whenever the crop or planting date changes.
  useEffect(() => {
    if (!crop || !plantedOn) return;
    const id = ++requestId.current;
    setEstimate({ status: "loading" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/harvest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crop, plantedOn }),
        });
        const data = await res.json();
        if (id !== requestId.current) return;
        if (!res.ok || !data.days) throw new Error();
        setEstimate({ status: "done", days: data.days, note: data.note });
        setHarvestOn(addDays(plantedOn, data.days));
      } catch {
        if (id === requestId.current) setEstimate({ status: "failed" });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [crop, plantedOn]);

  function choose(name: string) {
    const value = name.trim().slice(0, 60);
    if (!value) return;
    setCrop(value);
    setPicking(false);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!crop) return setError("noCrop");
    const days = harvestOn ? daysBetween(plantedOn, harvestOn) : null;
    if (days !== null && (days < 1 || days > 365)) return setError("badHarvest");
    setBusy(true);
    const ok = await onSubmit({
      crop,
      plantedOn,
      harvestDays: days,
      // Keep the AI's explanation only if the user kept its date.
      harvestNote: estimate.days && days === estimate.days ? estimate.note ?? null : null,
    });
    setBusy(false);
    if (!ok) setError("saveFailed");
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h2 className="h3">{t("addTitle")}</h2>

      <div className="field">
        <span>{t("cropLabel")}</span>
        {crop && !picking ? (
          <div className="row">
            <span className="chip chip-active">{crops.find((c) => t(`crops.${c.key}`) === crop)?.icon ?? "🌱"} {crop}</span>
            <button type="button" className="link-button small" onClick={() => setPicking(true)}>{t("changeCrop")}</button>
          </div>
        ) : (
          <div className="crop-picker">
            {!picking ? (
              <button type="button" className="btn btn-ghost add-crop" onClick={() => setPicking(true)}>
                ＋ {t("pickCrop")}
              </button>
            ) : (
              <>
                <div className="chips">
                  {crops.map((c) => (
                    <button key={c.key} type="button" className="chip" onClick={() => choose(t(`crops.${c.key}`))}>
                      {c.icon} {t(`crops.${c.key}`)}
                    </button>
                  ))}
                </div>
                <div className="row">
                  <input
                    className="text-input"
                    value={custom}
                    maxLength={60}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        choose(custom);
                      }
                    }}
                    placeholder={t("customCrop")}
                    aria-label={t("customCrop")}
                  />
                  <button type="button" className="btn btn-ghost" onClick={() => choose(custom)} disabled={!custom.trim()}>＋</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <label className="field">
        <span>{t("plantedLabel")}</span>
        <input className="text-input" type="date" value={plantedOn} required onChange={(e) => setPlantedOn(e.target.value)} />
      </label>

      <div className="field">
        <span>{t("harvestLabel")}</span>
        {!crop && <p className="muted small" style={{ margin: 0 }}>{t("harvestPickFirst")}</p>}
        {crop && estimate.status === "loading" && (
          <p className="muted small" role="status" style={{ margin: 0 }}><span className="spinner" aria-hidden /> {t("harvestLoading")}</p>
        )}
        {crop && estimate.status === "failed" && <p className="alert alert-error" style={{ margin: 0 }}>{t("harvestFailed")}</p>}
        {crop && estimate.status !== "loading" && (
          <>
            <input className="text-input" type="date" value={harvestOn} min={addDays(plantedOn, 1)} onChange={(e) => setHarvestOn(e.target.value)} />
            {harvestOn && (
              <p className="muted small" style={{ margin: 0 }}>
                {t("harvestAfter", { days: daysBetween(plantedOn, harvestOn) })} ·{" "}
                {format.dateTime(dayToDate(harvestOn), { dateStyle: "long" })}
              </p>
            )}
            {estimate.status === "done" && estimate.note && <p className="ai-note small">🤖 {estimate.note}</p>}
          </>
        )}
      </div>

      {error && <p className="alert alert-error" role="alert">{t(error)}</p>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t("cancel")}</button>
        <button className="btn btn-primary" disabled={busy || !crop || estimate.status === "loading"}>
          {busy ? <span className="spinner" aria-hidden /> : null} {t("save")}
        </button>
      </div>
    </form>
  );
}
