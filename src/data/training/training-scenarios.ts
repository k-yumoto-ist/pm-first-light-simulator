import type { PmbokDomain } from "../types";
import type { StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { financeTraining } from "./finance-training";
import { governanceTraining } from "./governance-training";
import { resourceTraining } from "./resource-training";
import { riskTraining } from "./risk-training";
import { scheduleTraining } from "./schedule-training";
import { scopeTraining } from "./scope-training";
import { stakeholderTraining } from "./stakeholder-training";

const trainingDefaults = {
  investigationBudget: { guided: 3, standard: 2, challenge: 2 },
  scoreWeights: { outcome: 0.3, decision: 0.4, information: 0.3 },
} as const;

const learningActions: Record<string, string[]> = {
  "governance-training": ["判断者と相談相手を分ける", "判断基準と権限を明確にする", "決定内容と条件を記録する"],
  "scope-training": ["要求の目的を確認してから範囲を考える", "変更影響を事実として整理する", "優先順位と対象外を合意する"],
  "schedule-training": ["遅延原因と依存関係を分けて確認する", "クリティカルパスから回復余地を探す", "品質条件を守れる再計画を合意する"],
  "finance-training": ["予算基準と実績差を確認する", "事業価値を基準に配分案を比較する", "予測と承認条件を記録する"],
  "stakeholder-training": ["主張の奥にある目的を確認する", "影響力と意思決定者を整理する", "成功条件と期待値を合意する"],
  "resource-training": ["能力・負荷・依存関係を可視化する", "知識移転を実作業で確かめる", "継続できる役割配置を合意する"],
  "risk-training": ["兆候・発生条件・影響を分ける", "優先度に応じた対応策を用意する", "発動条件と責任者を合意する"],
};

function configureTraining(scenario: StatefulScenarioDefinition): StatefulScenarioDefinition {
  return {
    ...scenario,
    investigationBudget: trainingDefaults.investigationBudget,
    resultConfig: {
      ...scenario.resultConfig,
      scoreWeights: trainingDefaults.scoreWeights,
      showPmStyle: false,
      learningActions: learningActions[scenario.id],
    },
  };
}

export const statefulTrainingScenarios: Record<string, StatefulScenarioDefinition> = {
  "governance-training": configureTraining(governanceTraining),
  "scope-training": configureTraining(scopeTraining),
  "schedule-training": configureTraining(scheduleTraining),
  "finance-training": configureTraining(financeTraining),
  "stakeholder-training": configureTraining(stakeholderTraining),
  "resource-training": configureTraining(resourceTraining),
  "risk-training": configureTraining(riskTraining),
};

export const trainingScenarioCards: Array<{ id: string; domain: PmbokDomain; label: string; icon: string; description: string }> = [
  { id: "governance-training", domain: "governance", label: "ガバナンス", icon: "⌂", description: "判断権限と合意の進め方を整理する" },
  { id: "scope-training", domain: "scope", label: "スコープ", icon: "◎", description: "要求の目的と変更影響を整理する" },
  { id: "schedule-training", domain: "schedule", label: "スケジュール", icon: "◷", description: "遅延の構造を見て回復策を作る" },
  { id: "finance-training", domain: "finance", label: "財務", icon: "¥", description: "限られた予算の使い方を比較する" },
  { id: "stakeholder-training", domain: "stakeholders", label: "ステークホルダー", icon: "◇", description: "目的を確認し、期待を合わせる" },
  { id: "resource-training", domain: "resources", label: "リソース", icon: "♟", description: "能力・負荷・知識を配置する" },
  { id: "risk-training", domain: "risk", label: "リスク", icon: "△", description: "不確実性への対応と発動条件を備える" },
];

export function getStatefulTrainingScenario(id: string) {
  return statefulTrainingScenarios[id];
}
