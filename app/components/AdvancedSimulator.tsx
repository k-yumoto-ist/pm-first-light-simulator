"use client";

import { useMemo, useState } from "react";
import { scenarioById } from "@/src/data/scenarios";
import { pmbokDomains } from "@/src/data/pmbokDomains";
import { pmBehaviorStandards } from "@/src/data/pmBehaviorStandards";
import type { BehaviorStandardEvidence, Difficulty, HiddenState, ProjectState, ScenarioChoice } from "@/src/data/types";
import type { ScenarioMode } from "@/src/data/statefulScenarioTypes";
import { scopeChangeSimulation } from "@/src/data/scenarios/scope-change-simulation";
import StatefulScenarioRunner from "./StatefulScenarioRunner";

type Phase = "briefing" | "situation" | "decision" | "result" | "final";

type DecisionRecord = {
  eventTitle: string;
  choiceTitle: string;
  feedback: ScenarioChoice["feedback"];
  before: ProjectState;
  after: ProjectState;
  evidence: BehaviorStandardEvidence[];
  consequence?: string;
};

const metricLabels: Record<keyof ProjectState, string> = {
  schedule: "Schedule", budget: "Budget", quality: "Quality", trust: "Trust",
  teamHealth: "Team Health", businessValue: "Business Value", riskExposure: "Risk Exposure",
};

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function applyState<T extends ProjectState | HiddenState>(current: T, effects: Partial<T>): T {
  const next = { ...current } as T;
  for (const key of Object.keys(effects) as Array<keyof T>) {
    const value = effects[key];
    if (typeof value === "number" && typeof current[key] === "number") {
      next[key] = clamp((current[key] as number) + value) as T[keyof T];
    } else if (value !== undefined) next[key] = value as T[keyof T];
  }
  return next;
}

function metricStatus(key: keyof ProjectState, value: number) {
  const effective = key === "riskExposure" ? 100 - value : value;
  if (effective >= 72) return "Stable";
  if (effective >= 52) return "Caution";
  if (effective >= 32) return "Warning";
  return "Critical";
}

function changeSymbol(key: keyof ProjectState, delta: number) {
  if (!delta) return "→";
  const favorable = key === "riskExposure" ? delta < 0 : delta > 0;
  return favorable ? "↑" : "↓";
}

export default function AdvancedSimulator({ scenarioId, difficulty, mode, onExit }: { scenarioId: string; difficulty: Difficulty; mode: ScenarioMode; onExit: () => void }) {
  if (mode === "project" && scenarioId === "scope-change") {
    return <div className="mode-simulator mode-project"><StatefulScenarioRunner scenario={scopeChangeSimulation} difficulty={difficulty} onExit={onExit} /></div>;
  }
  return <div className={`mode-simulator mode-${mode}`}><LegacyAdvancedSimulator scenarioId={scenarioId} difficulty={difficulty} onExit={onExit} /></div>;
}

function LegacyAdvancedSimulator({ scenarioId, difficulty, onExit }: { scenarioId: string; difficulty: Difficulty; onExit: () => void }) {
  const scenario = scenarioById[scenarioId];
  const [phase, setPhase] = useState<Phase>("briefing");
  const [eventIndex, setEventIndex] = useState(0);
  const [project, setProject] = useState<ProjectState>(scenario.initialState);
  const [hidden, setHidden] = useState<HiddenState>(scenario.initialHiddenState);
  const [selected, setSelected] = useState<ScenarioChoice>();
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const event = scenario.events[eventIndex];
  const record = records.at(-1);

  const visibleMetrics = useMemo(() => Object.entries(project) as Array<[keyof ProjectState, number]>, [project]);

  const execute = () => {
    if (!selected) return;
    const afterChoice = applyState(project, selected.effects);
    const hiddenAfterChoice = applyState(hidden, selected.hiddenEffects);
    const consequence = scenario.resolveConsequence?.(hiddenAfterChoice, eventIndex) ?? null;
    const after = consequence ? applyState(afterChoice, consequence.effects) : afterChoice;
    const nextHidden = consequence?.hiddenEffects ? applyState(hiddenAfterChoice, consequence.hiddenEffects) : hiddenAfterChoice;
    setProject(after);
    setHidden(nextHidden);
    setRecords((current) => [...current, {
      eventTitle: event.title,
      choiceTitle: selected.title,
      feedback: selected.feedback,
      before: project,
      after,
      evidence: selected.behaviorEvidence,
      consequence: consequence?.whatHappened,
    }]);
    setSelected(undefined);
    setPhase("result");
  };

  const continueAfterResult = () => {
    if (eventIndex >= scenario.events.length - 1) setPhase("final");
    else { setEventIndex((value) => value + 1); setPhase("situation"); }
  };

  if (phase === "final") {
    const evidence = records.flatMap((item) => item.evidence);
    const evidenceWeights = new Map<string, number>();
    evidence.forEach((item) => evidenceWeights.set(item.behavior, (evidenceWeights.get(item.behavior) ?? 0) + item.weight));
    const seen = [...evidenceWeights.entries()].sort((a, b) => b[1] - a[1]);
    const seenTags = new Set(seen.map(([tag]) => tag));
    const nextTags = scenario.opportunityBehaviorTags.filter((tag) => !seenTags.has(tag)).slice(0, 4);
    const otherDomains = (Object.keys(pmbokDomains) as Array<keyof typeof pmbokDomains>)
      .filter((domain) => domain !== scenario.primaryDomain && !scenario.relatedDomains.includes(domain));

    return (
      <main className="v2-report-shell">
        <header className="v2-sim-header"><div><strong>PROJECT: FIRST LIGHT</strong><span>PLAY REVIEW</span></div><button onClick={onExit}>MODE SELECT</button></header>
        <article className="v2-report">
          <p className="v2-kicker">PROJECT RESULT</p>
          <h1>{scenario.title} — プロジェクトの着地点</h1>
          <p className="v2-report-intro">点数ではなく、あなたの判断がプロジェクトへ残した変化を振り返ります。</p>
          <div className="v2-final-metrics">
            {visibleMetrics.map(([key, value]) => <div key={key}><span>{metricLabels[key]}</span><strong>{metricStatus(key, value)}</strong><i style={{ width: `${value}%` }} /></div>)}
          </div>

          <section className="v2-report-section">
            <p className="v2-kicker">YOUR DECISIONS</p><h2>あなたが選んだ判断</h2>
            <div className="v2-decision-timeline">{records.map((item, index) => <article key={`${item.eventTitle}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b><div><span>{item.eventTitle}</span><h3>{item.choiceTitle}</h3><p>{item.feedback.whatHappened}</p>{item.consequence && <small>{item.consequence}</small>}</div></article>)}</div>
          </section>

          <section className="v2-report-section v2-pmbok-review">
            <p className="v2-kicker">PMBOK REVIEW</p><h2>今回、判断する機会があった領域</h2>
            {[scenario.primaryDomain, ...scenario.relatedDomains].map((domain) => <div key={domain}><strong>{pmbokDomains[domain].label}</strong><p>{pmbokDomains[domain].description}</p></div>)}
          </section>

          <section className="v2-report-section v2-style-review">
            <p className="v2-kicker">YOUR PM STYLE</p><h2>今回のプレイで見られたPM行動</h2>
            <div className="v2-style-columns">
              <div><h3>今回見られた行動</h3><ul>{seen.length ? seen.map(([tag, weight]) => <li key={tag}><strong>{pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].label}</strong><span>{weight > 1 ? "複数の判断で確認されました" : pmBehaviorStandards[tag as keyof typeof pmBehaviorStandards].actions[0]}</span></li>) : <li><span>今回の選択から明確に確認できる行動はありませんでした。</span></li>}</ul></div>
              <div><h3>さらに試したい行動</h3><ul>{nextTags.length ? nextTags.map((tag) => <li key={tag}><strong>{pmBehaviorStandards[tag].label}</strong><span>{pmBehaviorStandards[tag].actions[0]}</span></li>) : <li><span>別の選択肢も試し、結果の違いを確かめてみましょう。</span></li>}</ul></div>
            </div>
            <p className="v2-not-observed">{otherDomains.map((domain) => pmbokDomains[domain].label).join(" / ")} は、今回のシナリオでは確認する機会がありませんでした。</p>
          </section>
          <div className="v2-report-actions"><button className="v2-secondary" onClick={onExit}>別のシナリオを選ぶ</button><button className="primary" onClick={() => window.location.reload()}>LIGHT MODEへ戻る</button></div>
        </article>
      </main>
    );
  }

  return (
    <main className="v2-sim-shell">
      <header className="v2-sim-header">
        <div><strong>PROJECT: FIRST LIGHT</strong><span>{scenario.title}</span></div>
        <nav aria-label="進行状況"><i className={phase === "briefing" || phase === "situation" ? "active" : "done"}>1 状況</i><i className={phase === "decision" ? "active" : phase === "result" ? "done" : ""}>2 判断</i><i className={phase === "result" ? "active" : ""}>3 結果</i></nav>
        <button onClick={onExit}>終了</button>
      </header>

      {(phase === "briefing" || phase === "situation") && (
        <section className="v2-situation-view">
          <div className="v2-turn-label">{phase === "briefing" ? "PROJECT BRIEFING" : `SITUATION ${eventIndex + 1} / ${scenario.events.length}`}</div>
          <h1>{phase === "briefing" ? scenario.title : event.title}</h1>
          <p className="v2-situation-copy">{phase === "briefing" ? scenario.briefing.context : event.situation}</p>
          <div className="v2-situation-grid">
            <div><span>PMとして目指すこと</span><p>{phase === "briefing" ? scenario.briefing.objective : event.decisionPrompt}</p></div>
            <div><span>まだ確かめたいこと</span><ul>{scenario.briefing.initialUnknowns.map((item) => <li key={item}>🔒 {difficulty === "challenge" && phase !== "briefing" ? "情報が不足しています" : item}</li>)}</ul></div>
          </div>
          <button className="primary large" onClick={() => setPhase(phase === "briefing" ? "situation" : "decision")}>{phase === "briefing" ? "案件を引き受ける" : "PMとして判断する"}<span>→</span></button>
        </section>
      )}

      {phase === "decision" && (
        <section className="v2-decision-view">
          <div className="v2-decision-top"><div><p className="v2-kicker">PLAYER DECISION</p><h1>PMとして、どう判断しますか？</h1><span>{event.title}</span></div><div className="v2-compact-metrics">{visibleMetrics.slice(0, 5).map(([key, value]) => <span key={key}>{metricLabels[key]} <b>{metricStatus(key, value)}</b></span>)}</div></div>
          {difficulty === "guided" && <aside className="v2-guidance"><strong>見るべきポイント</strong><p>{event.decisionPrompt} その場の解決だけでなく、後続への影響も考えてみましょう。</p></aside>}
          <div className="v2-choice-grid">{event.choices.map((choice, index) => <button key={choice.id} onClick={() => setSelected(choice)}><span>{String(index + 1).padStart(2, "0")}</span><h2>{choice.title}</h2>{difficulty !== "challenge" && <p>{choice.description}</p>}<b>詳しく確認 →</b></button>)}</div>
          <button className="v2-text-button" onClick={() => setPhase("situation")}>← 状況を読み直す</button>
        </section>
      )}

      {selected && (
        <div className="v2-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSelected(undefined)}>
          <section className="v2-choice-modal" role="dialog" aria-modal="true" aria-labelledby="choice-title">
            <button className="v2-modal-close" aria-label="閉じる" onClick={() => setSelected(undefined)}>×</button>
            <p className="v2-kicker">DECISION CHECK</p><h2 id="choice-title">{selected.title}</h2><p>{selected.description}</p>
            <div><span>この判断で重視すること</span><p>{difficulty === "guided" ? selected.feedback.pmPoint : "状況に対する一つの判断として実行します。結果は実行後に確認できます。"}</p></div>
            {difficulty === "guided" && <div className="v2-direction-list"><span>想定される影響</span>{Object.entries(selected.effects).map(([key, delta]) => <b key={key}>{metricLabels[key as keyof ProjectState]} {changeSymbol(key as keyof ProjectState, delta as number)}</b>)}</div>}
            <p className="v2-decision-note">実行すると、この状況での判断が確定します。</p>
            <div className="v2-modal-actions"><button className="v2-secondary" onClick={() => setSelected(undefined)}>戻る</button><button className="primary" onClick={execute}>この判断を実行する</button></div>
          </section>
        </div>
      )}

      {phase === "result" && record && (
        <section className="v2-result-view">
          <p className="v2-kicker">ACTION RESULT</p><h1>{record.choiceTitle}</h1>
          <div className="v2-result-sections">
            <article><span>WHAT HAPPENED</span><p>{record.feedback.whatHappened}</p>{record.consequence && <small>{record.consequence}</small>}</article>
            <article><span>PROJECT CHANGE</span><div className="v2-change-grid">{(Object.keys(record.after) as Array<keyof ProjectState>).map((key) => { const delta = record.after[key] - record.before[key]; return delta !== 0 ? <div key={key}><b>{metricLabels[key]}</b><strong>{metricStatus(key, record.before[key])} <i>→</i> {metricStatus(key, record.after[key])}</strong><em>{changeSymbol(key, delta)}</em></div> : null; })}</div></article>
            <article><span>WHY</span><p>{record.feedback.why}</p></article>
            <article className="v2-pm-point"><span>PM POINT</span><p>{record.feedback.pmPoint}</p></article>
          </div>
          <button className="primary large" onClick={continueAfterResult}>{eventIndex >= scenario.events.length - 1 ? "プレイを振り返る" : "次の状況へ"}<span>→</span></button>
        </section>
      )}
    </main>
  );
}
