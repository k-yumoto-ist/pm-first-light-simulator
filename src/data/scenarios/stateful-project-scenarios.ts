import type { StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { keypersonExitSimulation } from "./keyperson-exit-simulation";
import { scheduleCrisisSimulation } from "./schedule-crisis-simulation";
import { scopeChangeSimulation } from "./scope-change-simulation";
import { stakeholderConflictSimulation } from "./stakeholder-conflict-simulation";

export const statefulProjectScenarios: Record<string, StatefulScenarioDefinition> = {
  "scope-change": scopeChangeSimulation,
  "schedule-crisis": scheduleCrisisSimulation,
  "keyperson-exit": keypersonExitSimulation,
  "stakeholder-conflict": stakeholderConflictSimulation,
};

export function getStatefulProjectScenario(id: string) {
  return statefulProjectScenarios[id]
    ?? Object.values(statefulProjectScenarios).find((scenario) => scenario.id === id);
}
