import type { ScenarioActionCategory } from "../statefulScenarioTypes";

export const statefulActionCategories: ScenarioActionCategory[] = [
  { id: "hearing", label: "関係者ヒアリング", description: "誰に、何を確認するかを選ぶ", icon: "◉" },
  { id: "schedule", label: "スケジュール点検", description: "残作業と依存関係を確かめる", icon: "◷" },
  { id: "risk", label: "リスク整理", description: "先に起こり得る問題を整理する", icon: "△" },
  { id: "scope", label: "要件・スコープ整理", description: "価値と今回の範囲を整理する", icon: "◎" },
  { id: "team", label: "チーム状況確認", description: "負荷と品質を支える余力を見る", icon: "♟" },
  { id: "report", label: "状況共有・報告", description: "必要な相手へ事実と影響を伝える", icon: "↗" },
];
