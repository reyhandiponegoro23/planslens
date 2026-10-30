"use client";

export type ToastKind = "success" | "error" | "info";
export const TOAST_EVENT = "plantlens:toast";

/** Messages passed here must already be translated. */
export function toast(message: string, kind: ToastKind = "info") {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, kind } }));
}
