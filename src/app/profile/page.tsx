import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronIcon, FileIcon, GlobeIcon, HelpIcon, InfoIcon, MoonIcon, ShieldIcon, UserIcon } from "@/components/Icons";
import ThemeValue from "@/components/ThemeValue";
import { localeMeta } from "@/i18n/config";
import { getUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  const locale = await getLocale();
  const user = await getUser();

  const about = [
    { href: "/about", label: t("aboutApp"), Icon: InfoIcon },
    { href: "/privacy", label: t("privacy"), Icon: ShieldIcon },
    { href: "/terms", label: t("terms"), Icon: FileIcon },
    { href: "/help", label: t("help"), Icon: HelpIcon },
  ];

  return (
    <main className="page">
      <div className="page-title"><h1>{t("title")}</h1></div>

      {/* Two columns on laptops (see .profile-grid); stacked on phones. */}
      <div className="profile-grid">
      <div>
      {/* Signing in only syncs the farm schedule; consultations stay on this device. */}
      <section className="card stack">
        <div className="profile-card">
          <span className="profile-avatar" aria-hidden><UserIcon size={30} /></span>
          <div className="profile-id">
            <strong>{user ? user.email : t("guestName")}</strong>
            <div className="muted small">{user ? t("signedInNote") : t("guestNote")}</div>
          </div>
        </div>
        {isSupabaseConfigured() && (
          <div className="profile-actions">
            {user ? (
              <form action={signOut}>
                <button className="btn btn-soft">{t("signOut")}</button>
              </form>
            ) : (
              <Link href="/login?next=/profile" className="btn btn-primary">{t("signIn")}</Link>
            )}
          </div>
        )}
      </section>

      <h2 className="section-title">{t("settings")}</h2>
      <ul className="list">
        <li>
          <Link href="/profile/language" className="list-row">
            <GlobeIcon />
            <span className="label">{t("language")}</span>
            <span className="value">{localeMeta[locale].flag} {localeMeta[locale].label}</span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
        <li>
          <Link href="/profile/theme" className="list-row">
            <MoonIcon />
            <span className="label">{t("theme")}</span>
            <ThemeValue />
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
      </ul>
      </div>

      <div>
      <h2 className="section-title">{t("about")}</h2>
      <ul className="list">
        {about.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="list-row">
              <Icon />
              <span className="label">{label}</span>
              <ChevronIcon size={18} className="chev" />
            </Link>
          </li>
        ))}
      </ul>

      </div>
      </div>
    </main>
  );
}
