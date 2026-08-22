import type { PmbokDomain } from "./types";

export const pmbokDomains: Record<PmbokDomain, { label: string; description: string }> = {
  governance: { label: "Governance", description: "意思決定の仕組みと責任範囲" },
  scope: { label: "Scope", description: "何を作り、何を作らないか" },
  schedule: { label: "Schedule", description: "いつ、どの順番で届けるか" },
  finance: { label: "Finance", description: "予算とコストをどう扱うか" },
  stakeholders: { label: "Stakeholders", description: "誰と期待値を合わせるか" },
  resources: { label: "Resources", description: "人と知識をどう活かすか" },
  risk: { label: "Risk", description: "不確実性にどう備えるか" },
};

export const availableTrainingDomains: PmbokDomain[] = ["scope", "schedule", "resources", "stakeholders"];
export const comingSoonTrainingDomains: PmbokDomain[] = ["governance", "finance", "risk"];
