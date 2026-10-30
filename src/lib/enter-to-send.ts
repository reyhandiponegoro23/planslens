"use client";

/**
 * Enter submits the textarea's form; Shift+Enter inserts a new line.
 * On touch devices (no fine pointer) Enter keeps inserting a new line, since
 * phone keyboards have no Shift+Enter. Ignored while an IME is composing.
 */
export function enterToSend(busy: boolean) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    e.preventDefault();
    if (!busy) e.currentTarget.form?.requestSubmit();
  };
}
