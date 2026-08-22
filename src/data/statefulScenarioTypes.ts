import type { BehaviorStandardEvidence, Difficulty, ProjectState, PmbokDomain } from "./types";

export type ScenarioMode = "training" | "project";

export interface SimulationMetrics extends ProjectState {
  scopeStability: number;
  stakeholderAlignment: number;
}

export interface ScenarioStakeholder {
  id: string;
  name: string;
  role: string;
  priority: string;
  avatar: string;
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
  result: string;
  whyThisResult: string;
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
  visibleInformation: string[];
  /** @deprecated 表示候補の制限ではなく、現在とくに関連する行動の印としてのみ使用します。 */
  actionIds?: string[];
  newlyRelevantActionIds?: string[];
  decisions: ScenarioDecision[];
  eventByFlags?: Array<{ requiresAll: string[]; text: string }>;
  delayedEffects?: Array<{ requiresAll: string[]; metricEffects: Partial<SimulationMetrics>; text: string; chainEffect: string }>;
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
  primaryDomain: PmbokDomain;
  relatedDomains: PmbokDomain[];
  initialMetrics: SimulationMetrics;
  initialFlags: Record<string, boolean | number | string>;
  stakeholders: ScenarioStakeholder[];
  information: ScenarioInformation[];
  actions: ScenarioAction[];
  actionCategories?: ScenarioActionCategory[];
  turns: StatefulScenarioTurn[];
  reactionRules: StakeholderReactionRule[];
}
