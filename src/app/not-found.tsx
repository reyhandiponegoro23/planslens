import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main className="page">
      <section className="card empty">
        <h1>404</h1>
        <p>{t("notFoundPage")}</p>
        <Link href="/" className="btn btn-primary">{t("goHome")}</Link>
      </section>
    </main>
  );
}
