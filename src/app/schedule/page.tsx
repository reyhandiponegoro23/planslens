import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ScheduleView from "@/components/ScheduleView";
import type { Schedule } from "@/lib/schedule";
import { createClient, getUser, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function SchedulePage() {
  const t = await getTranslations("schedule");
  const user = await getUser();

  let body: React.ReactNode;
  if (!isSupabaseConfigured()) {
    body = <p className="alert alert-error" role="alert">{t("notConfigured")}</p>;
  } else if (!user) {
    body = (
      <section className="card empty">
        <p style={{ fontWeight: 600, margin: 0 }}>🗓️ {t("loginTitle")}</p>
        <p className="muted" style={{ margin: 0 }}>{t("loginBody")}</p>
        <Link href="/login?next=/schedule" className="btn btn-primary">{t("loginCta")}</Link>
      </section>
    );
  } else {
    const supabase = await createClient();
    // RLS limits this to the signed-in user's rows.
    const { data, error } = await supabase
      .from("schedules")
      .select("id,title,activity,field,due_date,repeat_days,note,done_at,created_at")
      .order("due_date")
      .limit(500);
    body = error ? (
      <p className="alert alert-error" role="alert">{t("loadFailed")}</p>
    ) : (
      <ScheduleView initial={(data ?? []) as Schedule[]} />
    );
  }

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <h1>{t("title")}</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>{t("subtitle")}</p>
        </div>
      </div>
      {body}
    </main>
  );
}
