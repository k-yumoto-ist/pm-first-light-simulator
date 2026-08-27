import type { ScenarioAction, ScenarioActionTurnOutcome, SimulationMetrics } from "./statefulScenarioTypes";

export function calculateInformationScore(
  acquiredIds: Iterable<string>,
  scoredInformation: Array<{ id: string; weight: number }>,
  fullCreditRatio?: number,
): number;

export function calculateOutcomeScore(
  metrics: Record<string, number> | SimulationMetrics,
  scoreMetrics: Array<{ key: string; weight: number }>,
): number;

export function resolveScenarioActionOutcome(
  action: ScenarioAction,
  turn: number,
  informationIds: Iterable<string>,
  flags: Record<string, boolean | number | string>,
): ScenarioActionTurnOutcome & {
  metricEffects: Partial<SimulationMetrics>;
  grantsInformation: string[];
  usedConditionalOutcome: boolean;
  missingInformation: string[];
};

export function getScenarioActionUsageKey(action: Pick<ScenarioAction, "id" | "repeatPolicy">, turn: number): string;
export function hasScenarioActionBeenUsed(action: Pick<ScenarioAction, "id" | "repeatPolicy">, turn: number, usedKeys: Iterable<string>): boolean;

export function isScenarioActionComplete(
  action: ScenarioAction,
  turn: number,
  informationIds: Iterable<string>,
  flags: Record<string, boolean | number | string>,
): boolean;
