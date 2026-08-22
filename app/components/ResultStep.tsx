"use client";

import { useEffect, useRef } from "react";
import type { ActionResult, Metrics } from "../types/game";
import { AccessibleDialog } from "./AccessibleDialog";

const metricLabels: Record<keyof Metrics, string> = {
  schedule: "Schedule", quality: "Quality", trust: "Customer Trust", team: "Team Condition",
  scopeStability: "Scope Clarity", riskExposure: "Risk Exposure", stakeholderAlignment: "Stakeholder Alignment",
};

function ResultContent({ result, onNext, nextLabel, nextRef }: { result: ActionResult; onNext: () => void; nextLabel: string; nextRef: React.RefObject<HTMLButtonElement | null> }) {
  return <div className="result-step-inner">
    <header><p className="step-kicker">ACTION RESULT</p><h1 id="action-result-title">{result.title}</h1><span>実行しました</span></header>
    <div className="result-story-grid">
      <section className="result-occurred"><span>何が分かったか・起きたか</span><p>{result.occurred}</p></section>
      <section className={"result-unlock-reward " + (result.unlocked.length ? "has-reward" : "")}><span>新しく判明した重要情報</span>{result.unlocked.length ? <ul>{result.unlocked.map(item => { const [label, ...value] = item.split("："); return <li key={item}><b>UNLOCKED</b><div><strong>{label}</strong><small>{value.join("：")}</small></div></li>; })}</ul> : <p>今回、新しい重要情報のアンロックはありませんでした。</p>}</section>
      <section className="result-metric-changes"><span>今回変化した指標</span>{result.changes.length ? <div>{result.changes.map(change => { const raw = change.after - change.before; const beneficial = change.key === "riskExposure" ? raw < 0 : raw > 0; return <article key={change.key} className={beneficial ? "is-positive" : "is-negative"}><span>{metricLabels[change.key]}</span><div><b>{change.before}</b><i>→</i><strong>{change.after}</strong><em>{raw > 0 ? `+${raw}` : raw}</em></div></article>; })}</div> : <p>数値に変化はありません。判断に使える情報を獲得しました。</p>}</section>
      <section className="result-pm-point"><span>PM POINT — なぜこの結果になった？</span><p>{result.why}</p></section>
    </div>
    <aside className="result-learning"><span>PMBOK LEARNING</span><p>{result.learning}</p></aside>
    <footer><button ref={nextRef} className="primary" onClick={onNext}>{nextLabel} <span>→</span></button></footer>
  </div>;
}

export function ResultStep({ result, onNext, presentation = "page", nextLabel = "次の判断へ" }: { result: ActionResult; onNext: () => void; presentation?: "page" | "dialog"; nextLabel?: string }) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (presentation === "page") nextRef.current?.focus(); }, [presentation]);
  if (presentation === "dialog") return <AccessibleDialog onClose={onNext} labelledBy="action-result-title" overlayClassName="canonical-result-overlay" dialogClassName="canonical-result-dialog"><ResultContent result={result} onNext={onNext} nextLabel={nextLabel} nextRef={nextRef} /></AccessibleDialog>;
  return <section className="step-stage result-step"><ResultContent result={result} onNext={onNext} nextLabel={nextLabel} nextRef={nextRef} /></section>;
}
