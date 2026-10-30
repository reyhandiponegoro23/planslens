"use client";

import type { Locale } from "@/i18n/config";

// Consultations live on this device only (IndexedDB), until a database is added.

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };

export type Consultation = {
  id: string;
  title: string;
  /** Fixed when the consultation starts; follow-ups keep it. */
  language: Locale;
  image: Blob;
  createdAt: string;
  messages: ChatMessage[];
};

const DB_NAME = "plantlens";
const STORE = "consultations";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

export async function listConsultations(): Promise<Consultation[]> {
  const all = await run<Consultation[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const getConsultation = (id: string) =>
  run<Consultation | undefined>("readonly", (s) => s.get(id));

export const saveConsultation = (c: Consultation) => run<IDBValidKey>("readwrite", (s) => s.put(c));

export const deleteConsultation = (id: string) => run<undefined>("readwrite", (s) => s.delete(id));

export function newMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}
