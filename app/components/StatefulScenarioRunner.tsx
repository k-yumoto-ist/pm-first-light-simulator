"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { pmBehaviorStandards } from "@/src/data/pmBehaviorStandards";
import { pmbokDomains } from "@/src/data/pmbokDomains";
import type { BehaviorStandardEvidence, Difficulty } from "@/src/data/types";
import type { ScenarioAction, ScenarioDecision, SimulationMetrics, StatefulScenarioDefinition } from "@/src/data/statefulScenarioTypes";

type PlayPhase = "briefing" | "situation" | "action" | "action-result" | "decision-result" | "final";
type ChainItem = { turn: number; timing: string; kind: "information" | "decision" | "consequence"; title: string; effect: string };
type DecisionRecord = { turn: number; timing: string; title: string; whatHappened: string; why: string; pmPoint: string; before: SimulationMetrics; after: SimulationMetrics; evidence: BehaviorStandardEvidence[] };

const metricLabels: Record<keyof SimulationMetrics, string> = {
  schedule: "Schedule", budget: "Budget", quality: "Quality", trust: "Customer Trust", teamHealth: "Team Condition",
  businessValue: "Business Value", riskExposure: "Risk Exposure", scopeStability: "Scope Stability", stakeholderAlignment: "Stakeholder Alignment",
};
const actionIcons: Record<ScenarioAction["category"], string> = { hearing: "◉", schedule: "◷", risk: "△", scope: "◎", team: "♟", report: "↗" };

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function applyMetrics(current: SimulationMetrics, effects: Partial<SimulationMetrics>) {
  const next = { ...current };
  (Object.keys(effects) as Array<keyof SimulationMetrics>).forEach((key) => { next[key] = clamp(next[key] + (effects[key] ?? 0)); });
  return next;
}
function mergeFlags(current: Record<string, boolean | number | string>, changes?: Record<string, boolean | number | string>) { return changes ? { ...current, ...changes } : current; }
function hasFlags(flags: Record<string, boolean | number | string>, ids: string[] = []) { return ids.every((id) => Boolean(flags[id])); }
function status(key: keyof SimulationMetrics, value: number) {
  const effective = key === "riskExposure" ? 100 - value : value;
  return effective >= 72 ? "Stable" : effective >= 52 ? "Caution" : effective >= 32 ? "Warning" : "Critical";
}
function isFavorable(key: keyof SimulationMetrics, delta: number) { return key === "riskExposure" ? delta < 0 : delta > 0; }

function AccessibleModal({ onClose, labelledBy, className, children }: { onClose: () => void; labelledBy: string; className: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocusRef.current?.focus(); };
  }, []);
  return <div className="v2-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>{children}</section></div>;
}

export default function StatefulScenarioRunner({ scenario, difficulty, onExit }: { scenario: StatefulScenarioDefinition; difficulty: Difficulty; onExit: () => void }) {
  const [phase, setPhase] = useState<PlayPhase>("briefing");
  const [turnIndex, setTurnIndex] = useState(0);
  const [actionsLeft, setActionsLeft] = useState(3);
  const [metrics, setMetrics] = useState(scenario.initialMetrics);
  const [flags, setFlags] = useState(scenario.initialFlags);
  const [informationIds, setInformationIds] = useState<string[]>([]);
  const [usedActions, setUsedActions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<ScenarioAction>();
  const [selectedDecision, setSelectedDecision] = useState<ScenarioDecision>();
  const [lastActionResult, setLastActionResult] = useState<{ action: ScenarioAction; unlocked: string[] }>();
  const [lastDecision, setLastDecision] = useState<DecisionRecord>();
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [chain, setChain] = useState<ChainItem[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [phase, turnIndex]);

  const turn = scenario.turns[turnIndex];
  const informationSet = useMemo(() => new Set(informationIds), [informationIds]);
  const actionMap = useMemo(() => new Map(scenario.actions.map((action) => [action.id, action])), [scenario.actions]);
  const turnActions = turn.actionIds.map((id) => actionMap.get(id)).filter((action): action is ScenarioAction => Boolean(action && action.availableFromTurn <= turnIndex + 1));
  const visibleDecisions = turn.decisions.filter((decision) => !decision.hidesWhenMissing || (decision.requiresInformation ?? []).every((id) => informationSet.has(id)));
  const hiddenDecisionCount = turn.decisions.length - visibleDecisions.length;
  const activeEvents = turn.eventByFlags?.filter((event) => hasFlags(flags, event.requiresAll)) ?? [];
  const activeDelayedEffects = turn.delayedEffects?.filter((event) => hasFlags(flags, event.requiresAll)) ?? [];

  const executeAction = () => {
    if (!selectedAction || actionsLeft <= 1) return;
    const unlocked = selectedAction.grantsInformation.filter((id) => !informationSet.has(id));
    setInformationIds((current) => [...new Set([...current, ...unlocked])]);
    setFlags((current) => mergeFlags(current, selectedAction.setsFlags));
    setMetrics((current) => applyMetrics(current, selectedAction.metricEffects ?? {}));
    setActionsLeft((value) => value - 1);
    setUsedActions((current) => [...current, selectedAction.id]);
    setLastActionResult({ action: selectedAction, unlocked });
    if (unlocked.length) setChain((current) => [...current, { turn: turnIndex + 1, timing: turn.timing, kind: "information", title: selectedAction.title, effect: unlocked.map((id) => scenario.information.find((info) => info.id === id)?.label).filter(Boolean).join("・") + "を把握" }]);
    setSelectedAction(undefined);
    setPhase("action-result");
  };

  const executeDecision = () => {
    if (!selectedDecision || actionsLeft < 1) return;
    let after = applyMetrics(metrics, selectedDecision.metricEffects);
    let nextFlags = mergeFlags(flags, selectedDecision.setsFlags);
    let whatHappened = selectedDecision.whatHappened;
    const appliedChains = [selectedDecision.chainEffect];
    for (const outcome of selectedDecision.conditionalOutcomes ?? []) {
      if (hasFlags(nextFlags, outcome.requiresAll)) {
        after = applyMetrics(after, outcome.metricEffects);
        nextFlags = mergeFlags(nextFlags, outcome.setsFlags);
        whatHappened += ` ${outcome.resultSuffix}`;
        appliedChains.push(outcome.chainEffect);
      }
    }
    const record: DecisionRecord = { turn: turnIndex + 1, timing: turn.timing, title: selectedDecision.title, whatHappened, why: selectedDecision.why, pmPoint: selectedDecision.pmPoint, before: metrics, after, evidence: selectedDecision.evidence };
    setMetrics(after); setFlags(nextFlags); setActionsLeft((value) => value - 1); setDecisions((current) => [...current, record]); setLastDecision(record);
    setChain((current) => [...current, ...appliedChains.map((effect) => ({ turn: turnIndex + 1, timing: turn.timing, kind: "decision" as const, title: selectedDecision.title, effect }))]);
    setSelectedDecision(undefined); setPhase("decision-result");
  };

  const advanceTurn = () => {
    if (turnIndex >= scenario.turns.length - 1) { setPhase("final"); return; }
    const nextIndex = turnIndex + 1;
    const nextTurn = scenario.turns[nextIndex];
    let nextMetrics = metrics;
    const consequences: ChainItem[] = [];
    for (const consequence of nextTurn.delayedEffects ?? []) {
      if (hasFlags(flags, consequence.requiresAll)) {
        nextMetrics = applyMetrics(nextMetrics, consequence.metricEffects);
        consequences.push({ turn: nextIndex + 1, timing: nextTurn.timing, kind: "consequence", title: "過去の判断が影響", effect: consequence.chainEffect });
      }
    }
    setMetrics(nextMetrics); setChain((current) => [...current, ...consequences]); setTurnIndex(nextIndex); setActionsLeft(3); setUsedActions([]); setLastActionResult(undefined); setLastDecision(undefined); setPhase("situation");
  };

  if (phase === "final") {
    const acquired = scenario.information.filter((info) => informationSet.has(info.id));
    const missed = scenario.information.filter((info) => !informationSet.has(info.id));
    const metricDeltas = (Object.keys(metrics) as Array<keyof SimulationMetrics>).map((key) => ({ key, delta: metrics[key] - scenario.initialMetrics[key], value: metrics[key] }));
    const protectedItems = metricDeltas.filter((item) => isFavorable(item.key, item.delta) && Math.abs(item.delta) >= 2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
    const sacrificedItems = metricDeltas.filter((item) => !isFavorable(item.key, item.delta) && Math.abs(item.delta) >= 2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
    const evidenceWeights = new Map<string, number>();
    decisions.flatMap((decision) => decision.evidence).forEach((item) => evidenceWeights.set(item.behavior, (evidenceWeights.get(item.behavior) ?? 0) + item.weight));
    const reactions = scenario.stakeholders.map((stakeholder) => {
      const rules = scenario.reactionRules.filter((rule) => rule.stakeholderId === stakeholder.id);
      const match = rules.find((rule) => !rule.fallback && hasFlags(flags, rule.requiresAll) && (!rule.requiresAny || rule.requiresAny.some((id) => Boolean(flags[id])))) ?? rules.find((rule) => rule.fallback);
      return match ? { stakeholder, text: match.text } : null;
    }).filter(Boolean);
    return (
      <main className="stateful-report-shell">
        <header className="v2-sim-header"><div><strong>PROJECT: FIRST LIGHT</strong><span>PROJECT SCENARIO REVIEW</span></div><button onClick={onExit}>MODE SELECT</button></header>
        <article className="stateful-report">
          <p className="v2-kicker">PROJECT RESULT</p><h1>{scenario.title}</h1><p className="stateful-report-lead">あなたの判断が何を守り、何を次の課題として残したかを振り返ります。</p>
          <div className="stateful-final-metrics">{(Object.keys(metrics) as Array<keyof SimulationMetrics>).map((key) => <div key={key}><span>{metricLabels[key]}</span><strong>{status(key, metrics[key])}</strong><small>{scenario.initialMetrics[key]} → {metrics[key]}</small></div>)}</div>

          <section className="stateful-report-section"><p className="v2-kicker">DECISION CHAIN</p><h2>判断が後からどう効いたか</h2><div className="decision-chain">{chain.map((item, index) => <div key={`${item.turn}-${index}`} className={`chain-${item.kind}`}><b>{item.timing}</b><span>{item.title}</span><strong>{item.effect}</strong>{index < chain.length - 1 && <i>↓</i>}</div>)}</div></section>

          <section className="stateful-report-section"><p className="v2-kicker">INFORMATION REVIEW</p><h2>何を知って、何を知らないまま決めたか</h2><div className="information-review"><div><h3>取得した重要情報</h3>{acquired.length ? <ul>{acquired.map((info) => <li key={info.id}><strong>✓ {info.label}</strong><span>{info.detail}</span></li>)}</ul> : <p>重要情報を取得せずに判断しました。</p>}</div><div><h3>取得できなかった重要情報</h3>{missed.length ? <ul>{missed.map((info) => <li key={info.id}><strong>— {info.label}</strong><span>{info.source}で確認できました。</span></li>)}</ul> : <p>このシナリオの重要情報をすべて確認しました。</p>}</div></div></section>

          <section className="stateful-report-section"><p className="v2-kicker">TRADE-OFF</p><h2>守ったもの / 犠牲になったもの</h2><div className="tradeoff-review"><div><h3>あなたが守ったもの</h3>{protectedItems.length ? protectedItems.map((item) => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>明確に改善した指標はありませんでした。</p>}</div><div><h3>代わりに犠牲になったもの</h3>{sacrificedItems.length ? sacrificedItems.map((item) => <p key={item.key}><strong>{metricLabels[item.key]}</strong><span>{item.delta > 0 ? "+" : ""}{item.delta}</span></p>) : <p>大きく悪化した指標はありませんでした。</p>}</div></div></section>

          <section className="stateful-report-section"><p className="v2-kicker">STAKEHOLDER VOICES</p><h2>関係者はどう受け止めたか</h2><div className="stakeholder-voices">{reactions.map((reaction) => reaction && <article key={reaction.stakeholder.id}><span>{reaction.stakeholder.avatar}</span><div><strong>{reaction.stakeholder.name}<small>{reaction.stakeholder.role}</small></strong><p>「{reaction.text}」</p></div></article>)}</div></section>

          <section className="stateful-report-section"><p className="v2-kicker">PMBOK REVIEW</p><h2>今回判断した領域</h2><div className="stateful-domain-review">{[scenario.primaryDomain, ...scenario.relatedDomains].map((domain) => <div key={domain}><strong>{pmbokDomains[domain].label}</strong><p>{pmbokDomains[domain].description}</p></div>)}</div></section>

          <section className="stateful-report-section"><p className="v2-kicker">YOUR PM STYLE</p><h2>今回見られたPM行動</h2><div className="stateful-behavior-review">{evidenceWeights.size ? [...evidenceWeights.entries()].sort((a, b) => b[1] - a[1]).map(([tag, weight]) => <div key={tag}><strong>{pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].label}</strong><p>{weight > 2 ? "複数の場面でこの行動が見られました。" : pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].actions[0]}</p></div>) : <p>今回は情報取得より即時判断を優先する傾向が見られました。別の選択で結果の違いを確かめてみましょう。</p>}</div></section>
          <div className="v2-report-actions"><button className="v2-secondary" onClick={onExit}>別のシナリオを選ぶ</button><button className="primary" onClick={() => window.location.reload()}>最初からプレイ</button></div>
        </article>
      </main>
    );
  }

  return (
    <main className="stateful-shell">
      <header className="stateful-header"><div><strong>PROJECT: FIRST LIGHT</strong><span>{scenario.title}</span></div><nav><i className={phase === "situation" || phase === "briefing" ? "active" : "done"}>1 状況</i><i className={phase === "action" ? "active" : phase.includes("result") ? "done" : ""}>2 行動</i><i className={phase.includes("result") ? "active" : ""}>3 結果</i></nav><button onClick={onExit}>終了</button></header>
      {phase === "action" ? <div className="stateful-metric-ribbon">{(["schedule", "quality", "trust", "teamHealth", "riskExposure"] as Array<keyof SimulationMetrics>).map((key) => <span key={key}>{metricLabels[key]} <b>{status(key, metrics[key])}</b></span>)}</div> : null}
      {phase === "briefing" && <section className="stateful-briefing"><p className="v2-kicker">PROJECT SCENARIO</p><h1>{scenario.title}</h1><p>{scenario.description}</p><div><strong>このシナリオの進め方</strong><span>各ターン 3 ACTIONS</span><span>情報収集にも、最終判断にもActionを使います</span><span>過去の約束は後のターンへ残ります</span></div><button className="primary large" onClick={() => setPhase("situation")}>案件を引き受ける <span>→</span></button></section>}

      {phase === "situation" && <section className="stateful-situation"><div className="stateful-turn"><span>TURN {turnIndex + 1} / {scenario.turns.length}</span><b>{turn.timing}</b></div><h1>{turn.title}</h1><p className="stateful-situation-copy">{turn.situation}</p>{activeDelayedEffects.map((event) => <aside key={event.text}>↳ {event.text}</aside>)}{activeEvents.map((event) => <aside key={event.text}>⚠ {event.text}</aside>)}<div className="stateful-thinking"><strong>PMとして考えるポイント</strong><p>{turn.thinkingPoint}</p></div><div className="stateful-known"><strong>現在わかっていること</strong>{turn.visibleInformation.map((item) => <span key={item}>✓ {item}</span>)}<button onClick={() => setPhase("action")}>情報を集めて判断する →</button></div></section>}

      {phase === "action" && <section className="stateful-action-view"><div className="stateful-action-heading"><div><p className="v2-kicker">TURN {turnIndex + 1} — PLAYER ACTION</p><h1>次に何を確かめますか？</h1><span>{turn.title}</span></div><div className="stateful-action-counter"><strong>{actionsLeft}</strong><span>ACTIONS<br />REMAINING</span></div></div><div className="stateful-play-grid"><div><h2>PMアクション</h2><div className="stateful-action-list">{turnActions.map((action) => { const used = usedActions.includes(action.id); const alreadyKnown = action.grantsInformation.length > 0 && action.grantsInformation.every((id) => informationSet.has(id)); return <button key={action.id} disabled={used || actionsLeft <= 1} onClick={() => setSelectedAction(action)}><b>{actionIcons[action.category]}</b><div><strong>{action.title}</strong><span>{alreadyKnown ? "確認済みの情報です" : action.description}</span></div><em>{used ? "実行済み" : "Action ×1"}</em></button>; })}</div></div><aside><h2>判断材料</h2><div className="stateful-info-list">{scenario.information.map((info) => informationSet.has(info.id) ? <div key={info.id} className="unlocked"><strong>✓ {info.label}</strong><span>{difficulty === "challenge" ? info.source : info.detail}</span></div> : <div key={info.id}><strong>🔒 未判明</strong><span>{difficulty === "guided" ? info.source : "適切な確認で判明します"}</span></div>)}</div></aside></div><div className="stateful-decision-entry"><div><strong>このターンの判断へ進む</strong><span>{actionsLeft > 1 ? `あと${actionsLeft - 1}回、情報収集にActionを使えます。` : "残り1 Actionは判断に使用します。"}{hiddenDecisionCount > 0 && " 情報を得ると新しい選択肢が現れる場合があります。"}</span></div><button onClick={() => setSelectedDecision(visibleDecisions[0])}>判断案を見る →</button></div><button className="v2-text-button" onClick={() => setPhase("situation")}>← 状況を読み直す</button></section>}

      {phase === "action-result" && lastActionResult && <section className="stateful-result"><p className="v2-kicker">ACTION RESULT</p><h1>{lastActionResult.action.title}</h1><article><span>WHAT HAPPENED</span><p>{lastActionResult.action.result}</p></article>{lastActionResult.unlocked.length > 0 && <article className="stateful-unlock"><span>NEW INFORMATION</span>{lastActionResult.unlocked.map((id) => { const info = scenario.information.find((item) => item.id === id)!; return <div key={id}><b>🔓 {info.label}</b><p>{info.detail}</p></div>})}</article>}<div className="stateful-result-actions"><button className="v2-secondary" onClick={() => setPhase("action")}>次の行動を選ぶ</button><button className="primary" onClick={() => setSelectedDecision(visibleDecisions[0])}>このターンの判断へ</button></div></section>}

      {selectedAction && <AccessibleModal onClose={() => setSelectedAction(undefined)} labelledBy="stateful-action-title" className="v2-choice-modal"><button className="v2-modal-close" onClick={() => setSelectedAction(undefined)} aria-label="閉じる">×</button><p className="v2-kicker">ACTION CHECK</p><h2 id="stateful-action-title">{selectedAction.title}</h2><p>{selectedAction.description}</p><div><span>この行動の狙い</span><p>意思決定に必要な情報を増やします。プロジェクトの問題そのものが自動で解決するわけではありません。</p></div><p className="v2-decision-note">残りAction {actionsLeft} → {actionsLeft - 1}</p><div className="v2-modal-actions"><button className="v2-secondary" onClick={() => setSelectedAction(undefined)}>戻る</button><button className="primary" onClick={executeAction}>この行動を実行</button></div></AccessibleModal>}

      {selectedDecision && <AccessibleModal onClose={() => setSelectedDecision(undefined)} labelledBy="stateful-decision-title" className="stateful-decision-modal"><button className="v2-modal-close" onClick={() => setSelectedDecision(undefined)} aria-label="閉じる">×</button><p className="v2-kicker">TURN DECISION</p><h2 id="stateful-decision-title">PMとして、どう判断しますか？</h2><p>{turn.thinkingPoint}</p><div className="stateful-decision-options">{visibleDecisions.map((decision) => { const selected = selectedDecision.id === decision.id; return <button key={decision.id} className={selected ? "selected" : ""} onClick={() => setSelectedDecision(decision)}><strong>{decision.title}{decision.irreversible && <em>正式な判断</em>}</strong><span>{difficulty === "challenge" ? "この判断を選択肢として検討します。" : decision.description}</span></button>})}</div><div className="stateful-selected-decision"><span>選択中</span><strong>{selectedDecision.title}</strong><p>{selectedDecision.description}</p><small>残りAction {actionsLeft} → {actionsLeft - 1}</small></div><div className="v2-modal-actions"><button className="v2-secondary" onClick={() => setSelectedDecision(undefined)}>戻る</button><button className="primary" onClick={executeDecision}>この判断を確定する</button></div></AccessibleModal>}

      {phase === "decision-result" && lastDecision && <section className="stateful-result decision"><p className="v2-kicker">TURN {turnIndex + 1} RESULT</p><h1>{lastDecision.title}</h1><div className="stateful-result-grid"><article><span>WHAT HAPPENED</span><p>{lastDecision.whatHappened}</p></article><article><span>WHY</span><p>{lastDecision.why}</p></article><article className="stateful-change"><span>PROJECT CHANGE</span>{(Object.keys(lastDecision.after) as Array<keyof SimulationMetrics>).map((key) => { const delta = lastDecision.after[key] - lastDecision.before[key]; return delta ? <div key={key}><b>{metricLabels[key]}</b><strong>{status(key, lastDecision.before[key])} → {status(key, lastDecision.after[key])}</strong><em>{isFavorable(key, delta) ? "↑" : "↓"}</em></div> : null })}</article><article className="v2-pm-point"><span>PM POINT</span><p>{lastDecision.pmPoint}</p></article></div><button className="primary large" onClick={advanceTurn}>{turnIndex === scenario.turns.length - 1 ? "一連の判断を振り返る" : "次の状況へ"} <span>→</span></button></section>}
    </main>
  );
}
