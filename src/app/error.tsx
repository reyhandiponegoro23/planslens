"use client";

import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();
  return (
    <main className="page">
      <section className="card empty" role="alert">
        <h1>{t("errors.pageTitle")}</h1>
        <p>{t("errors.generic")}</p>
        <button className="btn btn-primary" onClick={reset}>{t("common.retry")}</button>
      </section>
    </main>
  );
}
