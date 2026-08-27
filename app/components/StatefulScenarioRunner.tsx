"use client";

import { useEffect, useMemo, useState } from "react";
import { pmBehaviorStandards } from "@/src/data/pmBehaviorStandards";
import { pmbokDomains } from "@/src/data/pmbokDomains";
import type { BehaviorStandardEvidence, Difficulty } from "@/src/data/types";
import type { ScenarioAction, ScenarioActionCategoryId, ScenarioDecision, ScenarioOutcomeSummaryDefinition, SimulationMetrics, StatefulScenarioDefinition } from "@/src/data/statefulScenarioTypes";
import { learningByArea, pmActions } from "../data/actions";
import type { PMActionDefinition } from "../data/actions";
import type { ActionLog, ActionResult, MetricChange, Metrics, ScoreKey } from "../types/game";
import { AccessibleDialog } from "./AccessibleDialog";
import { ActionConfirmDialog, type ActionConfirmation } from "./ActionConfirmDialog";
import { ActionDetailModal } from "./ActionDetailModal";
import { FinalResultFramework, FinalResultSection, type OutcomeSummaryItem, type PMStyle } from "./FinalResultFramework";
import { FlowSteps } from "./FlowSteps";
import { ProjectLog } from "./ProjectLog";
import { ResultStep } from "./ResultStep";
import ScenarioActionExplorer from "./ScenarioActionExplorer";
import { SimulatorCockpit } from "./SimulatorCockpit";
import { SimulatorIntro } from "./SimulatorIntro";
import { SituationStep } from "./SituationStep";
import { StakeholderChatDrawer, StakeholderContactPicker, type ChatStakeholder, type StakeholderChatMessage } from "./StakeholderChatDrawer";
import { modeThemes } from "../data/modeThemes";
import { formatTimingLabel, formatTurnLabel, getMetricDisplayValue, getMetricHealthStatus, getMetricStatusLabel, healthStatusTones, metricLabels } from "../data/uiLabels";
import { calculateInformationScore, calculateOutcomeScore, getScenarioActionUsageKey, resolveScenarioActionOutcome } from "@/src/data/statefulScenarioLogic.mjs";
import { PlayNavigationMenu } from "./PlayNavigationMenu";
import { DecisionAnalysisTimeline } from "./DecisionAnalysisTimeline";
import { deleteSave, writePlaySession, type SavedPlaySession } from "../lib/playSession";
import { buildDecisionAnalysis, summarizeDecisionAnalysis } from "../lib/decisionAnalysis";

type PlayPhase = "briefing" | "situation" | "cockpit" | "result" | "final";
type ChainItem = { turn: number; timing: string; kind: "information" | "decision" | "consequence"; title: string; effect: string };
type DecisionRecord = { turn: number; timing: string; title: string; whatHappened: string; why: string; pmPoint: string; before: SimulationMetrics; after: SimulationMetrics; evidence: BehaviorStandardEvidence[] };
type ResultDialogState = { result: ActionResult; advancesTurn: boolean };
type StatefulSnapshot = { phase: PlayPhase; turnIndex: number; investigationsLeft: number; metrics: SimulationMetrics; flags: Record<string, boolean | number | string>; informationIds: string[]; usedActionKeys: string[]; actionUsageCounts: Partial<Record<ScenarioActionCategoryId, number>>; chatHistories: Record<string, StakeholderChatMessage[]>; decisions: DecisionRecord[]; chain: ChainItem[]; projectLogs: ActionLog[]; resultDialog?: ResultDialogState };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatefulSnapshot(value: unknown, turnCount: number): StatefulSnapshot | null {
  if (!isRecord(value)) return null;
  const allowedPhases: PlayPhase[] = ["briefing", "situation", "cockpit", "result", "final"];
  if (!allowedPhases.includes(value.phase as PlayPhase) || !Number.isInteger(value.turnIndex) || (value.turnIndex as number) < 0 || (value.turnIndex as number) >= turnCount) return null;
  if (!Number.isInteger(value.investigationsLeft) || (value.investigationsLeft as number) < 0 || !isRecord(value.metrics) || !isRecord(value.flags)) return null;
  if (!Array.isArray(value.informationIds) || !Array.isArray(value.usedActionKeys) || !isRecord(value.actionUsageCounts) || !isRecord(value.chatHistories) || !Array.isArray(value.decisions) || !Array.isArray(value.chain) || !Array.isArray(value.projectLogs)) return null;
  const resultDialog = isRecord(value.resultDialog) && isRecord(value.resultDialog.result) ? value.resultDialog as unknown as ResultDialogState : undefined;
  const phase = value.phase === "result" && !resultDialog ? "cockpit" : value.phase as PlayPhase;
  return {
    phase,
    turnIndex: value.turnIndex as number,
    investigationsLeft: value.investigationsLeft as number,
    metrics: value.metrics as unknown as SimulationMetrics,
    flags: value.flags as Record<string, boolean | number | string>,
    informationIds: value.informationIds as string[],
    usedActionKeys: value.usedActionKeys as string[],
    actionUsageCounts: value.actionUsageCounts as Partial<Record<ScenarioActionCategoryId, number>>,
    chatHistories: value.chatHistories as Record<string, StakeholderChatMessage[]>,
    decisions: value.decisions as DecisionRecord[],
    chain: value.chain as ChainItem[],
    projectLogs: value.projectLogs as ActionLog[],
    resultDialog,
  };
}

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
function summaryTone(key: keyof SimulationMetrics, value: number): OutcomeSummaryItem["tone"] { return healthStatusTones[getMetricHealthStatus(key, value)]; }
function matchesOutcomeRule(flags: Record<string, boolean | number | string>, rule: { requiresAll?: string[]; requiresAny?: string[] }) {
  return hasFlags(flags, rule.requiresAll) && (!rule.requiresAny || rule.requiresAny.some(id => Boolean(flags[id])));
}
function resolveOutcomeSummaryItem(definition: ScenarioOutcomeSummaryDefinition, metrics: SimulationMetrics, flags: Record<string, boolean | number | string>): OutcomeSummaryItem {
  if (definition.metric) return { label: definition.label, status: getMetricStatusLabel(definition.metric, metrics[definition.metric]), tone: summaryTone(definition.metric, metrics[definition.metric]) };
  const matched = definition.rules?.find(rule => matchesOutcomeRule(flags, rule));
  return { label: definition.label, status: matched?.status ?? definition.fallbackStatus ?? "判断完了", tone: matched?.tone ?? definition.fallbackTone ?? "neutral" };
}
function isFavorable(key: keyof SimulationMetrics, delta: number) { return key === "riskExposure" ? delta < 0 : delta > 0; }
function toCockpitMetrics(metrics: SimulationMetrics): Metrics { return { schedule: metrics.schedule, quality: metrics.quality, trust: metrics.trust, team: metrics.teamHealth, scopeStability: metrics.scopeStability, riskExposure: metrics.riskExposure, stakeholderAlignment: metrics.stakeholderAlignment }; }
function toCockpitChanges(before: SimulationMetrics, after: SimulationMetrics): MetricChange[] {
  const previous = toCockpitMetrics(before); const current = toCockpitMetrics(after);
  return (Object.keys(previous) as Array<keyof Metrics>).filter(key => previous[key] !== current[key]).map(key => ({ key, before: previous[key], after: current[key] }));
}
function confirmationFor(action: ScenarioAction): ActionConfirmation {
  const base = pmActions.find(item => item.id === action.category) ?? pmActions[0];
  return { title: `${action.title}を実行しますか？`, description: action.question ?? action.description, aims: ["判断材料を増やす", "確認先と質問内容を意識して情報を得る"], impacts: base.impactHints.map(item => ({ label: item.label, direction: directionMarks[item.direction] })) };
}

export default function StatefulScenarioRunner({ scenario, difficulty, onExit, onExitToHome, resumeSession }: { scenario: StatefulScenarioDefinition; difficulty: Difficulty; onExit: (saved: boolean) => void; onExitToHome: (saved: boolean) => void; resumeSession?: SavedPlaySession }) {
  const savedState = resumeSession?.mode === scenario.mode && resumeSession.scenarioId === scenario.id && resumeSession.difficulty === difficulty && isRecord(resumeSession.state) ? resumeSession.state : undefined;
  const resumedSnapshot = normalizeStatefulSnapshot(savedState?.snapshot, scenario.turns.length);
  const resumedHistory = Array.isArray(savedState?.history) ? savedState.history.map(item => normalizeStatefulSnapshot(item, scenario.turns.length)).filter((item): item is StatefulSnapshot => Boolean(item)) : [];
  const [phase, setPhase] = useState<PlayPhase>(() => resumedSnapshot?.phase ?? "briefing");
  const [turnIndex, setTurnIndex] = useState(() => resumedSnapshot?.turnIndex ?? 0);
  const investigationBudget = scenario.investigationBudget?.[difficulty] ?? (difficulty === "guided" ? 3 : 2);
  const [investigationsLeft, setInvestigationsLeft] = useState(() => resumedSnapshot?.investigationsLeft ?? investigationBudget);
  const [metrics, setMetrics] = useState(() => resumedSnapshot?.metrics ?? scenario.initialMetrics);
  const [flags, setFlags] = useState(() => resumedSnapshot?.flags ?? scenario.initialFlags);
  const [informationIds, setInformationIds] = useState<string[]>(() => resumedSnapshot?.informationIds ?? []);
  const [usedActionKeys, setUsedActionKeys] = useState<string[]>(() => resumedSnapshot?.usedActionKeys ?? []);
  const [actionUsageCounts, setActionUsageCounts] = useState<Partial<Record<ScenarioActionCategoryId, number>>>(() => resumedSnapshot?.actionUsageCounts ?? {});
  const [pickerCategory, setPickerCategory] = useState<ScenarioActionCategoryId>();
  const [selectedCategoryAction, setSelectedCategoryAction] = useState<PMActionDefinition>();
  const [actionDetailOpen, setActionDetailOpen] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<ScenarioAction>();
  const [showContacts, setShowContacts] = useState(false);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>();
  const [chatHistories, setChatHistories] = useState<Record<string, StakeholderChatMessage[]>>(() => resumedSnapshot?.chatHistories ?? {});
  const [selectedDecision, setSelectedDecision] = useState<ScenarioDecision>();
  const [resultDialog, setResultDialog] = useState<ResultDialogState | undefined>(() => resumedSnapshot?.resultDialog);
  const [decisions, setDecisions] = useState<DecisionRecord[]>(() => resumedSnapshot?.decisions ?? []);
  const [chain, setChain] = useState<ChainItem[]>(() => resumedSnapshot?.chain ?? []);
  const [projectLogs, setProjectLogs] = useState<ActionLog[]>(() => resumedSnapshot?.projectLogs ?? []);
  const [showLog, setShowLog] = useState(false);
  const [showInformation, setShowInformation] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [history, setHistory] = useState<StatefulSnapshot[]>(() => resumedHistory);
  const [activeSaveId, setActiveSaveId] = useState<string | undefined>(() => resumeSession?.id);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [phase, turnIndex]);

  const snapshot = (): StatefulSnapshot => JSON.parse(JSON.stringify({ phase, turnIndex, investigationsLeft, metrics, flags, informationIds, usedActionKeys, actionUsageCounts, chatHistories, decisions, chain, projectLogs, resultDialog }));
  const restoreSnapshot = (saved: StatefulSnapshot) => {
    setPhase(saved.phase); setTurnIndex(saved.turnIndex); setInvestigationsLeft(saved.investigationsLeft); setMetrics(saved.metrics); setFlags(saved.flags); setInformationIds(saved.informationIds); setUsedActionKeys(saved.usedActionKeys); setActionUsageCounts(saved.actionUsageCounts); setChatHistories(saved.chatHistories); setDecisions(saved.decisions); setChain(saved.chain); setProjectLogs(saved.projectLogs); setResultDialog(saved.resultDialog);
    setPickerCategory(undefined); setSelectedCategoryAction(undefined); setActionDetailOpen(false); setConfirmingAction(undefined); setShowContacts(false); setSelectedStakeholderId(undefined); setSelectedDecision(undefined); setShowLog(false); setShowInformation(false); setShowProjectDetails(false);
  };
  const pushHistory = () => setHistory(current => [...current, snapshot()]);
  const undo = () => setHistory(current => { const previous = current.at(-1); if (previous) restoreSnapshot(previous); return current.slice(0, -1); });
  const restart = () => {
    setActiveSaveId(undefined); setPhase("briefing"); setTurnIndex(0); setInvestigationsLeft(investigationBudget); setMetrics(scenario.initialMetrics); setFlags(scenario.initialFlags); setInformationIds([]); setUsedActionKeys([]); setActionUsageCounts({}); setChatHistories({}); setDecisions([]); setChain([]); setProjectLogs([]); setResultDialog(undefined); setHistory([]);
  };
  const savePlay = () => {
    const saved = writePlaySession({ id: activeSaveId, mode: scenario.mode, scenarioId: scenario.id, scenarioName: scenario.title, difficulty, guided: difficulty === "guided", progress: { current: turnIndex + 1, total: scenario.turns.length, label: "ターン" }, state: { snapshot: snapshot(), history } });
    if (saved) setActiveSaveId(saved.id);
    return Boolean(saved);
  };
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
  const hearingStakeholderIds = new Set(turnActions.filter(action => action.category === "hearing" && action.stakeholderId).map(action => action.stakeholderId));
  const chatStakeholders: ChatStakeholder[] = scenario.stakeholders.filter(stakeholder => hearingStakeholderIds.has(stakeholder.id)).map(stakeholder => ({ id: stakeholder.id, name: stakeholder.name, role: stakeholder.role, initials: stakeholder.avatar, status: stakeholder.priority }));
  const selectedStakeholder = chatStakeholders.find(stakeholder => stakeholder.id === selectedStakeholderId);
  const stakeholderQuestions = turnActions.filter(action => action.category === "hearing" && action.stakeholderId === selectedStakeholderId);

  const getActionAvailability = (action: ScenarioAction) => {
    if (investigationsLeft <= 0) return { disabled: true, label: "調査枠を使用済み" };
    if (usedActionKeys.includes(getScenarioActionUsageKey(action, turnIndex + 1))) return { disabled: true, label: action.repeatPolicy === "per-turn" ? "このターンで確認済み" : "確認済み" };
    return { disabled: false };
  };

  const executeAction = () => {
    const action = confirmingAction;
    if (!action || getActionAvailability(action).disabled) return;
    pushHistory();
    const actionOutcome = resolveScenarioActionOutcome(action, turnIndex + 1, informationIds, flags);
    const grantedInformation = actionOutcome.grantsInformation;
    const unlocked = grantedInformation.filter(id => !informationSet.has(id));
    const before = metrics; const after = applyMetrics(before, actionOutcome.metricEffects);
    const result = difficulty === "challenge" && actionOutcome.missingInformation.length
      ? "分析を具体化する前提が不足し、一般的な整理に留まりました。"
      : actionOutcome.result;
    const why = difficulty === "challenge" && actionOutcome.missingInformation.length
      ? "この分析を具体化するための前提情報が不足していました。"
      : actionOutcome.whyThisResult ?? "確認先と質問内容に応じた情報が得られました。";
    const changes = toCockpitChanges(before, after);
    setInformationIds(current => [...new Set([...current, ...unlocked])]);
    setFlags(current => mergeFlags(current, actionOutcome.setsFlags));
    setMetrics(after); setInvestigationsLeft(value => value - 1);
    setUsedActionKeys(current => [...current, getScenarioActionUsageKey(action, turnIndex + 1)]);
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
    pushHistory();
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
    const decisionTags = categoryTags[scenario.primaryDomain === "schedule" ? "schedule" : scenario.primaryDomain === "risk" ? "risk" : scenario.primaryDomain === "resources" ? "team" : scenario.primaryDomain === "stakeholders" ? "hearing" : "scope"];
    setProjectLogs(current => [...current, { id: `decision-${turnIndex + 1}`, kind: "action", turn: turnIndex + 1, day: turnIndex + 1, event: turn.title, label: decision.title, detail: decision.description, result: whatHappened, why: decision.why, learning: decision.pmPoint, changes, tags: decisionTags, alternatives: turn.decisions.filter(item => item.id !== decision.id).map(item => item.title) }]);
    setSelectedDecision(undefined);
    setResultDialog({ result: { title: decision.title, occurred: whatHappened, why: decision.why, learning: decision.pmPoint, tags: decisionTags, changes, unlocked: [] }, advancesTurn: true });
    setPhase("result");
  };

  const advanceTurn = () => {
    if (turnIndex >= scenario.turns.length - 1) {
      if (activeSaveId) deleteSave(activeSaveId);
      setResultDialog(undefined);
      setPhase("final");
      return;
    }
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

  if (phase === "final") return <StatefulScenarioReport scenario={scenario} metrics={metrics} flags={flags} informationSet={informationSet} decisions={decisions} projectLogs={projectLogs} onExit={onExit} onRestart={restart} onExitToHome={onExitToHome} />;
  if (phase === "briefing") {
    const intro = scenario.intro;
    const briefItems = [
      { label: "現在のフェーズ", value: intro.phase },
      { label: "チーム", value: intro.team },
      { label: intro.issueLabel, value: intro.issue },
      ...(intro.request ? [{ label: intro.requestLabel ?? "現在の相談", value: intro.request, className: "quote" }] : []),
      { label: "現時点のリスク", value: intro.risk, className: "risk", note: "情報は意図的に不完全です" },
    ];
    return <SimulatorIntro assignmentLabel={scenario.mode === "training" ? "今回のトレーニング" : "今回の担当案件"} modeLabel={modeThemes[scenario.mode].label} headline="あなたは、" emphasizedHeadline={intro.emphasizedHeadline} description={intro.description} rules={[{ number: "1", title: "状況を確認", detail: "いま起きている変化を読む" }, { number: "2", title: "PMとして判断", detail: `${investigationBudget}アクションで情報を集める` }, { number: "3", title: "結果から学ぶ", detail: scenario.mode === "training" ? "考え方の型を振り返る" : "過去の判断が後から影響する" }]} note={scenario.mode === "training" ? "正解を覚えるのではなく、事実を集め、整理し、選択肢を作る順序を練習します。" : "すべてを確認することはできません。何を知り、何を知らないまま判断するかもPMの選択です。"} briefTitle={intro.briefTitle} briefDescription={scenario.description} briefItems={briefItems} actionLabel={scenario.mode === "training" ? "トレーニングを始める" : "PMとして案件を始める"} onStart={() => setPhase("situation")} exitLabel="テーマ選択へ戻る" onExit={() => onExit(false)} />;
  }

  const budget = <div className="single-action-budget"><strong>{investigationsLeft}</strong><span>残り<br />アクション</span></div>;
  const footerMessage = investigationsLeft > 0 ? `調査アクションはあと${investigationsLeft}回です。残したまま最終判断することもできます。${hiddenDecisionCount > 0 ? " 得た情報によって判断案が増える場合があります。" : ""}` : `調査枠を使い切りました。${hiddenDecisionCount > 0 ? "取得した情報に応じた判断案を確認してください。" : "最終判断へ進めます。"}`;
  const situationNotice = [turn.situation, ...activeDelayedEffects.map(event => event.text), ...activeEvents.map(event => event.text)].join(" ");
  const acquiredInformation = scenario.information.filter(info => informationSet.has(info.id));
  const unknownInformation = scenario.information.filter(info => !informationSet.has(info.id));
  const situationKnown = [...turn.visibleInformation.map((label, index) => ({ id: `visible-${index}`, label })), ...acquiredInformation.map(info => ({ id: info.id, label: info.label, value: info.detail }))];
  const situationUnknown = difficulty === "guided" ? unknownInformation.map(info => ({ id: info.id, label: info.label })) : unknownInformation.length ? [{ id: "unconfirmed", label: "判断前に確認したい事項が残っています" }] : [];
  const openDecision = () => { if (visibleDecisions[0]) setSelectedDecision(visibleDecisions[0]); };
  const requiredDecision = <button type="button" className="scenario-decision-trigger step-scenario-decision" onClick={openDecision} disabled={!visibleDecisions.length}><span>今回の必須判断</span><strong>{turn.decisionLabel ?? `${turn.title}への対応方針`}</strong><small>未決定 — 判断する</small></button>;
  const simulationHeader = <header className="simulation-header"><div className="brand compact"><span className="brand-mark">PM</span><span>PROJECT: FIRST LIGHT</span><small className="mode-badge">{modeThemes[scenario.mode].label}</small></div><div className="time-context"><span>{formatTurnLabel(turnIndex + 1, scenario.turns.length)}</span><strong>{formatTimingLabel(turn.timing)}</strong><small>{scenario.title}</small></div><div className="header-utilities"><button type="button" className="utility-button" onClick={() => setShowInformation(true)}>判断材料 <b>{informationIds.length}</b></button><button type="button" className="utility-button" onClick={() => setShowProjectDetails(true)}>プロジェクト詳細</button><button className="log-jump" aria-expanded={showLog} onClick={() => setShowLog(true)}>プロジェクトログ <b>{projectLogs.length}</b></button><PlayNavigationMenu canUndo={history.length > 0} onSave={savePlay} onUndo={undo} onRestart={restart} onExit={save => { if (save) savePlay(); onExitToHome(save); }} /></div></header>;

  return <main className="simulation-shell stateful-canonical-shell">
    {simulationHeader}
    <FlowSteps current={phase === "situation" ? "situation" : phase === "result" ? "result" : "decision"} />
    {phase === "situation" ? <SituationStep turnNumber={turnIndex + 1} turnTotal={scenario.turns.length} theme={turn.timing} title={turn.title} notice={situationNotice} consider={difficulty === "challenge" ? "状況から、次に減らすべき不確実性を考えてください。" : turn.thinkingPoint} knownItems={situationKnown} unknownItems={situationUnknown} onDecide={() => setPhase("cockpit")} /> : null}
    {phase === "cockpit" ? <SimulatorCockpit title={turn.title} contextMeta={<><span>{formatTurnLabel(turnIndex + 1, scenario.turns.length)}</span><small>{formatTimingLabel(turn.timing)}</small></>} onViewSituation={() => setPhase("situation")} metrics={cockpitMetrics} changes={[]} kicker="PMアクション" prompt="PMとして、次に何をしますか？" budget={budget} scenarioDecision={requiredDecision} actions={pmActions} usedIds={Object.keys(actionUsageCounts) as ScenarioActionCategoryId[]} usageCounts={actionUsageCounts} disabled={investigationsLeft <= 0} onSelectAction={action => { setSelectedCategoryAction(action); setActionDetailOpen(true); }} footerMessage={footerMessage} advanceLabel="このターンの判断をする" canAdvance={visibleDecisions.length > 0} onAdvance={openDecision} /> : null}
    {phase === "result" && resultDialog ? <ResultStep result={resultDialog.result} nextLabel={resultDialog.advancesTurn ? (turnIndex === scenario.turns.length - 1 ? "一連の判断を振り返る" : "次の状況へ") : "次の判断へ"} onNext={resultDialog.advancesTurn ? advanceTurn : () => { setResultDialog(undefined); setPhase("cockpit"); }} /> : null}
    <div className={`log-section ${showLog ? "is-open" : ""}`} onClick={() => setShowLog(false)}><div className="log-dialog" onClick={event => event.stopPropagation()}><button className="log-close" aria-label="プロジェクトログを閉じる" onClick={() => setShowLog(false)}>閉じる ×</button><ProjectLog logs={projectLogs} compact /></div></div>
    {pickerCategory && selectedCategory && pickerCategory !== "hearing" ? <AccessibleDialog onClose={() => setPickerCategory(undefined)} labelledBy="scenario-action-picker-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog scenario-action-picker-dialog"><header><div><p>PMアクション</p><h2 id="scenario-action-picker-title">{selectedCategory.label}</h2></div><button type="button" aria-label="具体的な行動選択を閉じる" onClick={() => setPickerCategory(undefined)}>×</button></header><ScenarioActionExplorer key={`${turn.id}-${pickerCategory}`} categories={scenario.actionCategories ?? []} actions={turnActions.filter(action => action.category !== "hearing")} stakeholders={scenario.stakeholders} difficulty={difficulty} relevantActionIds={relevantActionIds} getAvailability={getActionAvailability} onSelect={action => { setPickerCategory(undefined); setConfirmingAction(action); }} initialCategoryId={pickerCategory} allowCategoryReset={false} /></AccessibleDialog> : null}
    {actionDetailOpen && selectedCategoryAction ? <ActionDetailModal action={selectedCategoryAction} actionsLeft={investigationsLeft} disabled={investigationsLeft <= 0} onClose={() => { setActionDetailOpen(false); setSelectedCategoryAction(undefined); }} onExecute={() => { const category = selectedCategoryAction.id; setActionDetailOpen(false); setSelectedCategoryAction(undefined); if (category === "hearing") setShowContacts(true); else setPickerCategory(category); }} /> : null}
    {showContacts ? <StakeholderContactPicker stakeholders={chatStakeholders} onSelect={id => { setShowContacts(false); setSelectedStakeholderId(id); }} onClose={() => setShowContacts(false)} /> : null}
    {selectedStakeholder ? <StakeholderChatDrawer stakeholder={selectedStakeholder} messages={chatHistories[selectedStakeholder.id] ?? []} questions={stakeholderQuestions.map(action => { const availability = getActionAvailability(action); return { id: action.id, label: action.question ?? action.title, disabled: availability.disabled, statusLabel: availability.disabled ? availability.label : "実行前に確認" }; })} actionsLeft={investigationsLeft} disabled={investigationsLeft <= 0} onSelectQuestion={id => { const action = stakeholderQuestions.find(item => item.id === id); if (action) setConfirmingAction(action); }} onClose={() => setSelectedStakeholderId(undefined)} /> : null}
    {confirmingAction ? <ActionConfirmDialog confirmation={confirmationFor(confirmingAction)} actionsLeft={investigationsLeft} onCancel={() => setConfirmingAction(undefined)} onConfirm={executeAction} /> : null}
    {selectedDecision ? <AccessibleDialog onClose={() => setSelectedDecision(undefined)} labelledBy="stateful-decision-title" overlayClassName="scenario-overlay" dialogClassName="scenario-choice-dialog canonical-decision-dialog"><header><div><p>ターンの判断</p><h2 id="stateful-decision-title">PMとして、どう判断しますか？</h2></div><button type="button" onClick={() => setSelectedDecision(undefined)}>閉じる</button></header><p>取得した判断材料と、守りたいものを踏まえて選択してください。</p><div className="decision-choice-list">{visibleDecisions.map(decision => <button key={decision.id} type="button" className={selectedDecision.id === decision.id ? "is-selected" : ""} onClick={() => setSelectedDecision(decision)}><strong>{decision.title}{decision.irreversible ? <em>正式な判断</em> : null}</strong><span>{difficulty === "challenge" ? "この判断を選択肢として検討します。" : decision.description}</span><b>{selectedDecision.id === decision.id ? "選択中" : "詳しく確認"}</b></button>)}</div><footer className="canonical-decision-footer"><div><span>選択中</span><strong>{selectedDecision.title}</strong></div><button className="primary" onClick={executeDecision}>この判断を確定する</button></footer></AccessibleDialog> : null}
    {showInformation ? <AccessibleDialog onClose={() => setShowInformation(false)} labelledBy="information-dialog-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog project-detail-dialog"><header><div><p>判断材料</p><h2 id="information-dialog-title">取得した判断材料</h2></div><button type="button" aria-label="判断材料を閉じる" onClick={() => setShowInformation(false)}>×</button></header><div className="project-information-dialog">{difficulty === "guided" ? scenario.information.map(info => informationSet.has(info.id) ? <article key={info.id} className="is-known"><strong>✓ {info.label}</strong><p>{info.detail}</p></article> : <article key={info.id}><strong>🔒 未確認</strong><p>手がかり：{info.source}</p></article>) : scenario.information.filter(info => informationSet.has(info.id)).map(info => <article key={info.id} className="is-known"><strong>✓ {info.label}</strong>{difficulty === "standard" ? <p>{info.detail}</p> : null}</article>)}</div>{difficulty !== "guided" && informationIds.length === 0 ? <p className="project-dialog-empty">まだ判断材料を取得していません。</p> : null}</AccessibleDialog> : null}
    {showProjectDetails ? <AccessibleDialog onClose={() => setShowProjectDetails(false)} labelledBy="project-details-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog project-detail-dialog"><header><div><p>プロジェクト詳細</p><h2 id="project-details-title">その他のプロジェクト状態</h2></div><button type="button" aria-label="プロジェクト詳細を閉じる" onClick={() => setShowProjectDetails(false)}>×</button></header><div className="project-extra-metrics">{(["budget", "businessValue", "scopeStability", "stakeholderAlignment"] as Array<keyof SimulationMetrics>).map(key => <article key={key}><span>{metricLabels[key]}</span><strong>{getMetricStatusLabel(key, metrics[key])}</strong><small>{getMetricDisplayValue(key, metrics[key])}</small><i style={{ width: `${getMetricDisplayValue(key, metrics[key])}%` }} /></article>)}</div></AccessibleDialog> : null}
  </main>;
}

function StatefulScenarioReport({ scenario, metrics, flags, informationSet, decisions, projectLogs, onExit, onRestart, onExitToHome }: { scenario: StatefulScenarioDefinition; metrics: SimulationMetrics; flags: Record<string, boolean | number | string>; informationSet: Set<string>; decisions: DecisionRecord[]; projectLogs: ActionLog[]; onExit: (saved: boolean) => void; onRestart: () => void; onExitToHome: (saved: boolean) => void }) {
  const scoredInformation: Array<{ id: string; weight: number; reviewHint?: string }> = scenario.resultConfig.scoredInformation ?? scenario.information.map(info => ({ id: info.id, weight: 1 }));
  const informationWeights = new Map(scoredInformation.map(item => [item.id, item.weight]));
  const byImportance = (a: { id: string }, b: { id: string }) => (informationWeights.get(b.id) ?? 0) - (informationWeights.get(a.id) ?? 0);
  const acquired = scenario.information.filter(info => informationSet.has(info.id)).sort(byImportance); const missed = scenario.information.filter(info => !informationSet.has(info.id)).sort(byImportance);
  const acquiredImportant = acquired.filter(info => informationWeights.has(info.id));
  const missedImportant = missed.filter(info => informationWeights.has(info.id));
  const acquiredSupplemental = acquired.filter(info => !informationWeights.has(info.id));
  const sourceActionsByInformation = new Map(scenario.information.map(info => [info.id, scenario.actions.filter(action => action.grantsInformation.includes(info.id) || Object.values(action.outcomesByTurn ?? {}).some(outcome => outcome.grantsInformation?.includes(info.id)) || action.conditionalOutcomes?.some(outcome => outcome.grantsInformation?.includes(info.id))).map(action => action.title)]));
  const metricDeltas = (Object.keys(metrics) as Array<keyof SimulationMetrics>).map(key => ({ key, delta: metrics[key] - scenario.initialMetrics[key] }));
  const protectedItems = metricDeltas.filter(item => isFavorable(item.key, item.delta) && Math.abs(item.delta) >= 2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const sacrificedItems = metricDeltas.filter(item => !isFavorable(item.key, item.delta) && Math.abs(item.delta) >= 2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const evidenceWeights = new Map<string, number>(); decisions.flatMap(decision => decision.evidence).forEach(item => evidenceWeights.set(item.behavior, (evidenceWeights.get(item.behavior) ?? 0) + item.weight));
  const reactions = scenario.stakeholders.map(stakeholder => { const rules = scenario.reactionRules.filter(rule => rule.stakeholderId === stakeholder.id); const match = rules.find(rule => !rule.fallback && hasFlags(flags, rule.requiresAll) && (!rule.requiresAny || rule.requiresAny.some(id => Boolean(flags[id])))) ?? rules.find(rule => rule.fallback); return match ? { stakeholder, text: match.text } : null; }).filter(Boolean);
  const scoreMetrics = scenario.resultConfig.scoreMetrics ?? (scenario.resultConfig.scoreMetricKeys ?? (Object.keys(metrics) as Array<keyof SimulationMetrics>)).map(key => ({ key, weight: 1 }));
  const outcomeScore = calculateOutcomeScore(metrics, scoreMetrics);
  const evidenceTotal = [...evidenceWeights.values()].reduce((sum, value) => sum + value, 0);
  const informationScore = calculateInformationScore(informationSet, scoredInformation, scenario.resultConfig.informationFullCreditRatio ?? 0.8);
  const rawDecisionScore = Math.min(100, Math.round(evidenceTotal / Math.max(1, decisions.length * 4) * 100));
  const decisionScore = Math.round(rawDecisionScore * (.55 + informationScore / 100 * .45));
  const scoreWeights = scenario.resultConfig.scoreWeights ?? (scenario.mode === "training"
    ? { outcome: .3, decision: .4, information: .3 }
    : { outcome: .5, decision: .3, information: .2 });
  const scoreWeightTotal = scoreWeights.outcome + scoreWeights.decision + scoreWeights.information;
  const totalScore = Math.round((outcomeScore * scoreWeights.outcome + decisionScore * scoreWeights.decision + informationScore * scoreWeights.information) / scoreWeightTotal);
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
  const finalMetricKeys = scenario.resultConfig.finalMetricKeys ?? (["schedule", "quality", "trust", "teamHealth", "riskExposure"] as Array<keyof SimulationMetrics>);
  const finalMetrics = finalMetricKeys.map(key => ({ label: metricLabels[key], value: getMetricDisplayValue(key, metrics[key]), status: getMetricStatusLabel(key, metrics[key]) }));
  const outcomeSummary = scenario.resultConfig.outcomeSummary.map(item => resolveOutcomeSummaryItem(item, metrics, flags));
  const breakdown = [
    { label: "プロジェクト成果", score: outcomeScore, weight: `${Math.round(scoreWeights.outcome / scoreWeightTotal * 100)}%` },
    { label: "判断プロセス", score: decisionScore, weight: `${Math.round(scoreWeights.decision / scoreWeightTotal * 100)}%` },
    { label: "情報収集", score: informationScore, weight: `${Math.round(scoreWeights.information / scoreWeightTotal * 100)}%` },
  ];
  const behaviorEntries = [...evidenceWeights.entries()].sort((a, b) => b[1] - a[1]);
  const informationReview = <FinalResultSection eyebrow="情報収集の振り返り" title="何を知って、何を知らないまま決めたか"><div className="information-review"><div><h3>取得した重要情報</h3>{acquiredImportant.length ? <ul>{acquiredImportant.map(info => <li key={info.id}><strong>✓ {info.label}</strong><span>{info.detail}</span></li>)}</ul> : <p>重要情報を取得せずに判断しました。</p>}{acquiredSupplemental.length ? <><h3>その他に確認した情報</h3><ul>{acquiredSupplemental.map(info => <li key={info.id}><strong>✓ {info.label}</strong><span>{info.detail}</span></li>)}</ul></> : null}</div><div><h3>見落とした重要情報</h3>{missedImportant.length ? <ul>{missedImportant.map(info => { const scored = scoredInformation.find(item => item.id === info.id); return <li key={info.id}><strong>— {info.label}</strong><span>{scored?.reviewHint ?? `${sourceActionsByInformation.get(info.id)?.join("／") || info.source}で確認できました。`}</span></li>; })}</ul> : <p>このシナリオの重要情報をすべて確認しました。</p>}</div></div></FinalResultSection>;
  const decisionAnalysis = buildDecisionAnalysis(projectLogs, true);
  const decisionSummary = summarizeDecisionAnalysis(decisionAnalysis);
  const decisionChain = <FinalResultSection eyebrow="判断の連鎖" title={scenario.mode === "training" ? "事実から判断まで、どうつないだか" : "判断が結果へつながった道筋"}><DecisionAnalysisTimeline items={decisionAnalysis} summary={decisionSummary} /></FinalResultSection>;
  return <FinalResultFramework mode={scenario.mode} title={scenario.title} score={totalScore} style={scenario.resultConfig.showPmStyle ?? scenario.mode === "project" ? style : undefined} summary={scenario.mode === "training" ? "プロジェクト成果よりも、必要な事実を集め、整理し、判断へつなげたプロセスを重く評価しています。" : "正解率ではなく、最終状態・判断プロセス・情報収集を合わせたプロジェクト運営全体の指標です。"} outcomeSummary={outcomeSummary} metrics={finalMetrics} breakdown={breakdown} actions={<><button className="v2-secondary" onClick={() => onExit(false)}>別のテーマを選ぶ</button><button className="v2-secondary" onClick={() => onExitToHome(false)}>モードを変更する</button><button className="primary" onClick={onRestart}>{scenario.mode === "training" ? "もう一度挑戦" : "最初からプレイ"}</button></>}>
    {scenario.mode === "training" ? <>
      <FinalResultSection eyebrow="良かった判断" title="今回できていた考え方"><div className="stateful-behavior-review">{behaviorEntries.length ? behaviorEntries.slice(0, 4).map(([tag, weight]) => <div key={tag}><strong>{pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].label}</strong><p>{weight > 2 ? "複数の場面でこの行動が見られました。" : pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].actions[0]}</p></div>) : <p>別の情報収集順も試し、判断材料の違いを確かめてみましょう。</p>}</div></FinalResultSection>
      {informationReview}
      {decisionChain}
      <FinalResultSection eyebrow="次回に向けて" title="今回身につけたい3つの行動"><div className="stateful-domain-review">{(scenario.resultConfig.learningActions ?? []).slice(0, 3).map((action, index) => <div key={action}><strong>{index + 1}</strong><p>{action}</p></div>)}</div></FinalResultSection>
    </> : <>
      <FinalResultSection eyebrow="プロジェクトの着地点" title="守ったもの / 犠牲になったもの"><div className="tradeoff-review"><div><h3>あなたが守ったもの</h3>{protectedItems.length ? protectedItems.map(item => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>明確に改善した指標はありませんでした。</p>}</div><div><h3>代わりに犠牲になったもの</h3>{sacrificedItems.length ? sacrificedItems.map(item => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>大きく悪化した指標はありませんでした。</p>}</div></div></FinalResultSection>
      {decisionChain}
      {informationReview}
      <FinalResultSection eyebrow="関係者の声" title="関係者はどう受け止めたか"><div className="stakeholder-voices">{reactions.map(reaction => reaction ? <article key={reaction.stakeholder.id}><span>{reaction.stakeholder.avatar}</span><div><strong>{reaction.stakeholder.name}<small>{reaction.stakeholder.role}</small></strong><p>「{reaction.text}」</p></div></article> : null)}</div></FinalResultSection>
      <FinalResultSection eyebrow="PMとしての振り返り" title="今回見られたPM行動"><div className="stateful-behavior-review">{behaviorEntries.length ? behaviorEntries.map(([tag, weight]) => <div key={tag}><strong>{pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].label}</strong><p>{weight > 2 ? "複数の場面でこの行動が見られました。" : pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].actions[0]}</p></div>) : <p>今回は情報取得より即時判断を優先する傾向が見られました。別の選択で結果の違いを確かめてみましょう。</p>}</div></FinalResultSection>
    </>}
    <FinalResultSection eyebrow="PMBOKで振り返る" title="今回判断した領域"><div className="stateful-domain-review">{[scenario.primaryDomain, ...scenario.relatedDomains].map(domain => <div key={domain}><strong>{pmbokDomains[domain].label}</strong><p>{pmbokDomains[domain].description}</p></div>)}</div></FinalResultSection>
  </FinalResultFramework>;
}
