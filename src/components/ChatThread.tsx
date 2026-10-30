"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { localeMeta } from "@/i18n/config";
import { postConsult } from "@/lib/api-errors";
import { enterToSend } from "@/lib/enter-to-send";
import { newMessage, saveConsultation, type Consultation } from "@/lib/local-store";
import { toast } from "@/lib/toast";
import { LeafIcon, SendIcon } from "./Icons";
import Markdown from "./Markdown";

type Props = { consultation: Consultation; imageUrl: string | null };

export default function ChatThread({ consultation, imageUrl }: Props) {
  const t = useTranslations();
  const format = useFormatter();
  const endRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(consultation);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const messages = current.messages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text) return toast(t("consult.needQuestion"), "error");
    setBusy(true);
    const asked = newMessage("user", text);
    setCurrent((c) => ({ ...c, messages: [...c.messages, asked] }));
    setQuestion("");
    const result = await postConsult({
      image: current.image,
      question: text,
      history: messages.map(({ role, content }) => ({ role, content })),
      // Follow-ups keep the consultation's original language, not the current UI language.
      language: current.language,
    });
    setBusy(false);
    if ("error" in result) {
      setCurrent((c) => ({ ...c, messages: c.messages.filter((m) => m.id !== asked.id) }));
      setQuestion(text);
      toast(t(`errors.${result.error}`), "error");
      return;
    }
    const updated = { ...current, messages: [...messages, asked, newMessage("assistant", result.answer)] };
    setCurrent(updated);
    saveConsultation(updated).catch(() => toast(t("errors.storageFailed"), "error"));
  }

  const time = (iso: string) => format.dateTime(new Date(iso), { timeStyle: "short" });

  return (
    <>
      <div className="chat-body">
        <p className="badge">{t("consult.languageBadge", { language: localeMeta[current.language].label })}</p>
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={m.id} className="msg msg-user">
              <div className="bubble bubble-user">
                {i === 0 && imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={t("camera.previewAlt")} />
                )}
                {/* Stored text is shown as-is, in its original language. */}
                <div lang={current.language} style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
              </div>
            </div>
          ) : (
            <div key={m.id} className="msg">
              <span className="avatar avatar-sm" aria-hidden><LeafIcon size={18} /></span>
              <div className="bubble bubble-assistant" lang={current.language}>
                <span className="sr-only">{t("consult.assistant")}: </span>
                <Markdown text={m.content} />
                <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
              </div>
            </div>
          )
        )}
        {busy && (
          <div className="msg" role="status">
            <span className="avatar avatar-sm" aria-hidden><LeafIcon size={18} /></span>
            <div className="bubble bubble-assistant muted"><span className="spinner" aria-hidden /> {t("consult.thinking")}</div>
          </div>
        )}
        <p className="muted small" style={{ textAlign: "center" }}>{t("consult.disclaimer")}</p>
        <div ref={endRef} />
      </div>
      <form className="chat-composer" onSubmit={send}>
        <div className="composer">
          <textarea
            className="pill-input"
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={enterToSend(busy)}
            placeholder={t("consult.followUpPlaceholder")}
            aria-label={t("consult.questionLabel")}
            maxLength={2000}
          />
          <button className="send-btn" disabled={busy} aria-label={t("consult.send")}>
            {busy ? <span className="spinner" aria-hidden /> : <SendIcon />}
          </button>
        </div>
        <p className="muted small enter-hint">{t("consult.enterHint")}</p>
      </form>
    </>
  );
}
