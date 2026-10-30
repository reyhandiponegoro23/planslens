import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LeafIcon } from "@/components/Icons";
import LanguageSelect from "@/components/LanguageSelect";
import NewConsultation from "@/components/NewConsultation";
import PlantArt from "@/components/PlantArt";

export default async function HomePage() {
  const t = await getTranslations();
  return (
    <main className="page">
      <div className="home-top">
        <Link href="/" className="brand"><LeafIcon size={26} /> PlantLens AI</Link>
        <LanguageSelect />
      </div>
      <div className="home-grid">
        <section className="hero">
          <PlantArt className="hero-art" />
          <h1>{t("home.title")}</h1>
          <p>{t("home.subtitle")}</p>
        </section>
        <div className="home-form">
          <NewConsultation />
        </div>
      </div>
    </main>
  );
}
