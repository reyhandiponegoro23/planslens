"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TOAST_EVENT, type ToastKind } from "@/lib/toast";

type Item = { id: number; message: string; kind: ToastKind };

export default function Toaster() {
  const t = useTranslations("common");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, kind } = (e as CustomEvent<Omit<Item, "id">>).detail;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className={`toast toast-${i.kind}`}>
          <span>{i.message}</span>
          <button
            className="toast-close"
            aria-label={t("close")}
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
