import { getTranslations } from "next-intl/server";
import HistoryList from "@/components/HistoryList";

export default async function HistoryPage() {
  const t = await getTranslations("history");
  return (
    <main className="page">
      <div className="page-title"><h1>{t("title")}</h1></div>
      <HistoryList />
    </main>
  );
}
