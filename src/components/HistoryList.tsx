"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { listConsultations, type Consultation } from "@/lib/local-store";
import { ChevronIcon, SearchIcon } from "./Icons";

function Thumb({ blob, alt }: { blob: Blob; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img className="thumb" src={url} alt={alt} /> : <span className="thumb" />;
}

export default function HistoryList() {
  const t = useTranslations();
  const format = useFormatter();
  const [rows, setRows] = useState<Consultation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listConsultations().then(setRows, () => setFailed(true));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!rows || !q) return rows;
    return rows.filter((c) => c.messages.some((m) => m.content.toLowerCase().includes(q)) || c.title.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <>
      <label className="search">
        <span className="sr-only">{t("history.searchLabel")}</span>
        <SearchIcon size={20} />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("history.searchPlaceholder")} />
      </label>
      {failed && <p className="alert alert-error" role="alert">{t("errors.storageFailed")}</p>}
      {!failed && !rows && <p className="muted"><span className="spinner" aria-hidden /> {t("common.loading")}</p>}
      {rows && !rows.length && (
        <section className="card empty">
          <p style={{ fontWeight: 600, margin: 0 }}>🌱 {t("history.empty")}</p>
          <p className="muted" style={{ margin: 0 }}>{t("history.emptyHint")}</p>
          <Link href="/" className="btn btn-primary">{t("history.startNow")}</Link>
        </section>
      )}
      {rows && rows.length > 0 && filtered && !filtered.length && (
        <p className="muted" style={{ textAlign: "center" }}>{t("history.noResults", { query: query.trim() })}</p>
      )}
      {filtered && filtered.length > 0 && (
        <ul className="history-list">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link href={`/history/${c.id}`} className="history-item" lang={c.language}>
                <Thumb blob={c.image} alt={t("camera.previewAlt")} />
                <span className="history-text">
                  <strong>{c.title}</strong>
                  <span className="q">{c.messages[0]?.content}</span>
                  <span className="d">{format.dateTime(new Date(c.createdAt), { dateStyle: "medium" })}</span>
                </span>
                <ChevronIcon size={20} className="chev" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small" style={{ textAlign: "center" }}>{t("history.localNote")}</p>
    </>
  );
}
