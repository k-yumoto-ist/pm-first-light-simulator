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
import { FinalResultFramework, FinalResultSection, type PMStyle } from "./FinalResultFramework";
import { FlowSteps } from "./FlowSteps";
import { ProjectLog } from "./ProjectLog";
import { ResultStep } from "./ResultStep";
import ScenarioActionExplorer from "./ScenarioActionExplorer";
import { SimulatorCockpit } from "./SimulatorCockpit";
import { SimulatorIntro } from "./SimulatorIntro";
import { SituationStep } from "./SituationStep";
import { StakeholderChatDrawer, StakeholderContactPicker, type ChatStakeholder, type StakeholderChatMessage } from "./StakeholderChatDrawer";

type PlayPhase = "briefing" | "situation" | "cockpit" | "result" | "final";
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
  const [actionUsageCounts, setActionUsageCounts] = useState<Partial<Record<ScenarioActionCategoryId, number>>>({});
  const [pickerCategory, setPickerCategory] = useState<ScenarioActionCategoryId>();
  const [selectedCategoryAction, setSelectedCategoryAction] = useState<PMActionDefinition>();
  const [actionDetailOpen, setActionDetailOpen] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<ScenarioAction>();
  const [showContacts, setShowContacts] = useState(false);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>();
  const [chatHistories, setChatHistories] = useState<Record<string, StakeholderChatMessage[]>>({});
  const [selectedDecision, setSelectedDecision] = useState<ScenarioDecision>();
  const [resultDialog, setResultDialog] = useState<ResultDialogState>();
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [projectLogs, setProjectLogs] = useState<ActionLog[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [showInformation, setShowInformation] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

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
  const cockpitMetrics = toCockpitMetrics(metrics);
  const chatStakeholders: ChatStakeholder[] = scenario.stakeholders.map(stakeholder => ({ id: stakeholder.id, name: stakeholder.name, role: stakeholder.role, initials: stakeholder.avatar, status: stakeholder.priority }));
  const selectedStakeholder = chatStakeholders.find(stakeholder => stakeholder.id === selectedStakeholderId);
  const stakeholderQuestions = turnActions.filter(action => action.category === "hearing" && action.stakeholderId === selectedStakeholderId);

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
    setActionUsageCounts(current => ({ ...current, [action.category]: (current[action.category] ?? 0) + 1 }));
    if (action.category === "hearing" && action.stakeholderId) {
      const question = action.question ?? action.description;
      setChatHistories(current => ({ ...current, [action.stakeholderId!]: [...(current[action.stakeholderId!] ?? []), { id: `question-${turnIndex + 1}-${action.id}-${current[action.stakeholderId!]?.length ?? 0}`, speaker: "player", text: question }, { id: `reply-${turnIndex + 1}-${action.id}-${(current[action.stakeholderId!]?.length ?? 0) + 1}`, speaker: "stakeholder", text: result }] }));
    }
    setChain(current => [...current, { turn: turnIndex + 1, timing: turn.timing, kind: "information", title: action.title, effect: unlocked.length ? unlocked.map(id => scenario.information.find(info => info.id === id)?.label).filter(Boolean).join("・") + "を把握" : result }]);
    setProjectLogs(current => [...current, { id: `action-${turnIndex + 1}-${current.length + 1}`, kind: "action", turn: turnIndex + 1, day: turnIndex + 1, event: turn.title, label: action.title, detail: action.question ?? action.description, result, why, learning: categoryLearning[action.category], changes, tags: categoryTags[action.category] }]);
    setConfirmingAction(undefined); setSelectedStakeholderId(undefined); setShowContacts(false);
    setResultDialog({ result: { title: action.title, occurred: result, why, learning: categoryLearning[action.category], tags: categoryTags[action.category], changes, unlocked: unlocked.map(id => { const info = scenario.information.find(item => item.id === id); return info ? `${info.label}：${info.detail}` : id; }) }, advancesTurn: false });
    setPhase("result");
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
    setPhase("result");
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
    setTurnIndex(nextIndex); setInvestigationsLeft(investigationBudget); setActionUsageCounts({}); setResultDialog(undefined); setPhase("situation");
  };

  if (phase === "final") return <StatefulScenarioReport scenario={scenario} metrics={metrics} flags={flags} informationSet={informationSet} decisions={decisions} chain={chain} onExit={onExit} />;
  if (phase === "briefing") return <SimulatorIntro assignmentLabel="YOUR ASSIGNMENT" modeLabel="PROJECT SCENARIO" headline="あなたは、" emphasizedHeadline="リリース直前のPMです。" description="追加要件の背景と影響は、まだ十分に分かっていません。状況を読み、関係者から情報を集め、限られたActionで判断してください。" rules={[{ number: "1", title: "状況を確認", detail: "いま起きている変化を読む" }, { number: "2", title: "PMとして判断", detail: `${investigationBudget} Actionで情報を集める` }, { number: "3", title: "結果から学ぶ", detail: "過去の判断が後から影響する" }]} note="すべてを確認することはできません。何を知り、何を知らないまま判断するかもPMの選択です。" briefTitle="顧客ポータル改善" briefDescription={scenario.description} briefItems={[{ label: "CURRENT PHASE", value: "リリース直前" }, { label: "TEAM", value: "PM / Engineer / QA / Customer" }, { label: "KNOWN ISSUE", value: "追加要件" }, { label: "FROM CUSTOMER", value: "検索条件を追加してほしい", className: "quote" }, { label: "KNOWN RISK", value: "影響範囲がまだ分かっていない", className: "risk", note: "情報は意図的に不完全です" }]} actionLabel="PMとして案件を始める" onStart={() => setPhase("situation")} exitLabel="MODE SELECTへ戻る" onExit={onExit} />;

  const budget = <div className="single-action-budget"><strong>{investigationsLeft}</strong><span>ACTIONS<br />LEFT</span></div>;
  const footerMessage = investigationsLeft > 0 ? `調査アクションはあと${investigationsLeft}回です。残したまま最終判断することもできます。${hiddenDecisionCount > 0 ? " 得た情報によって判断案が増える場合があります。" : ""}` : `調査枠を使い切りました。${hiddenDecisionCount > 0 ? "取得した情報に応じた判断案を確認してください。" : "最終判断へ進めます。"}`;
  const situationNotice = [turn.situation, ...activeDelayedEffects.map(event => event.text), ...activeEvents.map(event => event.text)].join(" ");
  const acquiredInformation = scenario.information.filter(info => informationSet.has(info.id));
  const unknownInformation = scenario.information.filter(info => !informationSet.has(info.id));
  const situationKnown = [...turn.visibleInformation.map((label, index) => ({ id: `visible-${index}`, label })), ...acquiredInformation.map(info => ({ id: info.id, label: info.label, value: info.detail }))];
  const situationUnknown = difficulty === "guided" ? unknownInformation.map(info => ({ id: info.id, label: info.label })) : unknownInformation.length ? [{ id: "unconfirmed", label: "判断前に確認したい事項が残っています" }] : [];
  const openDecision = () => { if (visibleDecisions[0]) setSelectedDecision(visibleDecisions[0]); };
  const requiredDecision = <button type="button" className="scenario-decision-trigger step-scenario-decision" onClick={openDecision} disabled={!visibleDecisions.length}><span>今回の必須判断</span><strong>{turn.title}への対応方針</strong><small>未決定 — 判断する</small></button>;
  const simulationHeader = <header className="simulation-header"><div className="brand compact"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span><small className="mode-badge">PROJECT SCENARIO</small></div><div className="time-context"><span>TURN {turnIndex + 1} / {scenario.turns.length}</span><strong>{turn.timing}</strong><small>{scenario.title}</small></div><div className="header-utilities"><button type="button" className="utility-button" onClick={() => setShowInformation(true)}>判断材料 <b>{informationIds.length}</b></button><button type="button" className="utility-button" onClick={() => setShowProjectDetails(true)}>プロジェクト詳細</button><button className="log-jump" aria-expanded={showLog} onClick={() => setShowLog(true)}>PROJECT LOG <b>{projectLogs.length}</b></button></div></header>;

  return <main className="simulation-shell stateful-canonical-shell">
    {simulationHeader}
    <FlowSteps current={phase === "situation" ? "situation" : phase === "result" ? "result" : "decision"} />
    {phase === "situation" ? <SituationStep turnNumber={turnIndex + 1} turnTotal={scenario.turns.length} theme={turn.timing} title={turn.title} notice={situationNotice} consider={difficulty === "challenge" ? "状況から、次に減らすべき不確実性を考えてください。" : turn.thinkingPoint} knownItems={situationKnown} unknownItems={situationUnknown} onDecide={() => setPhase("cockpit")} /> : null}
    {phase === "cockpit" ? <SimulatorCockpit title={turn.title} contextMeta={<><span>TURN {turnIndex + 1} / {scenario.turns.length}</span><small>{turn.timing}</small></>} onViewSituation={() => setPhase("situation")} metrics={cockpitMetrics} changes={[]} kicker="PM ACTIONS" prompt="PMとして、次に何をしますか？" budget={budget} scenarioDecision={requiredDecision} actions={pmActions} usedIds={Object.keys(actionUsageCounts) as ScenarioActionCategoryId[]} usageCounts={actionUsageCounts} disabled={investigationsLeft <= 0} onSelectAction={action => { setSelectedCategoryAction(action); setActionDetailOpen(true); }} footerMessage={footerMessage} advanceLabel="このターンの判断をする" canAdvance={visibleDecisions.length > 0} onAdvance={openDecision} /> : null}
    {phase === "result" && resultDialog ? <ResultStep result={resultDialog.result} nextLabel={resultDialog.advancesTurn ? (turnIndex === scenario.turns.length - 1 ? "一連の判断を振り返る" : "次の状況へ") : "次の判断へ"} onNext={resultDialog.advancesTurn ? advanceTurn : () => { setResultDialog(undefined); setPhase("cockpit"); }} /> : null}
    <div className={`log-section ${showLog ? "is-open" : ""}`} onClick={() => setShowLog(false)}><div className="log-dialog" onClick={event => event.stopPropagation()}><button className="log-close" aria-label="プロジェクトログを閉じる" onClick={() => setShowLog(false)}>閉じる ×</button><ProjectLog logs={projectLogs} compact /></div></div>
    {pickerCategory && selectedCategory && pickerCategory !== "hearing" ? <AccessibleDialog onClose={() => setPickerCategory(undefined)} labelledBy="scenario-action-picker-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog scenario-action-picker-dialog"><header><span className="detail-code">{pmActions.find(item => item.id === pickerCategory)?.code}</span><div><p>PM ACTION</p><h2 id="scenario-action-picker-title">{selectedCategory.label}</h2></div><button type="button" aria-label="具体的な行動選択を閉じる" onClick={() => setPickerCategory(undefined)}>×</button></header><ScenarioActionExplorer key={`${turn.id}-${pickerCategory}`} categories={scenario.actionCategories ?? []} actions={turnActions.filter(action => action.category !== "hearing")} stakeholders={scenario.stakeholders} difficulty={difficulty} relevantActionIds={relevantActionIds} getAvailability={getActionAvailability} onSelect={action => { setPickerCategory(undefined); setConfirmingAction(action); }} initialCategoryId={pickerCategory} allowCategoryReset={false} /></AccessibleDialog> : null}
    {actionDetailOpen && selectedCategoryAction ? <ActionDetailModal action={selectedCategoryAction} actionsLeft={investigationsLeft} disabled={investigationsLeft <= 0} onClose={() => { setActionDetailOpen(false); setSelectedCategoryAction(undefined); }} onExecute={() => { const category = selectedCategoryAction.id; setActionDetailOpen(false); setSelectedCategoryAction(undefined); if (category === "hearing") setShowContacts(true); else setPickerCategory(category); }} /> : null}
    {showContacts ? <StakeholderContactPicker stakeholders={chatStakeholders} onSelect={id => { setShowContacts(false); setSelectedStakeholderId(id); }} onClose={() => setShowContacts(false)} /> : null}
    {selectedStakeholder ? <StakeholderChatDrawer stakeholder={selectedStakeholder} messages={chatHistories[selectedStakeholder.id] ?? []} questions={stakeholderQuestions.map(action => { const availability = getActionAvailability(action); return { id: action.id, label: action.question ?? action.title, disabled: availability.disabled, statusLabel: availability.disabled ? availability.label : "実行前に確認" }; })} actionsLeft={investigationsLeft} disabled={investigationsLeft <= 0} onSelectQuestion={id => { const action = stakeholderQuestions.find(item => item.id === id); if (action) setConfirmingAction(action); }} onClose={() => setSelectedStakeholderId(undefined)} /> : null}
    {confirmingAction ? <ActionConfirmDialog confirmation={confirmationFor(confirmingAction)} actionsLeft={investigationsLeft} onCancel={() => setConfirmingAction(undefined)} onConfirm={executeAction} /> : null}
    {selectedDecision ? <AccessibleDialog onClose={() => setSelectedDecision(undefined)} labelledBy="stateful-decision-title" overlayClassName="scenario-overlay" dialogClassName="scenario-choice-dialog canonical-decision-dialog"><header><div><p>TURN DECISION</p><h2 id="stateful-decision-title">PMとして、どう判断しますか？</h2></div><button type="button" onClick={() => setSelectedDecision(undefined)}>閉じる</button></header><p>取得した判断材料と、守りたいものを踏まえて選択してください。</p><div className="decision-choice-list">{visibleDecisions.map(decision => <button key={decision.id} type="button" className={selectedDecision.id === decision.id ? "is-selected" : ""} onClick={() => setSelectedDecision(decision)}><strong>{decision.title}{decision.irreversible ? <em>正式な判断</em> : null}</strong><span>{difficulty === "challenge" ? "この判断を選択肢として検討します。" : decision.description}</span><b>{selectedDecision.id === decision.id ? "選択中" : "詳しく確認"}</b></button>)}</div><footer className="canonical-decision-footer"><div><span>選択中</span><strong>{selectedDecision.title}</strong></div><button className="primary" onClick={executeDecision}>この判断を確定する</button></footer></AccessibleDialog> : null}
    {showInformation ? <AccessibleDialog onClose={() => setShowInformation(false)} labelledBy="information-dialog-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog project-detail-dialog"><header><div><p>DECISION MATERIALS</p><h2 id="information-dialog-title">取得した判断材料</h2></div><button type="button" aria-label="判断材料を閉じる" onClick={() => setShowInformation(false)}>×</button></header><div className="project-information-dialog">{difficulty === "guided" ? scenario.information.map(info => informationSet.has(info.id) ? <article key={info.id} className="is-known"><strong>✓ {info.label}</strong><p>{info.detail}</p></article> : <article key={info.id}><strong>🔒 未確認</strong><p>手がかり：{info.source}</p></article>) : scenario.information.filter(info => informationSet.has(info.id)).map(info => <article key={info.id} className="is-known"><strong>✓ {info.label}</strong>{difficulty === "standard" ? <p>{info.detail}</p> : null}</article>)}</div>{difficulty !== "guided" && informationIds.length === 0 ? <p className="project-dialog-empty">まだ判断材料を取得していません。</p> : null}</AccessibleDialog> : null}
    {showProjectDetails ? <AccessibleDialog onClose={() => setShowProjectDetails(false)} labelledBy="project-details-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog project-detail-dialog"><header><div><p>PROJECT DETAIL</p><h2 id="project-details-title">その他のプロジェクト状態</h2></div><button type="button" aria-label="プロジェクト詳細を閉じる" onClick={() => setShowProjectDetails(false)}>×</button></header><div className="project-extra-metrics">{(["budget", "businessValue", "scopeStability", "stakeholderAlignment"] as Array<keyof SimulationMetrics>).map(key => <article key={key}><span>{metricLabels[key]}</span><strong>{status(key, metrics[key])}</strong><small>{metrics[key]}</small><i style={{ width: `${metrics[key]}%` }} /></article>)}</div></AccessibleDialog> : null}
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
  const outcomeValues = (Object.keys(metrics) as Array<keyof SimulationMetrics>).map(key => key === "riskExposure" ? 100 - metrics[key] : metrics[key]);
  const outcomeScore = Math.round(outcomeValues.reduce((sum, value) => sum + value, 0) / outcomeValues.length);
  const evidenceTotal = [...evidenceWeights.values()].reduce((sum, value) => sum + value, 0);
  const decisionScore = Math.min(100, Math.round(evidenceTotal / Math.max(1, decisions.length * 4) * 100));
  const informationScore = Math.round(acquired.length / Math.max(1, scenario.information.length) * 100);
  const totalScore = Math.round(outcomeScore * .5 + decisionScore * .3 + informationScore * .2);
  const evidenceTags = new Set(evidenceWeights.keys());
  const style: PMStyle = evidenceTags.has("team_health_monitoring") || metrics.teamHealth >= 80
    ? { code: "TEAM PROTECTOR", description: "納期や要望だけでなく、チームが継続して動ける状態を守る判断が多く見られました。" }
    : evidenceTags.has("consensus_building") || evidenceTags.has("expectation_management") || evidenceTags.has("decision_rights_clarification")
      ? { code: "CONSENSUS BUILDER", description: "複数の関係者の期待と決定構造を整理し、合意できる着地点を探る判断が多く見られました。" }
      : evidenceTags.has("risk_identification") || evidenceTags.has("risk_response_planning")
        ? { code: "RISK CONTROLLER", description: "不確実性を見つけ、問題になる前に対応の選択肢を持つ判断が多く見られました。" }
        : evidenceTags.has("critical_path_analysis") || metrics.schedule >= 80
          ? { code: "DELIVERY FIRST", description: "期限と実現可能性を明確にし、プロジェクトを着地させる判断が多く見られました。" }
          : { code: "VALUE BALANCER", description: "顧客価値・品質・納期のバランスを見ながら、実現する範囲を整える判断が多く見られました。" };
  const finalMetrics = (["schedule", "quality", "trust", "teamHealth", "riskExposure"] as Array<keyof SimulationMetrics>).map(key => ({ label: metricLabels[key], value: key === "riskExposure" ? 100 - metrics[key] : metrics[key], status: status(key, metrics[key]) }));
  return <FinalResultFramework mode="project" title={scenario.title} score={totalScore} style={style} summary="正解率ではなく、最終状態・判断プロセス・情報収集を合わせたプロジェクト運営全体の指標です。" metrics={finalMetrics} breakdown={[{ label: "Project Outcome", score: outcomeScore, weight: "50%" }, { label: "Decision Process", score: decisionScore, weight: "30%" }, { label: "Information Gathering", score: informationScore, weight: "20%" }]} actions={<><button className="v2-secondary" onClick={onExit}>別のシナリオを選ぶ</button><button className="primary" onClick={() => window.location.reload()}>最初からプレイ</button></>}>
    <FinalResultSection eyebrow="PROJECT OUTCOME" title="守ったもの / 犠牲になったもの"><div className="tradeoff-review"><div><h3>あなたが守ったもの</h3>{protectedItems.length ? protectedItems.map(item => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>明確に改善した指標はありませんでした。</p>}</div><div><h3>代わりに犠牲になったもの</h3>{sacrificedItems.length ? sacrificedItems.map(item => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>大きく悪化した指標はありませんでした。</p>}</div></div></FinalResultSection>
    <FinalResultSection eyebrow="DECISION CHAIN" title="判断が後からどう効いたか"><div className="decision-chain">{chain.map((item, index) => <div key={`${item.turn}-${index}`} className={`chain-${item.kind}`}><b>{item.timing}</b><span>{item.title}</span><strong>{item.effect}</strong>{index < chain.length - 1 ? <i>↓</i> : null}</div>)}</div></FinalResultSection>
    <FinalResultSection eyebrow="INFORMATION REVIEW" title="何を知って、何を知らないまま決めたか"><div className="information-review"><div><h3>取得した重要情報</h3>{acquired.length ? <ul>{acquired.map(info => <li key={info.id}><strong>✓ {info.label}</strong><span>{info.detail}</span></li>)}</ul> : <p>重要情報を取得せずに判断しました。</p>}</div><div><h3>取得できなかった重要情報</h3>{missed.length ? <ul>{missed.map(info => <li key={info.id}><strong>— {info.label}</strong><span>{sourceActionsByInformation.get(info.id)?.join("／") || info.source}で確認できました。</span></li>)}</ul> : <p>このシナリオの重要情報をすべて確認しました。</p>}</div></div></FinalResultSection>
    <FinalResultSection eyebrow="STAKEHOLDER VOICES" title="関係者はどう受け止めたか"><div className="stakeholder-voices">{reactions.map(reaction => reaction ? <article key={reaction.stakeholder.id}><span>{reaction.stakeholder.avatar}</span><div><strong>{reaction.stakeholder.name}<small>{reaction.stakeholder.role}</small></strong><p>「{reaction.text}」</p></div></article> : null)}</div></FinalResultSection>
    <FinalResultSection eyebrow="PM REVIEW" title="今回見られたPM行動"><div className="stateful-behavior-review">{evidenceWeights.size ? [...evidenceWeights.entries()].sort((a, b) => b[1] - a[1]).map(([tag, weight]) => <div key={tag}><strong>{pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].label}</strong><p>{weight > 2 ? "複数の場面でこの行動が見られました。" : pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].actions[0]}</p></div>) : <p>今回は情報取得より即時判断を優先する傾向が見られました。別の選択で結果の違いを確かめてみましょう。</p>}</div></FinalResultSection>
    <FinalResultSection eyebrow="PMBOK REVIEW" title="今回判断した領域"><div className="stateful-domain-review">{[scenario.primaryDomain, ...scenario.relatedDomains].map(domain => <div key={domain}><strong>{pmbokDomains[domain].label}</strong><p>{pmbokDomains[domain].description}</p></div>)}</div></FinalResultSection>
  </FinalResultFramework>;
}
