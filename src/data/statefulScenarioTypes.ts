import type { BehaviorStandardEvidence, Difficulty, ProjectState, PmbokDomain } from "./types";

export type ScenarioMode = "training" | "project";

export interface SimulationMetrics extends ProjectState {
  scopeStability: number;
  stakeholderAlignment: number;
}

export type StakeholderGroup = "customer" | "management" | "business" | "operations" | "development" | "quality" | "other";
export type StakeholderAttentionLevel = "normal" | "notice" | "warning";
export type StakeholderFactStatus = "known" | "unknown" | "discovered";
export type StakeholderRelationshipType = "report" | "consult" | "request" | "coordinate" | "decision" | "escalation" | "other";

export interface StakeholderFact {
  text: string;
  status: StakeholderFactStatus;
}

export interface ProjectContext {
  name: string;
  purpose: string;
  phase: string;
  releaseTiming?: string;
  teamSize?: string;
  currentIssues: string[];
  playerRole: string;
  playerMission?: string;
}

export interface StakeholderRelationship {
  from: string;
  to: string;
  type: StakeholderRelationshipType;
  label?: string;
}

export interface ScenarioStakeholder {
  id: string;
  name: string;
  role: string;
  priority: string;
  avatar: string;
  group?: StakeholderGroup;
  summary?: string;
  traits?: string[];
  currentStatus?: string[];
  currentStatusByTurn?: Record<number, string[]>;
  relationshipToPlayer?: string[];
  attentionLevel?: StakeholderAttentionLevel;
  facts?: StakeholderFact[];
  factsByTurn?: Record<number, StakeholderFact[]>;
}

export interface ScenarioInformation {
  id: string;
  label: string;
  detail: string;
  source: string;
}

export type ScenarioActionCategoryId = "hearing" | "schedule" | "risk" | "scope" | "team" | "report";
export type ScenarioActionRepeatPolicy = "once" | "per-turn" | "always";

export interface ScenarioActionCategory {
  id: ScenarioActionCategoryId;
  label: string;
  description: string;
  icon: string;
}

export interface ScenarioActionTurnOutcome {
  grantsInformation?: string[];
  setsFlags?: Record<string, boolean | number | string>;
  metricEffects?: Partial<SimulationMetrics>;
  result: string;
  whyThisResult: string;
}

export interface ScenarioActionConditionalOutcome extends ScenarioActionTurnOutcome {
  requiresInformation?: string[];
  requiresFlags?: string[];
  turns?: number[];
}

export interface ScenarioAction {
  id: string;
  title: string;
  description: string;
  category: ScenarioActionCategoryId;
  stakeholderId?: string;
  question?: string;
  guidedHint?: string;
  availableFromTurn: number;
  grantsInformation: string[];
  repeatPolicy?: ScenarioActionRepeatPolicy;
  outcomesByTurn?: Record<number, ScenarioActionTurnOutcome>;
  conditionalOutcomes?: ScenarioActionConditionalOutcome[];
  setsFlags?: Record<string, boolean | number | string>;
  metricEffects?: Partial<SimulationMetrics>;
  result: string;
  whyThisResult?: string;
}

export interface ConditionalOutcome {
  requiresAll: string[];
  metricEffects: Partial<SimulationMetrics>;
  setsFlags?: Record<string, boolean | number | string>;
  resultSuffix: string;
  chainEffect: string;
}

export interface ScenarioDecision {
  id: string;
  title: string;
  description: string;
  requiresInformation?: string[];
  hidesWhenMissing?: boolean;
  irreversible?: boolean;
  metricEffects: Partial<SimulationMetrics>;
  setsFlags?: Record<string, boolean | number | string>;
  evidence: BehaviorStandardEvidence[];
  whatHappened: string;
  why: string;
  pmPoint: string;
  chainEffect: string;
  conditionalOutcomes?: ConditionalOutcome[];
}

export interface StatefulScenarioTurn {
  id: string;
  timing: string;
  title: string;
  situation: string;
  thinkingPoint: string;
  decisionLabel?: string;
  visibleInformation: string[];
  /** @deprecated 表示候補の制限ではなく、現在とくに関連する行動の印としてのみ使用します。 */
  actionIds?: string[];
  newlyRelevantActionIds?: string[];
  decisions: ScenarioDecision[];
  eventByFlags?: Array<{ requiresAll: string[]; text: string }>;
  delayedEffects?: Array<{ requiresAll: string[]; metricEffects: Partial<SimulationMetrics>; text: string; chainEffect: string }>;
}

export interface StatefulScenarioIntro {
  emphasizedHeadline: string;
  description: string;
  briefTitle: string;
  phase: string;
  team: string;
  issueLabel: string;
  issue: string;
  requestLabel?: string;
  request?: string;
  risk: string;
}

export interface ScenarioOutcomeRule {
  requiresAll?: string[];
  requiresAny?: string[];
  status: string;
  tone: "positive" | "neutral" | "warning" | "negative";
}

export interface ScenarioOutcomeSummaryDefinition {
  label: string;
  metric?: keyof SimulationMetrics;
  rules?: ScenarioOutcomeRule[];
  fallbackStatus?: string;
  fallbackTone?: "positive" | "neutral" | "warning" | "negative";
}

export interface StatefulScenarioResultConfig {
  outcomeSummary: ScenarioOutcomeSummaryDefinition[];
  scoredInformation?: Array<{ id: string; weight: number; reviewHint?: string }>;
  informationFullCreditRatio?: number;
  scoreMetrics?: Array<{ key: keyof SimulationMetrics; weight: number }>;
  /** @deprecated scoreMetricsを使用してください。 */
  scoreMetricKeys?: Array<keyof SimulationMetrics>;
  finalMetricKeys?: Array<keyof SimulationMetrics>;
  scoreWeights?: {
    outcome: number;
    decision: number;
    information: number;
  };
  showPmStyle?: boolean;
  learningActions?: string[];
}

export interface StakeholderReactionRule {
  stakeholderId: string;
  requiresAll?: string[];
  requiresAny?: string[];
  text: string;
  fallback?: boolean;
}

export interface StatefulScenarioDefinition {
  id: string;
  title: string;
  description: string;
  mode: ScenarioMode;
  supportedDifficulties: Difficulty[];
  investigationBudget?: Partial<Record<Difficulty, number>>;
  primaryDomain: PmbokDomain;
  relatedDomains: PmbokDomain[];
  initialMetrics: SimulationMetrics;
  initialFlags: Record<string, boolean | number | string>;
  intro: StatefulScenarioIntro;
  projectContext?: ProjectContext;
  stakeholders: ScenarioStakeholder[];
  stakeholderRelationships?: StakeholderRelationship[];
  information: ScenarioInformation[];
  actions: ScenarioAction[];
  actionCategories?: ScenarioActionCategory[];
  turns: StatefulScenarioTurn[];
  reactionRules: StakeholderReactionRule[];
  resultConfig: StatefulScenarioResultConfig;
}
