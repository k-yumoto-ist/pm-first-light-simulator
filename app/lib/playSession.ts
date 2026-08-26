import type { ScenarioMode } from "@/src/data/statefulScenarioTypes";
import type { Difficulty } from "@/src/data/types";

type SimulatorMode = "light" | ScenarioMode;

const LEGACY_PLAY_SAVE_KEY = "pm-simulator-play-save";
const SAVED_GAMES_KEY = "pm-simulator-saved-games";
export const PLAY_SAVE_VERSION = 3;
const SAVE_COLLECTION_VERSION = 1;

export interface SaveProgress {
  current: number;
  total: number;
  label?: string;
}

export interface SavedPlaySession<TState = unknown> {
  id: string;
  version: number;
  saveVersion: number;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
  mode: SimulatorMode;
  scenarioId?: string;
  scenarioName?: string;
  difficulty?: Difficulty;
  guided: boolean;
  progress: SaveProgress;
  state: TState;
}

export type SaveGameInput<TState = unknown> = Omit<
  SavedPlaySession<TState>,
  "id" | "version" | "saveVersion" | "createdAt" | "updatedAt" | "savedAt"
> & { id?: string };

interface SavedGameCollection {
  version: number;
  saves: SavedPlaySession[];
}

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMode(value: unknown): value is SimulatorMode {
  return value === "light" || value === "training" || value === "project";
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "guided" || value === "standard" || value === "challenge";
}

function isProgress(value: unknown): value is SaveProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Partial<SaveProgress>;
  return Number.isFinite(progress.current) && Number.isFinite(progress.total);
}

function isSavedSession(value: unknown): value is SavedPlaySession {
  if (!value || typeof value !== "object") return false;
  const save = value as Partial<SavedPlaySession>;
  return (
    typeof save.id === "string" &&
    save.id.length > 0 &&
    save.version === PLAY_SAVE_VERSION &&
    save.saveVersion === PLAY_SAVE_VERSION &&
    typeof save.createdAt === "string" &&
    typeof save.updatedAt === "string" &&
    typeof save.savedAt === "string" &&
    isMode(save.mode) &&
    (save.difficulty === undefined || isDifficulty(save.difficulty)) &&
    typeof save.guided === "boolean" &&
    isProgress(save.progress) &&
    save.state !== undefined
  );
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `save-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferLegacyProgress(raw: Record<string, unknown>, mode: SimulatorMode): SaveProgress {
  const state = raw.state as { snapshot?: Record<string, unknown> } | undefined;
  const snapshot = state?.snapshot;
  if (mode === "light") {
    const game = snapshot?.game as { turn?: number } | undefined;
    return { current: Math.max(1, Number(game?.turn ?? 1)), total: 4, label: "ターン" };
  }
  const turnIndex = Number(snapshot?.turnIndex ?? 0);
  return { current: Math.max(1, turnIndex + 1), total: mode === "training" ? 3 : 5, label: "ターン" };
}

function migrateLegacySave(raw: unknown): SavedPlaySession | null {
  if (!raw || typeof raw !== "object") return null;
  const legacy = raw as Record<string, unknown>;
  if (!isMode(legacy.mode) || typeof legacy.guided !== "boolean" || legacy.state === undefined) return null;
  const savedAt = typeof legacy.savedAt === "string" ? legacy.savedAt : new Date().toISOString();
  return {
    id: createId(),
    version: PLAY_SAVE_VERSION,
    saveVersion: PLAY_SAVE_VERSION,
    createdAt: savedAt,
    updatedAt: savedAt,
    savedAt,
    mode: legacy.mode,
    scenarioId: typeof legacy.scenarioId === "string" ? legacy.scenarioId : undefined,
    scenarioName: typeof legacy.scenarioName === "string" ? legacy.scenarioName : undefined,
    difficulty: isDifficulty(legacy.difficulty) ? legacy.difficulty : undefined,
    guided: legacy.guided,
    progress: inferLegacyProgress(legacy, legacy.mode),
    state: legacy.state,
  };
}

function writeCollection(saves: SavedPlaySession[]) {
  if (!storageAvailable()) return false;
  const collection: SavedGameCollection = { version: SAVE_COLLECTION_VERSION, saves };
  try {
    window.localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(collection));
    return true;
  } catch {
    return false;
  }
}

function readCollection(): SavedPlaySession[] {
  if (!storageAvailable()) return [];
  try {
    const serialized = window.localStorage.getItem(SAVED_GAMES_KEY);
    if (!serialized) return [];
    const parsed = JSON.parse(serialized) as Partial<SavedGameCollection>;
    if (parsed.version !== SAVE_COLLECTION_VERSION || !Array.isArray(parsed.saves)) return [];
    return parsed.saves.filter(isSavedSession);
  } catch {
    return [];
  }
}

function migrateLegacyIfNeeded() {
  if (!storageAvailable()) return;
  const existing = readCollection();
  const serialized = window.localStorage.getItem(LEGACY_PLAY_SAVE_KEY);
  if (!serialized) return;
  try {
    const migrated = migrateLegacySave(JSON.parse(serialized));
    if (!migrated) return;
    if (writeCollection([...existing, migrated])) window.localStorage.removeItem(LEGACY_PLAY_SAVE_KEY);
  } catch {
    // 壊れた旧保存は無効として扱い、通常プレイを継続できるようにする。
  }
}

export function loadGames(): SavedPlaySession[] {
  migrateLegacyIfNeeded();
  return readCollection().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadGame(id?: string): SavedPlaySession | null {
  const saves = loadGames();
  return id ? saves.find((save) => save.id === id) ?? null : saves[0] ?? null;
}

export function saveGame<TState>(input: SaveGameInput<TState>): SavedPlaySession<TState> | null {
  const saves = loadGames();
  const previous = input.id ? saves.find((save) => save.id === input.id) : undefined;
  const now = new Date().toISOString();
  const saved: SavedPlaySession<TState> = {
    ...input,
    id: previous?.id ?? createId(),
    version: PLAY_SAVE_VERSION,
    saveVersion: PLAY_SAVE_VERSION,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    savedAt: now,
  };
  const next = previous ? saves.map((item) => (item.id === previous.id ? saved : item)) : [...saves, saved];
  return writeCollection(next) ? saved : null;
}

export function deleteSave(id: string) {
  const saves = loadGames();
  return writeCollection(saves.filter((save) => save.id !== id));
}

export function hasSaveData() {
  return loadGames().length > 0;
}

export function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// 既存呼び出し元を段階的に移行するための互換名。
export const readPlaySession = loadGame;
export const writePlaySession = saveGame;
export const clearPlaySession = deleteSave;
