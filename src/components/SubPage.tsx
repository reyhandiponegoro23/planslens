import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BackIcon } from "./Icons";

/** Layout for pages opened from Profile: back button + title. */
export default async function SubPage({ title, back = "/profile", children }: { title: string; back?: string; children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <main className="page">
      <div className="row" style={{ marginLeft: -8 }}>
        <Link href={back} className="icon-btn" aria-label={t("back")}><BackIcon /></Link>
        <h1 style={{ fontSize: "1.4rem" }}>{title}</h1>
      </div>
      {children}
    </main>
  );
}
