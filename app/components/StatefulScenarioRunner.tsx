"use client";

import { useEffect, useMemo, useState } from "react";
import { pmBehaviorStandards } from "@/src/data/pmBehaviorStandards";
import { pmbokDomains } from "@/src/data/pmbokDomains";
import type { BehaviorStandardEvidence, Difficulty } from "@/src/data/types";
import type { ScenarioAction, ScenarioActionCategoryId, ScenarioDecision, SimulationMetrics, StatefulScenarioDefinition } from "@/src/data/statefulScenarioTypes";
import { learningByArea, pmActions } from "../data/actions";
import type { PMActionDefinition } from "../data/actions";
import type { ActionLog, ActionResult, MetricChange, Metrics, ScoreKey } from "../types/game";
import { AccessibleDialog } from "./AccessibleDialog";
import { ActionConfirmDialog, type ActionConfirmation } from "./ActionConfirmDialog";
import { ActionDetailModal } from "./ActionDetailModal";
import { FlowSteps } from "./FlowSteps";
import { ProjectLog } from "./ProjectLog";
import { ResultStep } from "./ResultStep";
import ScenarioActionExplorer from "./ScenarioActionExplorer";
import { SimulatorCockpit } from "./SimulatorCockpit";

type PlayPhase = "briefing" | "cockpit" | "final";
type ChainItem = { turn: number; timing: string; kind: "information" | "decision" | "consequence"; title: string; effect: string };
type DecisionRecord = { turn: number; timing: string; title: string; whatHappened: string; why: string; pmPoint: string; before: SimulationMetrics; after: SimulationMetrics; evidence: BehaviorStandardEvidence[] };
type ResultDialogState = { result: ActionResult; advancesTurn: boolean };

const metricLabels: Record<keyof SimulationMetrics, string> = {
  schedule: "Schedule", budget: "Budget", quality: "Quality", trust: "Customer Trust", teamHealth: "Team Condition",
  businessValue: "Business Value", riskExposure: "Risk Exposure", scopeStability: "Scope Stability", stakeholderAlignment: "Stakeholder Alignment",
};
const categoryTags: Record<ScenarioActionCategoryId, ScoreKey[]> = {
  hearing: ["stakeholder"], schedule: ["schedule"], risk: ["risk"], scope: ["scope"], team: ["schedule"], report: ["stakeholder"],
};
const categoryLearning: Record<ScenarioActionCategoryId, string> = {
  hearing: learningByArea.stakeholder, schedule: learningByArea.schedule, risk: learningByArea.risk,
  scope: learningByArea.scope, team: learningByArea.schedule, report: learningByArea.stakeholder,
};
const directionMarks = { strongUp: "↑↑", up: "↑", neutral: "→", down: "↓" } as const;

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function applyMetrics(current: SimulationMetrics, effects: Partial<SimulationMetrics>) {
  const next = { ...current };
  (Object.keys(effects) as Array<keyof SimulationMetrics>).forEach(key => { next[key] = clamp(next[key] + (effects[key] ?? 0)); });
  return next;
}
function mergeFlags(current: Record<string, boolean | number | string>, changes?: Record<string, boolean | number | string>) { return changes ? { ...current, ...changes } : current; }
function hasFlags(flags: Record<string, boolean | number | string>, ids: string[] = []) { return ids.every(id => Boolean(flags[id])); }
function status(key: keyof SimulationMetrics, value: number) { const effective = key === "riskExposure" ? 100 - value : value; return effective >= 72 ? "Stable" : effective >= 52 ? "Caution" : effective >= 32 ? "Warning" : "Critical"; }
function isFavorable(key: keyof SimulationMetrics, delta: number) { return key === "riskExposure" ? delta < 0 : delta > 0; }
function toCockpitMetrics(metrics: SimulationMetrics): Metrics { return { schedule: metrics.schedule, quality: metrics.quality, trust: metrics.trust, team: metrics.teamHealth, scopeStability: metrics.scopeStability, riskExposure: metrics.riskExposure, stakeholderAlignment: metrics.stakeholderAlignment }; }
function toCockpitChanges(before: SimulationMetrics, after: SimulationMetrics): MetricChange[] {
  const previous = toCockpitMetrics(before); const current = toCockpitMetrics(after);
  return (Object.keys(previous) as Array<keyof Metrics>).filter(key => previous[key] !== current[key]).map(key => ({ key, before: previous[key], after: current[key] }));
}
function actionKey(action: ScenarioAction, turn: number) { return action.repeatPolicy === "per-turn" ? `${turn}:${action.id}` : `once:${action.id}`; }
function canonicalAction(action: ScenarioAction): PMActionDefinition {
  const base = pmActions.find(item => item.id === action.category) ?? pmActions[0];
  return { ...base, id: action.category, title: action.title, description: action.question ?? action.description, expected: ["意思決定に必要な情報を得る", "不確実性を小さくする"], useCases: action.guidedHint ? [action.guidedHint, ...base.useCases.slice(0, 2)] : base.useCases };
}
function confirmationFor(action: ScenarioAction): ActionConfirmation {
  const base = pmActions.find(item => item.id === action.category) ?? pmActions[0];
  return { title: `${action.title}を実行しますか？`, description: action.question ?? action.description, aims: ["判断材料を増やす", "確認先と質問内容を意識して情報を得る"], impacts: base.impactHints.map(item => ({ label: item.label, direction: directionMarks[item.direction] })) };
}

export default function StatefulScenarioRunner({ scenario, difficulty, onExit }: { scenario: StatefulScenarioDefinition; difficulty: Difficulty; onExit: () => void }) {
  const [phase, setPhase] = useState<PlayPhase>("briefing");
  const [turnIndex, setTurnIndex] = useState(0);
  const investigationBudget = difficulty === "guided" ? 3 : 2;
  const [investigationsLeft, setInvestigationsLeft] = useState(investigationBudget);
  const [metrics, setMetrics] = useState(scenario.initialMetrics);
  const [flags, setFlags] = useState(scenario.initialFlags);
  const [informationIds, setInformationIds] = useState<string[]>([]);
  const [usedActionKeys, setUsedActionKeys] = useState<string[]>([]);
  const [pickerCategory, setPickerCategory] = useState<ScenarioActionCategoryId>();
  const [selectedAction, setSelectedAction] = useState<ScenarioAction>();
  const [actionDetailOpen, setActionDetailOpen] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<ScenarioAction>();
  const [selectedDecision, setSelectedDecision] = useState<ScenarioDecision>();
  const [resultDialog, setResultDialog] = useState<ResultDialogState>();
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [projectLogs, setProjectLogs] = useState<ActionLog[]>([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [phase, turnIndex]);

  const turn = scenario.turns[turnIndex];
  const informationSet = useMemo(() => new Set(informationIds), [informationIds]);
  const turnActions = scenario.actions.filter(action => action.availableFromTurn <= turnIndex + 1);
  const relevantActionIds = useMemo(() => new Set(turn.newlyRelevantActionIds ?? turn.actionIds ?? []), [turn]);
  const visibleDecisions = turn.decisions.filter(decision => !decision.hidesWhenMissing || (decision.requiresInformation ?? []).every(id => informationSet.has(id)));
  const hiddenDecisionCount = turn.decisions.length - visibleDecisions.length;
  const activeEvents = turn.eventByFlags?.filter(event => hasFlags(flags, event.requiresAll)) ?? [];
  const activeDelayedEffects = turn.delayedEffects?.filter(event => hasFlags(flags, event.requiresAll)) ?? [];
  const selectedCategory = scenario.actionCategories?.find(category => category.id === pickerCategory);
  const selectedCanonicalAction = selectedAction ? canonicalAction(selectedAction) : undefined;
  const cockpitMetrics = toCockpitMetrics(metrics);

  const getActionAvailability = (action: ScenarioAction) => {
    if (investigationsLeft <= 0) return { disabled: true, label: "調査枠を使用済み" };
    if (action.repeatPolicy === "always") return { disabled: false };
    if (usedActionKeys.includes(actionKey(action, turnIndex + 1))) return { disabled: true, label: action.repeatPolicy === "per-turn" ? "このターンで確認済み" : "確認済み" };
    return { disabled: false };
  };

  const executeAction = () => {
    const action = confirmingAction;
    if (!action || getActionAvailability(action).disabled) return;
    const turnOutcome = action.outcomesByTurn?.[turnIndex + 1];
    const grantedInformation = turnOutcome?.grantsInformation ?? action.grantsInformation;
    const unlocked = grantedInformation.filter(id => !informationSet.has(id));
    const before = metrics; const after = applyMetrics(before, action.metricEffects ?? {});
    const result = turnOutcome?.result ?? action.result;
    const why = turnOutcome?.whyThisResult ?? action.whyThisResult ?? "確認先と質問内容に応じた情報が得られました。";
    const changes = toCockpitChanges(before, after);
    setInformationIds(current => [...new Set([...current, ...unlocked])]);
    setFlags(current => mergeFlags(mergeFlags(current, action.setsFlags), turnOutcome?.setsFlags));
    setMetrics(after); setInvestigationsLeft(value => value - 1);
    if (action.repeatPolicy !== "always") setUsedActionKeys(current => [...current, actionKey(action, turnIndex + 1)]);
    setChain(current => [...current, { turn: turnIndex + 1, timing: turn.timing, kind: "information", title: action.title, effect: unlocked.length ? unlocked.map(id => scenario.information.find(info => info.id === id)?.label).filter(Boolean).join("・") + "を把握" : result }]);
    setProjectLogs(current => [...current, { id: `action-${turnIndex + 1}-${current.length + 1}`, kind: "action", turn: turnIndex + 1, day: turnIndex + 1, event: turn.title, label: action.title, detail: action.question ?? action.description, result, why, learning: categoryLearning[action.category], changes, tags: categoryTags[action.category] }]);
    setConfirmingAction(undefined); setSelectedAction(undefined);
    setResultDialog({ result: { title: action.title, occurred: result, why, learning: categoryLearning[action.category], tags: categoryTags[action.category], changes, unlocked: unlocked.map(id => { const info = scenario.information.find(item => item.id === id); return info ? `${info.label}：${info.detail}` : id; }) }, advancesTurn: false });
  };

  const executeDecision = () => {
    if (!selectedDecision) return;
    let after = applyMetrics(metrics, selectedDecision.metricEffects);
    let nextFlags = mergeFlags(flags, selectedDecision.setsFlags);
    let whatHappened = selectedDecision.whatHappened;
    const appliedChains = [selectedDecision.chainEffect];
    for (const outcome of selectedDecision.conditionalOutcomes ?? []) {
      if (!hasFlags(nextFlags, outcome.requiresAll)) continue;
      after = applyMetrics(after, outcome.metricEffects); nextFlags = mergeFlags(nextFlags, outcome.setsFlags);
      whatHappened += ` ${outcome.resultSuffix}`; appliedChains.push(outcome.chainEffect);
    }
    const decision = selectedDecision; const changes = toCockpitChanges(metrics, after);
    const record: DecisionRecord = { turn: turnIndex + 1, timing: turn.timing, title: decision.title, whatHappened, why: decision.why, pmPoint: decision.pmPoint, before: metrics, after, evidence: decision.evidence };
    setMetrics(after); setFlags(nextFlags); setDecisions(current => [...current, record]);
    setChain(current => [...current, ...appliedChains.map(effect => ({ turn: turnIndex + 1, timing: turn.timing, kind: "decision" as const, title: decision.title, effect }))]);
    setProjectLogs(current => [...current, { id: `decision-${turnIndex + 1}`, kind: "action", turn: turnIndex + 1, day: turnIndex + 1, event: turn.title, label: decision.title, detail: decision.description, result: whatHappened, why: decision.why, learning: decision.pmPoint, changes, tags: ["scope", "stakeholder"] }]);
    setSelectedDecision(undefined);
    setResultDialog({ result: { title: decision.title, occurred: whatHappened, why: decision.why, learning: decision.pmPoint, tags: ["scope", "stakeholder"], changes, unlocked: [] }, advancesTurn: true });
  };

  const advanceTurn = () => {
    if (turnIndex >= scenario.turns.length - 1) { setResultDialog(undefined); setPhase("final"); return; }
    const nextIndex = turnIndex + 1; const nextTurn = scenario.turns[nextIndex]; let nextMetrics = metrics;
    const consequences: ChainItem[] = []; const consequenceLogs: ActionLog[] = [];
    for (const consequence of nextTurn.delayedEffects ?? []) {
      if (!hasFlags(flags, consequence.requiresAll)) continue;
      const before = nextMetrics; nextMetrics = applyMetrics(nextMetrics, consequence.metricEffects);
      consequences.push({ turn: nextIndex + 1, timing: nextTurn.timing, kind: "consequence", title: "過去の判断が影響", effect: consequence.chainEffect });
      consequenceLogs.push({ id: `consequence-${nextIndex + 1}-${consequenceLogs.length}`, kind: "event", turn: nextIndex + 1, day: nextIndex + 1, event: nextTurn.title, label: "過去の判断が影響", detail: consequence.text, result: consequence.chainEffect, why: "前のターンで行った判断が、時間をおいてプロジェクト状態へ反映されました。", learning: learningByArea.risk, changes: toCockpitChanges(before, nextMetrics), tags: ["risk"] });
    }
    setMetrics(nextMetrics); setChain(current => [...current, ...consequences]); setProjectLogs(current => [...current, ...consequenceLogs]);
    setTurnIndex(nextIndex); setInvestigationsLeft(investigationBudget); setResultDialog(undefined); setPhase("cockpit");
  };

  if (phase === "final") return <StatefulScenarioReport scenario={scenario} metrics={metrics} flags={flags} informationSet={informationSet} decisions={decisions} chain={chain} onExit={onExit} />;
  if (phase === "briefing") return <main className="stateful-shell"><header className="stateful-header"><div><strong>PROJECT: FIRST LIGHT</strong><span>{scenario.title}</span></div><button onClick={onExit}>終了</button></header><section className="stateful-briefing"><p className="v2-kicker">PROJECT SCENARIO</p><h1>{scenario.title}</h1><p>{scenario.description}</p><div><strong>このシナリオの進め方</strong><span>調査アクション：各ターン {investigationBudget}回</span><span>最終判断：各ターン 1回</span><span>過去の約束は後のターンへ残ります</span></div><button className="primary large" onClick={() => setPhase("cockpit")}>案件を引き受ける <span>→</span></button></section></main>;

  const informationPanel = <div className="cockpit-side-stack"><section className="cockpit-materials"><header><span>判断材料</span><strong>{difficulty === "guided" ? `${informationIds.length} / ${scenario.information.length}` : `${informationIds.length}件`}</strong></header><div>{difficulty === "guided" ? scenario.information.map(info => informationSet.has(info.id) ? <article key={info.id} className="is-known"><b>✓ {info.label}</b><p>{info.detail}</p></article> : <article key={info.id}><b>🔒 未確認</b><p>手がかり：{info.source}</p></article>) : scenario.information.filter(info => informationSet.has(info.id)).map(info => <article key={info.id} className="is-known"><b>✓ {info.label}</b>{difficulty === "standard" ? <p>{info.detail}</p> : null}</article>)}</div>{difficulty !== "guided" && informationIds.length === 0 ? <p className="stateful-info-empty">取得済みの判断材料はありません。</p> : null}</section><section className="cockpit-secondary-metrics"><span><b>Budget</b><strong>{status("budget", metrics.budget)}</strong></span><span><b>Business Value</b><strong>{status("businessValue", metrics.businessValue)}</strong></span><span><b>Scope</b><strong>{status("scopeStability", metrics.scopeStability)}</strong></span><span><b>Alignment</b><strong>{status("stakeholderAlignment", metrics.stakeholderAlignment)}</strong></span></section><button className="cockpit-log-button" onClick={() => setShowLog(true)}>PROJECT LOG <b>{projectLogs.length}</b><span>これまでの判断を見る →</span></button></div>;
  const contextBody = <><p>{turn.situation}</p>{activeDelayedEffects.map(event => <aside key={event.text}>↳ {event.text}</aside>)}{activeEvents.map(event => <aside key={event.text}>⚠ {event.text}</aside>)}{difficulty === "guided" ? <div className="cockpit-guided-hint"><strong>見るべきポイント</strong><p>{turn.thinkingPoint}</p></div> : difficulty === "standard" ? <details><summary>PMとして考えるポイント</summary><p>{turn.thinkingPoint}</p></details> : null}</>;
  const budget = <div className="cockpit-action-budgets"><div><strong>{investigationsLeft}</strong><span>INVESTIGATION<br />LEFT</span></div><div><strong>○</strong><span>DECISION<br />未実施</span></div></div>;
  const footerMessage = investigationsLeft > 0 ? `調査アクションはあと${investigationsLeft}回です。残したまま最終判断することもできます。${hiddenDecisionCount > 0 ? " 得た情報によって判断案が増える場合があります。" : ""}` : `調査枠を使い切りました。${hiddenDecisionCount > 0 ? "取得した情報に応じた判断案を確認してください。" : "最終判断へ進めます。"}`;
  return <main className="simulation-shell stateful-canonical-shell">
    <header className="simulation-header"><div className="brand compact"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span></div><div className="time-context"><span>TURN {turnIndex + 1} / {scenario.turns.length}</span><strong>{turn.timing}</strong><small>{scenario.title}</small></div><button className="log-jump" aria-expanded={showLog} onClick={() => setShowLog(true)}>PROJECT LOG <b>{projectLogs.length}</b></button></header>
    <FlowSteps current={resultDialog ? "result" : "decision"} />
    <SimulatorCockpit title={turn.title} contextMeta={<><span>TURN {turnIndex + 1} / {scenario.turns.length}</span><small>{turn.timing}</small></>} contextBody={contextBody} metrics={cockpitMetrics} changes={[]} kicker="PM ACTIONS" prompt="PMとして、次に何をしますか？" budget={budget} actions={pmActions} usedIds={[]} disabled={investigationsLeft <= 0} onSelectAction={action => setPickerCategory(action.id)} sideContent={informationPanel} footerMessage={footerMessage} advanceLabel="このターンの判断へ進む" canAdvance={visibleDecisions.length > 0} onAdvance={() => visibleDecisions[0] && setSelectedDecision(visibleDecisions[0])} />
    <div className={`log-section ${showLog ? "is-open" : ""}`} onClick={() => setShowLog(false)}><div className="log-dialog" onClick={event => event.stopPropagation()}><button className="log-close" aria-label="プロジェクトログを閉じる" onClick={() => setShowLog(false)}>閉じる ×</button><ProjectLog logs={projectLogs} compact /></div></div>
    {pickerCategory && selectedCategory ? <AccessibleDialog onClose={() => setPickerCategory(undefined)} labelledBy="scenario-action-picker-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog scenario-action-picker-dialog"><header><span className="detail-code">{pmActions.find(item => item.id === pickerCategory)?.code}</span><div><p>PM ACTION</p><h2 id="scenario-action-picker-title">{selectedCategory.label}</h2></div><button type="button" aria-label="具体的な行動選択を閉じる" onClick={() => setPickerCategory(undefined)}>×</button></header><ScenarioActionExplorer key={`${turn.id}-${pickerCategory}`} categories={scenario.actionCategories ?? []} actions={turnActions} stakeholders={scenario.stakeholders} difficulty={difficulty} relevantActionIds={relevantActionIds} getAvailability={getActionAvailability} onSelect={action => { setPickerCategory(undefined); setSelectedAction(action); setActionDetailOpen(true); }} initialCategoryId={pickerCategory} allowCategoryReset={false} /></AccessibleDialog> : null}
    {actionDetailOpen && selectedCanonicalAction && selectedAction ? <ActionDetailModal action={selectedCanonicalAction} actionsLeft={investigationsLeft} disabled={getActionAvailability(selectedAction).disabled} onClose={() => { setActionDetailOpen(false); setSelectedAction(undefined); }} onExecute={() => { setActionDetailOpen(false); setConfirmingAction(selectedAction); }} /> : null}
    {confirmingAction ? <ActionConfirmDialog confirmation={confirmationFor(confirmingAction)} actionsLeft={investigationsLeft} onCancel={() => setConfirmingAction(undefined)} onConfirm={executeAction} /> : null}
    {selectedDecision ? <AccessibleDialog onClose={() => setSelectedDecision(undefined)} labelledBy="stateful-decision-title" overlayClassName="scenario-overlay" dialogClassName="scenario-choice-dialog canonical-decision-dialog"><header><div><p>TURN DECISION</p><h2 id="stateful-decision-title">PMとして、どう判断しますか？</h2></div><button type="button" onClick={() => setSelectedDecision(undefined)}>閉じる</button></header><p>取得した判断材料と、守りたいものを踏まえて選択してください。</p><div className="decision-choice-list">{visibleDecisions.map(decision => <button key={decision.id} type="button" className={selectedDecision.id === decision.id ? "is-selected" : ""} onClick={() => setSelectedDecision(decision)}><strong>{decision.title}{decision.irreversible ? <em>正式な判断</em> : null}</strong><span>{difficulty === "challenge" ? "この判断を選択肢として検討します。" : decision.description}</span><b>{selectedDecision.id === decision.id ? "選択中" : "詳しく確認"}</b></button>)}</div><footer className="canonical-decision-footer"><div><span>選択中</span><strong>{selectedDecision.title}</strong></div><button className="primary" onClick={executeDecision}>この判断を確定する</button></footer></AccessibleDialog> : null}
    {resultDialog ? <ResultStep result={resultDialog.result} presentation="dialog" nextLabel={resultDialog.advancesTurn ? (turnIndex === scenario.turns.length - 1 ? "一連の判断を振り返る" : "次の状況へ") : "コックピットへ戻る"} onNext={resultDialog.advancesTurn ? advanceTurn : () => setResultDialog(undefined)} /> : null}
  </main>;
}

function StatefulScenarioReport({ scenario, metrics, flags, informationSet, decisions, chain, onExit }: { scenario: StatefulScenarioDefinition; metrics: SimulationMetrics; flags: Record<string, boolean | number | string>; informationSet: Set<string>; decisions: DecisionRecord[]; chain: ChainItem[]; onExit: () => void }) {
  const acquired = scenario.information.filter(info => informationSet.has(info.id)); const missed = scenario.information.filter(info => !informationSet.has(info.id));
  const sourceActionsByInformation = new Map(scenario.information.map(info => [info.id, scenario.actions.filter(action => action.grantsInformation.includes(info.id) || Object.values(action.outcomesByTurn ?? {}).some(outcome => outcome.grantsInformation?.includes(info.id))).map(action => action.title)]));
  const metricDeltas = (Object.keys(metrics) as Array<keyof SimulationMetrics>).map(key => ({ key, delta: metrics[key] - scenario.initialMetrics[key] }));
  const protectedItems = metricDeltas.filter(item => isFavorable(item.key, item.delta) && Math.abs(item.delta) >= 2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const sacrificedItems = metricDeltas.filter(item => !isFavorable(item.key, item.delta) && Math.abs(item.delta) >= 2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const evidenceWeights = new Map<string, number>(); decisions.flatMap(decision => decision.evidence).forEach(item => evidenceWeights.set(item.behavior, (evidenceWeights.get(item.behavior) ?? 0) + item.weight));
  const reactions = scenario.stakeholders.map(stakeholder => { const rules = scenario.reactionRules.filter(rule => rule.stakeholderId === stakeholder.id); const match = rules.find(rule => !rule.fallback && hasFlags(flags, rule.requiresAll) && (!rule.requiresAny || rule.requiresAny.some(id => Boolean(flags[id])))) ?? rules.find(rule => rule.fallback); return match ? { stakeholder, text: match.text } : null; }).filter(Boolean);
  return <main className="stateful-report-shell"><header className="v2-sim-header"><div><strong>PROJECT: FIRST LIGHT</strong><span>PROJECT SCENARIO REVIEW</span></div><button onClick={onExit}>MODE SELECT</button></header><article className="stateful-report">
    <p className="v2-kicker">PROJECT RESULT</p><h1>{scenario.title}</h1><p className="stateful-report-lead">あなたの判断が何を守り、何を次の課題として残したかを振り返ります。</p><div className="stateful-final-metrics">{(Object.keys(metrics) as Array<keyof SimulationMetrics>).map(key => <div key={key}><span>{metricLabels[key]}</span><strong>{status(key, metrics[key])}</strong><small>{scenario.initialMetrics[key]} → {metrics[key]}</small></div>)}</div>
    <section className="stateful-report-section"><p className="v2-kicker">DECISION CHAIN</p><h2>判断が後からどう効いたか</h2><div className="decision-chain">{chain.map((item, index) => <div key={`${item.turn}-${index}`} className={`chain-${item.kind}`}><b>{item.timing}</b><span>{item.title}</span><strong>{item.effect}</strong>{index < chain.length - 1 ? <i>↓</i> : null}</div>)}</div></section>
    <section className="stateful-report-section"><p className="v2-kicker">INFORMATION REVIEW</p><h2>何を知って、何を知らないまま決めたか</h2><div className="information-review"><div><h3>取得した重要情報</h3>{acquired.length ? <ul>{acquired.map(info => <li key={info.id}><strong>✓ {info.label}</strong><span>{info.detail}</span></li>)}</ul> : <p>重要情報を取得せずに判断しました。</p>}</div><div><h3>取得できなかった重要情報</h3>{missed.length ? <ul>{missed.map(info => <li key={info.id}><strong>— {info.label}</strong><span>{sourceActionsByInformation.get(info.id)?.join("／") || info.source}で確認できました。</span></li>)}</ul> : <p>このシナリオの重要情報をすべて確認しました。</p>}</div></div></section>
    <section className="stateful-report-section"><p className="v2-kicker">TRADE-OFF</p><h2>守ったもの / 犠牲になったもの</h2><div className="tradeoff-review"><div><h3>あなたが守ったもの</h3>{protectedItems.length ? protectedItems.map(item => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>明確に改善した指標はありませんでした。</p>}</div><div><h3>代わりに犠牲になったもの</h3>{sacrificedItems.length ? sacrificedItems.map(item => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>大きく悪化した指標はありませんでした。</p>}</div></div></section>
    <section className="stateful-report-section"><p className="v2-kicker">STAKEHOLDER VOICES</p><h2>関係者はどう受け止めたか</h2><div className="stakeholder-voices">{reactions.map(reaction => reaction ? <article key={reaction.stakeholder.id}><span>{reaction.stakeholder.avatar}</span><div><strong>{reaction.stakeholder.name}<small>{reaction.stakeholder.role}</small></strong><p>「{reaction.text}」</p></div></article> : null)}</div></section>
    <section className="stateful-report-section"><p className="v2-kicker">PMBOK REVIEW</p><h2>今回判断した領域</h2><div className="stateful-domain-review">{[scenario.primaryDomain, ...scenario.relatedDomains].map(domain => <div key={domain}><strong>{pmbokDomains[domain].label}</strong><p>{pmbokDomains[domain].description}</p></div>)}</div></section>
    <section className="stateful-report-section"><p className="v2-kicker">YOUR PM STYLE</p><h2>今回見られたPM行動</h2><div className="stateful-behavior-review">{evidenceWeights.size ? [...evidenceWeights.entries()].sort((a, b) => b[1] - a[1]).map(([tag, weight]) => <div key={tag}><strong>{pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].label}</strong><p>{weight > 2 ? "複数の場面でこの行動が見られました。" : pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].actions[0]}</p></div>) : <p>今回は情報取得より即時判断を優先する傾向が見られました。別の選択で結果の違いを確かめてみましょう。</p>}</div></section>
    <div className="v2-report-actions"><button className="v2-secondary" onClick={onExit}>別のシナリオを選ぶ</button><button className="primary" onClick={() => window.location.reload()}>最初からプレイ</button></div>
  </article></main>;
}
