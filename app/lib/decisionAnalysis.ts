import type { ActionLog, MetricChange, ScoreKey } from "../types/game";
import { metricLabels } from "../data/uiLabels";

export type AnalysisEffect = {
  label: string;
  delta: number;
  tone: "positive" | "neutral" | "negative";
  direction: "改善" | "悪化" | "変化なし";
};

export type DecisionAnalysis = {
  id: string;
  step: number;
  timing: string;
  situation: string;
  selectedAction: string;
  immediateResult: string;
  immediateEffects: AnalysisEffect[];
  delayedEffects: Array<{ title: string; detail: string; effects: AnalysisEffect[] }>;
  categories: string[];
  learningPoint: string;
  why: string;
  strengths: string[];
  improvements: string[];
  relatedDecisionId?: string;
  alternatives: string[];
};

export type DecisionAnalysisSummary = {
  narrative: string;
  categories: Array<{ label: string; count: number }>;
  strengths: string[];
  improvements: string[];
};

const categoryLabels: Record<ScoreKey, string> = {
  scope: "スコープ",
  schedule: "スケジュール",
  stakeholder: "ステークホルダー",
  risk: "リスク",
};

const metricCategoryLabels: Partial<Record<MetricChange["key"], string>> = {
  quality: "品質",
  team: "チーム",
  riskExposure: "リスク",
  schedule: "スケジュール",
  scopeStability: "スコープ",
  stakeholderAlignment: "ステークホルダー",
};

function favorable(change: MetricChange) {
  const delta = change.after - change.before;
  return change.key === "riskExposure" ? delta < 0 : delta > 0;
}

function effectLabel(change: MetricChange): AnalysisEffect {
  const delta = change.after - change.before;
  const positive = favorable(change);
  const key = change.key === "team" ? "team" : change.key;
  return {
    label: metricLabels[key] ?? String(key),
    delta,
    tone: delta === 0 ? "neutral" : positive ? "positive" : "negative",
    direction: delta === 0 ? "変化なし" : positive ? "改善" : "悪化",
  };
}

function selectImportantActions(logs: ActionLog[], stateful: boolean) {
  const actions = logs.filter(log => log.kind === "action");
  if (stateful) return actions.filter(log => log.id.startsWith("decision-"));
  const byTurn = new Map<number, ActionLog>();
  for (const log of actions) {
    const impact = log.changes.reduce((sum, item) => sum + Math.abs(item.after - item.before), 0);
    const previous = byTurn.get(log.turn);
    const previousImpact = previous?.changes.reduce((sum, item) => sum + Math.abs(item.after - item.before), 0) ?? -1;
    if (!previous || impact >= previousImpact) byTurn.set(log.turn, log);
  }
  return [...byTurn.values()].sort((a, b) => a.turn - b.turn);
}

export function buildDecisionAnalysis(logs: ActionLog[], stateful = false): DecisionAnalysis[] {
  const important = selectImportantActions(logs, stateful);
  return important.map((log, index) => {
    const next = important[index + 1];
    const delayed = logs.filter(item => item.kind === "event" && item.turn > log.turn && (!next || item.turn <= next.turn));
    const effects = log.changes.map(effectLabel);
    const positive = effects.filter(item => item.tone === "positive");
    const negative = effects.filter(item => item.tone === "negative");
    return {
      id: log.id,
      step: log.turn,
      timing: `ターン ${log.turn}`,
      situation: log.event,
      selectedAction: log.label,
      immediateResult: log.result,
      immediateEffects: effects,
      delayedEffects: delayed.map(item => ({ title: item.label, detail: item.result, effects: item.changes.map(effectLabel) })),
      categories: [...new Set([...log.tags.map(tag => categoryLabels[tag]), ...log.changes.map(change => metricCategoryLabels[change.key]).filter((label): label is string => Boolean(label))])],
      learningPoint: log.learning,
      why: log.why,
      strengths: positive.length ? [`${positive.map(item => item.label).join("・")}を守る方向に働きました。`] : [],
      improvements: negative.length ? [`${negative.map(item => item.label).join("・")}への影響も確認すると、別の着地点を検討できました。`] : [],
      relatedDecisionId: delayed.length ? log.id : undefined,
      alternatives: log.alternatives ?? [],
    };
  });
}

export function summarizeDecisionAnalysis(items: DecisionAnalysis[]): DecisionAnalysisSummary {
  const counts = new Map<string, number>();
  items.flatMap(item => item.categories).forEach(label => counts.set(label, (counts.get(label) ?? 0) + 1));
  const categories = [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const strengths = [...new Set(items.flatMap(item => item.strengths))].slice(0, 3);
  const improvements = [...new Set(items.flatMap(item => item.improvements))].slice(0, 3);
  const focus = categories[0]?.label ?? "状況整理";
  const delayedCount = items.filter(item => item.delayedEffects.length).length;
  return {
    narrative: `今回は${focus}に関わる判断が多く見られました。${delayedCount ? `そのうち${delayedCount}件は、後の状況にも影響しています。` : "判断直後の結果を中心にプロジェクトを動かしました。"} 短期の効果と後から生じる影響を並べて振り返りましょう。`,
    categories,
    strengths: strengths.length ? strengths : ["状況に応じて意思決定を行い、プロジェクトを前へ進めました。"],
    improvements: improvements.length ? improvements : ["次回は、判断前に別の関係者や後続工程への影響も確認してみましょう。"],
  };
}
