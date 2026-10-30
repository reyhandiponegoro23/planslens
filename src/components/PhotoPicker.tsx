"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CameraIcon, CloseIcon, ImageIcon, PencilIcon } from "./Icons";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 1568;

/** Downscales to a JPEG the vision model handles well and that uploads quickly. */
async function normalize(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85)
  );
}

export default function PhotoPicker({ onChange }: { onChange: (photo: Blob | null) => void }) {
  const t = useTranslations("camera");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stream?.getTracks().forEach((tr) => tr.stop()), [stream]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  function setPhoto(blob: Blob | null) {
    setPreview(blob ? URL.createObjectURL(blob) : null);
    onChange(blob);
  }

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) return setError(t("unavailable"));
    setStarting(true);
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }));
    } catch (e) {
      setError((e as DOMException).name === "NotAllowedError" ? t("permissionDenied") : t("unavailable"));
    } finally {
      setStarting(false);
    }
  }

  function closeCamera() {
    stream?.getTracks().forEach((tr) => tr.stop());
    setStream(null);
  }

  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const raw = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    closeCamera();
    if (raw) setPhoto(await normalize(raw));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError(t("invalidFile"));
    if (file.size > MAX_BYTES) return setError(t("fileTooLarge"));
    try {
      setPhoto(await normalize(file));
    } catch {
      setError(t("invalidFile"));
    }
  }

  return (
    <div className="stack">
      <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} hidden onChange={onFile} />
      {stream ? (
        <div className="photo-frame">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="camera-actions">
            <button type="button" className="btn btn-primary" onClick={capture}><CameraIcon /> {t("capture")}</button>
            <button type="button" className="btn btn-ghost" onClick={closeCamera}>{t("closeCamera")}</button>
          </div>
        </div>
      ) : (
        <div className="action-grid">
          <button type="button" className="action action-primary" onClick={openCamera} disabled={starting}>
            {starting ? <span className="spinner" aria-hidden /> : <CameraIcon size={28} />}
            {starting ? t("starting") : t("takePhoto")}
          </button>
          <button type="button" className="action" onClick={() => fileRef.current?.click()}>
            <ImageIcon size={28} />
            {t("gallery")}
          </button>
        </div>
      )}
      {preview && !stream && (
        <div className="stack">
          <div className="photo-card-head">
            <span>{t("selected")}</span>
            <button type="button" className="icon-btn" aria-label={t("removePhoto")} onClick={() => setPhoto(null)}>
              <CloseIcon size={18} />
            </button>
          </div>
          <div className="photo-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={t("previewAlt")} />
            <button type="button" className="photo-edit" aria-label={t("changePhoto")} onClick={() => fileRef.current?.click()}>
              <PencilIcon size={18} />
            </button>
          </div>
        </div>
      )}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {!preview && !stream && <p className="muted small">{t("hint")} {t("uploadHint")}</p>}
    </div>
  );
}
