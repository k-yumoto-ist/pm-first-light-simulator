import type { ProjectContext, ScenarioStakeholder, StakeholderGroup, StakeholderRelationship, StakeholderRelationshipType, StatefulScenarioDefinition } from "@/src/data/statefulScenarioTypes";

export const stakeholderGroupLabels: Record<StakeholderGroup, string> = {
  customer: "顧客・利用者",
  management: "管理・意思決定",
  business: "ビジネス",
  operations: "運用・管理",
  development: "開発チーム",
  quality: "品質管理",
  other: "その他の関係者",
};

export const stakeholderRelationshipLabels: Record<StakeholderRelationshipType, string> = {
  report: "報告・連携",
  consult: "相談",
  request: "要求・期待",
  coordinate: "指示・調整",
  decision: "意思決定",
  escalation: "エスカレーション",
  other: "連携",
};

export function inferStakeholderGroup(role: string): StakeholderGroup {
  if (/QA|品質/.test(role)) return "quality";
  if (/運用|情シス|管理者/.test(role)) return "operations";
  if (/営業|事業/.test(role)) return "business";
  if (/部長|責任者|決裁|上司/.test(role) && !/営業|運用|情シス|開発/.test(role)) return "management";
  if (/顧客|業務担当|利用者/.test(role)) return "customer";
  if (/開発|エンジニア|テック|後任|デザイナー/.test(role)) return "development";
  return "other";
}

function inferRelationship(stakeholder: ScenarioStakeholder): StakeholderRelationship {
  const group = stakeholder.group ?? inferStakeholderGroup(stakeholder.role);
  if (group === "management") return { from: "pm", to: stakeholder.id, type: "decision", label: "判断・承認" };
  if (group === "customer" || group === "business") return { from: stakeholder.id, to: "pm", type: "request", label: "要求・期待" };
  if (group === "quality") return { from: stakeholder.id, to: "pm", type: "consult", label: "品質相談" };
  if (group === "operations") return { from: "pm", to: stakeholder.id, type: "coordinate", label: "条件調整" };
  return { from: "pm", to: stakeholder.id, type: "coordinate", label: "指示・調整" };
}

export function normalizeStakeholder(stakeholder: ScenarioStakeholder, currentTurn?: number): ScenarioStakeholder {
  const turnStatus = currentTurn ? stakeholder.currentStatusByTurn?.[currentTurn] : undefined;
  const turnFacts = currentTurn ? stakeholder.factsByTurn?.[currentTurn] : undefined;
  return {
    ...stakeholder,
    group: stakeholder.group ?? inferStakeholderGroup(stakeholder.role),
    summary: stakeholder.summary ?? `${stakeholder.role}として、${stakeholder.priority}という観点を重視しています。`,
    traits: stakeholder.traits?.length ? stakeholder.traits : [stakeholder.priority],
    currentStatus: turnStatus?.length ? turnStatus : stakeholder.currentStatus?.length ? stakeholder.currentStatus : ["現在の案件状況を確認しながら、担当領域の判断を進めています。"],
    relationshipToPlayer: stakeholder.relationshipToPlayer?.length ? stakeholder.relationshipToPlayer : ["必要な情報を確認し、担当領域の影響を調整します。"],
    attentionLevel: stakeholder.attentionLevel ?? "normal",
    facts: turnFacts?.length ? turnFacts : stakeholder.facts,
  };
}

export function buildStatefulStakeholderMap(scenario: StatefulScenarioDefinition, currentIssue?: string, currentTurn?: number) {
  const intro = scenario.intro;
  const projectContext: ProjectContext = scenario.projectContext ?? {
    name: intro.briefTitle,
    purpose: scenario.description,
    phase: intro.phase,
    teamSize: intro.team,
    currentIssues: [intro.issue, ...(intro.request ? [intro.request] : []), intro.risk],
    playerRole: "プロジェクトマネージャー",
    playerMission: intro.description,
  };
  return {
    projectContext: currentIssue ? { ...projectContext, currentIssues: [currentIssue, ...projectContext.currentIssues].slice(0, 4) } : projectContext,
    stakeholders: scenario.stakeholders.map(stakeholder => normalizeStakeholder(stakeholder, currentTurn)),
    relationships: scenario.stakeholderRelationships?.length ? scenario.stakeholderRelationships : scenario.stakeholders.map(inferRelationship),
  };
}
