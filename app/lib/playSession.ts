"use client";

import type { Difficulty } from "@/src/data/types";
import type { ScenarioMode } from "@/src/data/statefulScenarioTypes";

export const PLAY_SAVE_KEY = "pm-simulator-play-save";
export const PLAY_SAVE_VERSION = 2;
const LEGACY_PLAY_SAVE_VERSIONS = new Set([1, PLAY_SAVE_VERSION]);

export type SavedPlaySession = {
  saveVersion: number;
  savedAt: string;
  mode: "light" | ScenarioMode;
  scenarioId?: string;
  difficulty?: Difficulty;
  guided: boolean;
  state: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSavedPlaySession(value: unknown): value is SavedPlaySession {
  if (!isRecord(value)) return false;
  if (typeof value.saveVersion !== "number" || !LEGACY_PLAY_SAVE_VERSIONS.has(value.saveVersion)) return false;
  if (typeof value.savedAt !== "string" || Number.isNaN(Date.parse(value.savedAt))) return false;
  if (value.mode !== "light" && value.mode !== "training" && value.mode !== "project") return false;
  if (value.scenarioId !== undefined && typeof value.scenarioId !== "string") return false;
  if (value.difficulty !== undefined && value.difficulty !== "guided" && value.difficulty !== "standard" && value.difficulty !== "challenge") return false;
  return typeof value.guided === "boolean" && isRecord(value.state);
}

export function readPlaySession(): SavedPlaySession | null {
  try {
    const raw = window.localStorage.getItem(PLAY_SAVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    if (!isSavedPlaySession(value)) {
      window.localStorage.removeItem(PLAY_SAVE_KEY);
      return null;
    }
    return value;
  } catch {
    try { window.localStorage.removeItem(PLAY_SAVE_KEY); } catch {}
    return null;
  }
}

export function writePlaySession(session: Omit<SavedPlaySession, "saveVersion" | "savedAt">) {
  try {
    window.localStorage.setItem(PLAY_SAVE_KEY, JSON.stringify({ ...session, saveVersion: PLAY_SAVE_VERSION, savedAt: new Date().toISOString() }));
  } catch { /* Storage is optional: the simulator remains playable without it. */ }
}

export function clearPlaySession() {
  try { window.localStorage.removeItem(PLAY_SAVE_KEY); } catch {}
}

export function formatSavedAt(iso: string) {
  try { return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); } catch { return iso; }
}
