import { getTranslations } from "next-intl/server";
import SubPage from "@/components/SubPage";
import ThemePicker from "@/components/ThemePicker";

export default async function ThemePage() {
  const t = await getTranslations("profile");
  return (
    <SubPage title={t("theme")}>
      <p className="muted" style={{ margin: 0 }}>{t("themeDescription")}</p>
      <ThemePicker />
    </SubPage>
  );
}
