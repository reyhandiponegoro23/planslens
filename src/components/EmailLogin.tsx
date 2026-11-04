"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/** Passwordless sign-in: Supabase emails a one-time link that lands on /auth/callback. */
export default function EmailLogin({ next = "/schedule" }: { next?: string }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setState("error");
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <div className="alert alert-info" role="status">
        <strong>{t("checkTitle")}</strong>
        <p style={{ margin: "4px 0 0" }}>{t("checkBody", { email: email.trim() })}</p>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label className="field">
        <span>{t("email")}</span>
        <input
          className="text-input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
        />
      </label>
      {state === "error" && <p className="alert alert-error" role="alert">{t("sendFailed")}</p>}
      <button className="btn btn-primary" disabled={state === "sending"}>
        {state === "sending" ? <><span className="spinner" aria-hidden /> {t("sending")}</> : t("sendLink")}
      </button>
    </form>
  );
}
