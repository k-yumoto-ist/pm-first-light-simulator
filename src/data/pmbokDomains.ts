import type { PmbokDomain } from "./types";

export const pmbokDomains: Record<PmbokDomain, { label: string; description: string }> = {
  governance: { label: "ガバナンス", description: "意思決定の仕組みと責任範囲" },
  scope: { label: "スコープ", description: "何を作り、何を作らないか" },
  schedule: { label: "スケジュール", description: "いつ、どの順番で届けるか" },
  finance: { label: "財務", description: "予算とコストをどう扱うか" },
  stakeholders: { label: "ステークホルダー", description: "誰と期待値を合わせるか" },
  resources: { label: "リソース", description: "人と知識をどう活かすか" },
  risk: { label: "リスク", description: "不確実性にどう備えるか" },
};

export const availableTrainingDomains: PmbokDomain[] = ["scope", "schedule", "resources", "stakeholders"];
export const comingSoonTrainingDomains: PmbokDomain[] = ["governance", "finance", "risk"];
