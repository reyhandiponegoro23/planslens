"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteConsultation } from "@/lib/local-store";
import { toast } from "@/lib/toast";
import ConfirmDialog from "./ConfirmDialog";
import { MoreIcon, TrashIcon } from "./Icons";

/** The ⋮ menu on the chat screen. */
export default function ConsultationMenu({ id }: { id: string }) {
  const t = useTranslations();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button className="icon-btn" aria-label={t("consult.menu")} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MoreIcon />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          <button role="menuitem" className="menu-item danger" onClick={() => { setOpen(false); setConfirm(true); }}>
            <TrashIcon size={18} /> {t("common.delete")}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        danger
        title={t("history.deleteTitle")}
        body={t("history.deleteBody")}
        confirmLabel={t("common.delete")}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          try {
            await deleteConsultation(id);
            toast(t("history.deleted"), "success");
            router.push("/history");
          } catch {
            toast(t("errors.storageFailed"), "error");
          }
        }}
      />
    </div>
  );
}
