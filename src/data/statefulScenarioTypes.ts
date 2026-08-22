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

export interface ScenarioAction {
  id: string;
  title: string;
  description: string;
  category: "hearing" | "schedule" | "risk" | "scope" | "team" | "report";
  stakeholderId?: string;
  availableFromTurn: number;
  grantsInformation: string[];
  setsFlags?: Record<string, boolean | number | string>;
  metricEffects?: Partial<SimulationMetrics>;
  result: string;
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
  actionIds: string[];
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
  turns: StatefulScenarioTurn[];
  reactionRules: StakeholderReactionRule[];
}
