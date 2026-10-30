import { getTranslations } from "next-intl/server";
import SubPage from "./SubPage";

const pages = {
  about: { title: "aboutApp", body: "aboutBody" },
  privacy: { title: "privacy", body: "privacyBody" },
  terms: { title: "terms", body: "termsBody" },
  help: { title: "help", body: "helpBody" },
} as const;

/** Static text page (About, Privacy, Terms, Help); text lives in messages/*.json. */
export default async function InfoPage({ page }: { page: keyof typeof pages }) {
  const tProfile = await getTranslations("profile");
  const tPages = await getTranslations("pages");
  return (
    <SubPage title={tProfile(pages[page].title)}>
      <section className="card prose">{tPages(pages[page].body)}</section>
    </SubPage>
  );
}
