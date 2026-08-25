"use client";

import type { Difficulty } from "@/src/data/types";
import type { ScenarioMode } from "@/src/data/statefulScenarioTypes";

export const PLAY_SAVE_KEY = "pm-simulator-play-save";
export const PLAY_SAVE_VERSION = 1;

export type SavedPlaySession = {
  saveVersion: number;
  savedAt: string;
  mode: "light" | ScenarioMode;
  scenarioId?: string;
  difficulty?: Difficulty;
  guided: boolean;
  state: unknown;
};

export function readPlaySession(): SavedPlaySession | null {
  try {
    const raw = window.localStorage.getItem(PLAY_SAVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SavedPlaySession;
    return value.saveVersion === PLAY_SAVE_VERSION ? value : null;
  } catch { return null; }
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
