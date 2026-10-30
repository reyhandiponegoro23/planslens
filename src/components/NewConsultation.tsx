"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { isLocale, localeMeta } from "@/i18n/config";
import { postConsult } from "@/lib/api-errors";
import { enterToSend } from "@/lib/enter-to-send";
import { newMessage, saveConsultation } from "@/lib/local-store";
import { toast } from "@/lib/toast";
import { SendIcon } from "./Icons";
import PhotoPicker from "./PhotoPicker";

const EXAMPLES = ["example1", "example2", "example3", "example4"] as const;

export default function NewConsultation() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!photo) return setError(t("consult.needPhoto"));
    if (!text) return setError(t("consult.needQuestion"));
    setError(null);
    setBusy(true);
    const asked = newMessage("user", text);
    const result = await postConsult({ image: photo, question: text });
    if ("error" in result) {
      setBusy(false);
      toast(t(`errors.${result.error}`), "error");
      return;
    }
    const id = crypto.randomUUID();
    try {
      await saveConsultation({
        id,
        title: result.title || text.slice(0, 60),
        language: isLocale(result.language) ? result.language : locale,
        image: photo,
        createdAt: asked.createdAt,
        messages: [asked, newMessage("assistant", result.answer)],
      });
    } catch {
      setBusy(false);
      toast(t("errors.storageFailed"), "error");
      return;
    }
    router.push(`/history/${id}`);
  }

  return (
    <form className="stack" onSubmit={submit}>
      <PhotoPicker onChange={(p) => { setPhoto(p); setError(null); }} />
      <div className="composer">
        <textarea
          ref={inputRef}
          className="pill-input"
          rows={1}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={enterToSend(busy)}
          placeholder={t("consult.questionPlaceholder")}
          aria-label={t("consult.questionLabel")}
          maxLength={2000}
        />
        <button className="send-btn" disabled={busy} aria-label={t("consult.send")}>
          {busy ? <span className="spinner" aria-hidden /> : <SendIcon />}
        </button>
      </div>
      {busy && <p className="muted small" role="status"><span className="spinner" aria-hidden /> {t("consult.analyzing")}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <p className="muted small enter-hint">{t("consult.enterHint")}</p>
      <div className="stack">
        <span className="small">{t("home.examplesTitle")}</span>
        <div className="chips">
          {EXAMPLES.map((key) => (
            <button
              key={key}
              type="button"
              className="chip"
              onClick={() => {
                setQuestion(t(`home.${key}`));
                inputRef.current?.focus();
              }}
            >
              {t(`home.${key}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="muted small">{t("home.answerLanguage", { language: localeMeta[locale].label })}</p>
    </form>
  );
}
