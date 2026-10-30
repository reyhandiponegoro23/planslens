import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isLocale, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/request";
import { buildLanguageReminder, buildSystemPrompt, buildTitleInstruction } from "@/lib/ai-prompt";
import type { ApiErrorCode } from "@/lib/api-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"] as const;
type ImageType = (typeof ACCEPTED)[number];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TURNS = 40;

const fail = (error: ApiErrorCode, status: number) => NextResponse.json({ error }, { status });

type Turn = { role: "user" | "assistant"; content: string };

function parseHistory(raw: FormDataEntryValue | null): Turn[] | null {
  try {
    const value = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(value) || value.length > MAX_TURNS) return null;
    const ok = value.every(
      (m, i) => m && m.role === (i % 2 === 0 ? "user" : "assistant") && typeof m.content === "string"
    );
    return ok ? value.map((m) => ({ role: m.role, content: m.content.slice(0, 8000) })) : null;
  } catch {
    return null;
  }
}

/**
 * Stateless consultation turn. The client keeps the history on its device and sends
 * image + earlier turns + the new question. Multipart fields:
 *  image, question, history (JSON), language (only for follow-ups)
 */
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return fail("notConfigured", 500);

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  const question = String(form?.get("question") ?? "").trim().slice(0, 2000);
  const history = parseHistory(form?.get("history") ?? null);
  const requested = form?.get("language");
  if (!question || !history || !(image instanceof File) || image.size > MAX_BYTES) return fail("badRequest", 400);
  if (!ACCEPTED.includes(image.type as ImageType)) return fail("badRequest", 400);

  // Follow-ups keep the consultation's language; new consultations use the active locale.
  let language: Locale;
  if (history.length) {
    if (!isLocale(requested)) return fail("badRequest", 400);
    language = requested;
  } else {
    language = await resolveLocale();
  }

  const dataUrl = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`;
  // The photo is attached to the first user turn so follow-ups can still refer to it.
  const turns: OpenAI.ChatCompletionMessageParam[] = [...history, { role: "user" as const, content: question }].map(
    (m, i) =>
      i === 0
        ? {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: m.content },
            ],
          }
        : m
  );

  // A new consultation also gets a short title for the history list, in the same request.
  const isNew = history.length === 0;

  try {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 2048,
      ...(isNew && { response_format: { type: "json_object" as const } }),
      messages: [
        { role: "system", content: buildSystemPrompt(language) },
        ...turns,
        { role: "system", content: buildLanguageReminder(language) },
        ...(isNew ? [{ role: "system" as const, content: buildTitleInstruction(language) }] : []),
      ],
    });
    const raw = (response.choices[0]?.message?.content ?? "").trim();
    let answer = raw;
    let title: string | undefined;
    if (isNew) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.answer === "string") answer = parsed.answer.trim();
        if (typeof parsed.title === "string") title = parsed.title.trim().slice(0, 60) || undefined;
      } catch {
        // Not valid JSON: keep the raw text as the answer, the client falls back to the question.
      }
    }
    if (!answer) throw new Error("empty answer");
    return NextResponse.json({ answer, language, title });
  } catch (err) {
    console.error("AI request failed", err);
    return fail("aiFailed", 502);
  }
}
