import { keypersonExitScenario } from "./keyperson-exit";
import { scheduleCrisisScenario } from "./schedule-crisis";
import { scopeChangeScenario } from "./scope-change";
import { stakeholderConflictScenario } from "./stakeholder-conflict";
import type { ScenarioDefinition } from "../types";

export const scenarios: ScenarioDefinition[] = [
  scopeChangeScenario,
  scheduleCrisisScenario,
  keypersonExitScenario,
  stakeholderConflictScenario,
];

export const scenarioById: Record<string, ScenarioDefinition> = Object.fromEntries(
  scenarios.map((scenario) => [scenario.id, scenario]),
);
