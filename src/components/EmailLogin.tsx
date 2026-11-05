"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Mode = "signIn" | "signUp";
type ErrorKey = "invalidEmail" | "weakPassword" | "invalidCredentials" | "userExists" | "confirmStillOn" | "genericError";

const MIN_PASSWORD = 8;

/**
 * Email + password sign-in. No email is sent: Supabase's "Confirm email" setting must be off,
 * otherwise sign-up returns no session (we explain that instead of failing silently).
 */
export default function EmailLogin({ next = "/schedule" }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);

  function done() {
    const target = next.startsWith("/") && !next.startsWith("//") ? next : "/schedule";
    router.replace(target);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError("invalidEmail");
    if (password.length < MIN_PASSWORD) return setError("weakPassword");
    setBusy(true);
    setError(null);
    const auth = createClient().auth;

    if (mode === "signIn") {
      const { error } = await auth.signInWithPassword({ email: address, password });
      if (!error) return done();
      setBusy(false);
      return setError(error.code === "invalid_credentials" || error.status === 400 ? "invalidCredentials" : "genericError");
    }

    const { data, error } = await auth.signUp({ email: address, password });
    if (error) {
      setBusy(false);
      if (error.code === "user_already_exists") return setError("userExists");
      if (error.code === "weak_password") return setError("weakPassword");
      return setError("genericError");
    }
    if (!data.session) {
      // "Confirm email" is still on in Supabase, so it wants to email a link we don't use.
      setBusy(false);
      return setError("confirmStillOn");
    }
    done();
  }

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  return (
    <form className="stack" onSubmit={submit}>
      <div className="segmented" role="tablist" aria-label={t("modeLabel")}>
        {(["signIn", "signUp"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "is-active" : ""} onClick={() => switchTo(m)}>
            {t(m === "signIn" ? "signInTab" : "signUpTab")}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{t("email")}</span>
        <input className="text-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} />
      </label>
      <label className="field">
        <span>{t("password")}</span>
        <div className="password-wrap">
          <input
            className="text-input"
            type={show ? "text" : "password"}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
          />
          <button type="button" className="link-button small password-toggle" onClick={() => setShow((s) => !s)}>
            {show ? t("hidePassword") : t("showPassword")}
          </button>
        </div>
      </label>
      {error && <p className="alert alert-error" role="alert">{t(error)}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? <span className="spinner" aria-hidden /> : null} {t(mode === "signIn" ? "signInButton" : "signUpButton")}
      </button>
      {mode === "signUp" && <p className="muted small" style={{ margin: 0 }}>{t("rememberPassword")}</p>}
    </form>
  );
}
