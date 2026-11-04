import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import EmailLogin from "@/components/EmailLogin";
import { LeafIcon } from "@/components/Icons";
import { getUser, isSupabaseConfigured } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const t = await getTranslations("auth");
  if (await getUser()) redirect(next ?? "/schedule");

  return (
    <main className="page login-page">
      <section className="card login-card">
        <span className="avatar login-logo" aria-hidden><LeafIcon size={30} /></span>
        <h1>{t("title")}</h1>
        <p className="muted">{t("subtitle")}</p>
        {error && <p className="alert alert-error" role="alert">{t("linkFailed")}</p>}
        {isSupabaseConfigured() ? (
          <EmailLogin next={next} />
        ) : (
          <p className="alert alert-error" role="alert">{t("notConfigured")}</p>
        )}
        <Link href="/" className="btn btn-ghost">{t("later")}</Link>
        <p className="muted small">{t("note")}</p>
      </section>
    </main>
  );
}
