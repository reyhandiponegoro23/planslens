// Error codes returned by API routes; the client maps them to messages under "errors.*".
export const apiErrorCodes = ["badRequest", "aiFailed", "notConfigured", "network", "generic"] as const;
export type ApiErrorCode = (typeof apiErrorCodes)[number];

export function toErrorCode(value: unknown): ApiErrorCode {
  return (apiErrorCodes as readonly unknown[]).includes(value) ? (value as ApiErrorCode) : "generic";
}

export type ConsultInput = {
  image: Blob;
  question: string;
  /** Earlier turns of this consultation, oldest first. */
  history?: { role: "user" | "assistant"; content: string }[];
  /** Language of an existing consultation; omitted for a new one (server uses the active locale). */
  language?: string;
};

/** `title` is a short AI-written name, returned for new consultations only. */
export type ConsultResponse = { answer: string; language: string; title?: string } | { error: ApiErrorCode };

export async function postConsult(input: ConsultInput): Promise<ConsultResponse> {
  const form = new FormData();
  form.append("image", input.image, "plant.jpg");
  form.append("question", input.question);
  form.append("history", JSON.stringify(input.history ?? []));
  if (input.language) form.append("language", input.language);
  try {
    const res = await fetch("/api/consult", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: toErrorCode(data.error) };
    return data;
  } catch {
    return { error: "network" };
  }
}
