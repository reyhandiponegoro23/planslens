import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SubPage from "@/components/SubPage";

export default async function LanguagePage() {
  const t = await getTranslations("profile");
  return (
    <SubPage title={t("language")}>
      <p className="muted" style={{ margin: 0 }}>{t("languageDescription")}</p>
      <LanguageSwitcher />
      <p className="muted small" style={{ margin: 0 }}>{t("languageNote")}</p>
    </SubPage>
  );
}
