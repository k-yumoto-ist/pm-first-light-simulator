import type { GameState, ScoreKey } from "../types/game";

type Rule = { points: number; when: (state: GameState) => boolean };

export const scoringRules: Record<ScoreKey, Rule[]> = {
  stakeholder: [
    { points: 20, when: s => s.flags.decisionMakerKnown },
    { points: 20, when: s => s.asked.includes("takahashi_success") || s.asked.includes("takahashi_priority") },
    { points: 15, when: s => s.flags.releaseCriteriaKnown },
    { points: 15, when: s => s.flags.stakeholderAligned },
    { points: 10, when: s => s.flags.reportedStatus },
    { points: 10, when: s => s.logs.some(l => l.turn === 4 && l.tags.includes("stakeholder")) },
  ],
  scope: [
    { points: 20, when: s => s.flags.requestBackgroundKnown },
    { points: 25, when: s => s.flags.impactAnalysisDone },
    { points: 20, when: s => s.flags.priorityAdjusted },
    { points: 15, when: s => ["trim", "staged", "negotiate"].includes(s.releaseDecision || "") },
    { points: 10, when: s => s.asked.includes("sato_requirements") },
    { points: -20, when: s => s.flags.additionalRequestAccepted && !s.flags.impactAnalysisDone },
  ],
  risk: [
    { points: 25, when: s => s.flags.apiRiskKnown },
    { points: 30, when: s => s.flags.apiRiskMitigated },
    { points: 15, when: s => s.logs.some(l => l.label === "リスク対応を整理する") },
    { points: 10, when: s => s.turn >= 3 && s.flags.apiRiskKnown },
    { points: 10, when: s => s.releaseDecision === "staged" },
  ],
  schedule: [
    { points: 20, when: s => s.flags.juniorProgressChecked },
    { points: 20, when: s => s.flags.delayRecovered },
    { points: 15, when: s => s.logs.filter(l => l.label === "スケジュールを点検する").length >= 2 },
    { points: 20, when: s => s.flags.impactAnalysisDone },
    { points: 15, when: s => ["trim", "staged", "negotiate"].includes(s.releaseDecision || "") },
  ],
};

export function calculateScores(state: GameState): Record<ScoreKey, number> {
  const result = {} as Record<ScoreKey, number>;
  (Object.keys(scoringRules) as ScoreKey[]).forEach(key => {
    result[key] = Math.max(0, Math.min(100, 15 + scoringRules[key].reduce((sum, rule) => sum + (rule.when(state) ? rule.points : 0), 0)));
  });
  return result;
}
