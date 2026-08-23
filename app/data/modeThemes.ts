import type { CSSProperties } from "react";

export type SimulatorMode = "light" | "training" | "project";

export const modeThemes = {
  light: {
    label: "ライトモード",
    shortLabel: "ライト",
    className: "mode-light",
    accent: "#16877c",
    accentHover: "#0f6f67",
    accentSoft: "#dfeee9",
    accentContrast: "#ffffff",
  },
  training: {
    label: "トレーニングモード",
    shortLabel: "トレーニング",
    className: "mode-training",
    accent: "#4778b6",
    accentHover: "#35639c",
    accentSoft: "#e8eef7",
    accentContrast: "#ffffff",
  },
  project: {
    label: "プロジェクトシナリオ",
    shortLabel: "シナリオ",
    className: "mode-project",
    accent: "#d16443",
    accentHover: "#ad4d34",
    accentSoft: "#f7e7df",
    accentContrast: "#ffffff",
  },
} as const satisfies Record<SimulatorMode, {
  label: string;
  shortLabel: string;
  className: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentContrast: string;
}>;

export function modeThemeStyle(mode: SimulatorMode): CSSProperties {
  const theme = modeThemes[mode];
  return {
    "--mode-accent": theme.accent,
    "--mode-accent-hover": theme.accentHover,
    "--mode-accent-soft": theme.accentSoft,
    "--mode-accent-contrast": theme.accentContrast,
  } as CSSProperties;
}
