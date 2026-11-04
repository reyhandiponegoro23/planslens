"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "code";

/**
 * Passwordless sign-in with a one-time code: Supabase emails a short code (see the
 * "Magic Link" email template), the user types it here. No link, so no redirect URLs to get wrong,
 * and the email can be read on a different device than the one signing in.
 */
export default function EmailLogin({ next = "/schedule" }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"send" | "rate" | "code" | null>(null);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError("send");
    setBusy(true);
    setError(null);
    // The same email carries a link too (Supabase's default template has no code): keep it working.
    // No query string, so it matches the redirect allow-list; where to land goes in a cookie.
    document.cookie = `plantlens_next=${encodeURIComponent(next)}; path=/; max-age=3600; samesite=lax`;
    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    // Supabase's built-in mailer allows only a few emails per hour per project.
    if (error) return setError(error.status === 429 || error.code === "over_email_send_rate_limit" ? "rate" : "send");
    setCode("");
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setError("code");
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (error) {
      setBusy(false);
      return setError("code");
    }
    const target = next.startsWith("/") && !next.startsWith("//") ? next : "/schedule";
    router.replace(target);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form className="stack" onSubmit={verify}>
        <p className="alert alert-info" role="status">{t("codeSent", { email: email.trim() })}</p>
        <label className="field">
          <span>{t("codeLabel")}</span>
          <input
            className="text-input code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
          />
        </label>
        {error === "code" && <p className="alert alert-error" role="alert">{t("codeInvalid")}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <><span className="spinner" aria-hidden /> {t("verifying")}</> : t("verify")}
        </button>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <button type="button" className="link-button small" onClick={() => { setStep("email"); setError(null); }}>
            {t("changeEmail")}
          </button>
          <button type="button" className="link-button small" disabled={busy} onClick={() => sendCode()}>
            {t("resend")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="stack" onSubmit={sendCode}>
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
      {error === "send" && <p className="alert alert-error" role="alert">{t("sendFailed")}</p>}
      {error === "rate" && <p className="alert alert-error" role="alert">{t("rateLimited")}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? <><span className="spinner" aria-hidden /> {t("sending")}</> : t("sendCode")}
      </button>
    </form>
  );
}
