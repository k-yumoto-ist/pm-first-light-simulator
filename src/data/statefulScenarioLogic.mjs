/**
 * 重要情報の取得率を、全件数ではなくシナリオごとの重みで評価する。
 * fullCreditRatio（既定80%）を超えたら、残りを調べない判断も満点として扱う。
 * @param {Iterable<string>} acquiredIds
 * @param {Array<{id:string, weight:number}>} scoredInformation
 * @param {number} [fullCreditRatio]
 */
export function calculateInformationScore(acquiredIds, scoredInformation, fullCreditRatio = 0.8) {
  const acquired = new Set(acquiredIds);
  const totalWeight = scoredInformation.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight === 0) return 0;
  const acquiredWeight = scoredInformation.reduce((sum, item) => sum + (acquired.has(item.id) ? Math.max(0, item.weight) : 0), 0);
  const threshold = Math.max(0.01, Math.min(1, fullCreditRatio));
  return Math.round(Math.min(1, acquiredWeight / totalWeight / threshold) * 100);
}

/** @param {Record<string, number>} metrics @param {Array<{key:string, weight:number}>} scoreMetrics */
export function calculateOutcomeScore(metrics, scoreMetrics) {
  const weighted = scoreMetrics.reduce((state, item) => {
    const raw = Number(metrics[item.key] ?? 0);
    const value = item.key === "riskExposure" ? 100 - raw : raw;
    const weight = Math.max(0, item.weight);
    return { total: state.total + value * weight, weight: state.weight + weight };
  }, { total: 0, weight: 0 });
  return weighted.weight ? Math.round(weighted.total / weighted.weight) : 0;
}

/**
 * 同じActionでも、現在ターン・保有情報・flagにより結果を変える。
 * 条件付き結果が成立しない場合はAction本体またはターン別のbase resultを返す。
 * @param {Record<string, any>} action
 * @param {number} turn
 * @param {Iterable<string>} informationIds
 * @param {Record<string, boolean|number|string>} flags
 */
export function resolveScenarioActionOutcome(action, turn, informationIds, flags) {
  const information = new Set(informationIds);
  const contextualOutcomes = (action.conditionalOutcomes ?? []).filter((outcome) =>
    (!outcome.turns || outcome.turns.includes(turn)) &&
    (outcome.requiresFlags ?? []).every((id) => Boolean(flags[id]))
  );
  const conditional = contextualOutcomes.find((outcome) =>
    (outcome.requiresInformation ?? []).every((id) => information.has(id))
  );
  const turnOutcome = action.outcomesByTurn?.[turn];
  const outcome = conditional ?? turnOutcome ?? action;
  const nearestOutcome = contextualOutcomes
    .map((outcome) => ({ outcome, missing: (outcome.requiresInformation ?? []).filter((id) => !information.has(id)) }))
    .sort((a, b) => a.missing.length - b.missing.length)[0];
  return {
    grantsInformation: outcome.grantsInformation ?? action.grantsInformation ?? [],
    setsFlags: { ...(action.setsFlags ?? {}), ...(turnOutcome?.setsFlags ?? {}), ...(conditional?.setsFlags ?? {}) },
    metricEffects: { ...(action.metricEffects ?? {}), ...(turnOutcome?.metricEffects ?? {}), ...(conditional?.metricEffects ?? {}) },
    result: outcome.result ?? action.result,
    whyThisResult: outcome.whyThisResult ?? action.whyThisResult,
    usedConditionalOutcome: Boolean(conditional),
    missingInformation: conditional ? [] : [...new Set(nearestOutcome?.missing ?? [])],
  };
}

/** @param {{id:string, repeatPolicy?:string}} action @param {number} turn */
export function getScenarioActionUsageKey(action, turn) {
  return action.repeatPolicy === "per-turn" ? `${turn}:${action.id}` : `once:${action.id}`;
}

/** @param {{id:string, repeatPolicy?:string}} action @param {number} turn @param {Iterable<string>} usedKeys */
export function hasScenarioActionBeenUsed(action, turn, usedKeys) {
  const keys = new Set(usedKeys);
  const currentKey = getScenarioActionUsageKey(action, turn);
  if (keys.has(currentKey)) return true;
  if (action.repeatPolicy === "per-turn") return false;
  return [...keys].some((key) => key.endsWith(`:${action.id}`));
}

/**
 * 前提を満たした条件付きActionが、その成果をすでに獲得済みか判定する。
 * per-turnでも同じ分析結果しか返せない状態では再実行させない。
 * @param {Record<string, any>} action
 * @param {number} turn
 * @param {Iterable<string>} informationIds
 * @param {Record<string, boolean|number|string>} flags
 */
export function isScenarioActionComplete(action, turn, informationIds, flags) {
  const information = new Set(informationIds);
  const conditional = (action.conditionalOutcomes ?? []).find((outcome) =>
    (!outcome.turns || outcome.turns.includes(turn)) &&
    (outcome.requiresFlags ?? []).every((id) => Boolean(flags[id])) &&
    (outcome.requiresInformation ?? []).every((id) => information.has(id))
  );
  if (!conditional) return false;
  const grantedInformation = conditional.grantsInformation ?? action.grantsInformation ?? [];
  const setFlags = conditional.setsFlags ?? {};
  const hasPersistentOutcome = grantedInformation.length > 0 || Object.keys(setFlags).length > 0;
  return hasPersistentOutcome &&
    grantedInformation.every((id) => information.has(id)) &&
    Object.entries(setFlags).every(([id, value]) => flags[id] === value);
}
