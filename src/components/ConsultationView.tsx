"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getConsultation, type Consultation } from "@/lib/local-store";
import ChatThread from "./ChatThread";
import ConsultationMenu from "./ConsultationMenu";
import { BackIcon, LeafIcon } from "./Icons";

export default function ConsultationView({ id }: { id: string }) {
  const t = useTranslations();
  const [data, setData] = useState<Consultation | null | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    getConsultation(id).then((c) => setData(c ?? null), () => setData(null));
  }, [id]);
  useEffect(() => {
    if (!data) return;
    const url = URL.createObjectURL(data.image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data]);

  return (
    <main className="chat-screen">
      <header className="chat-header">
        <Link href="/history" className="icon-btn" aria-label={t("common.back")}><BackIcon /></Link>
        <span className="avatar" aria-hidden><LeafIcon size={22} /></span>
        <div className="chat-title">
          <strong>PlantLens AI</strong>
          {data && <span lang={data.language}>{data.title}</span>}
        </div>
        {data && <ConsultationMenu id={data.id} />}
      </header>
      {data === undefined && (
        <p className="muted" style={{ padding: 16 }}><span className="spinner" aria-hidden /> {t("common.loading")}</p>
      )}
      {data === null && (
        <section className="empty">
          <p>{t("history.notFound")}</p>
          <Link href="/history" className="btn btn-primary">{t("common.back")}</Link>
        </section>
      )}
      {data && <ChatThread consultation={data} imageUrl={imageUrl} />}
    </main>
  );
}
