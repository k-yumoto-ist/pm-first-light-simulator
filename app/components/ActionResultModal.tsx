"use client";

import { useEffect, useRef } from "react";
import type { ActionResult, Metrics } from "../types/game";

const metricLabels: Record<keyof Metrics, string> = {
  schedule: "Schedule", quality: "Quality", trust: "Customer Trust", team: "Team Condition",
  scopeStability: "Scope Clarity", riskExposure: "Risk Exposure", stakeholderAlignment: "Stakeholder Alignment",
};

export function ActionResultModal({ result, onClose }: { result: ActionResult; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return <div className="result-overlay" role="presentation"><section ref={dialogRef} className="action-result-modal" role="dialog" aria-modal="true" aria-labelledby="action-result-title">
    <header><div><span>ACTION RESULT</span><h2 id="action-result-title">判断の結果を確認する</h2></div><span className="result-complete">完了</span></header>
    <div className="judgment-summary"><span>あなたの判断</span><strong>{result.title}</strong></div>
    <div className="occurred"><span>起きたこと</span><p>{result.occurred}</p></div>
    <div className="impact-section"><h3>プロジェクトへの影響</h3>{result.changes.length > 0 ? <div className="change-grid">{result.changes.map(change => {
      const raw = change.after - change.before;
      const beneficial = change.key === "riskExposure" ? raw < 0 : raw > 0;
      return <article key={change.key} className={beneficial ? "change-positive" : "change-negative"}><span>{metricLabels[change.key]}</span><div><b>{change.before}</b><i>→</i><strong>{change.after}</strong></div><small>{raw > 0 ? `+${raw}` : raw} {beneficial ? "改善" : "注意"}</small></article>;
    })}</div> : <p className="information-gained">新しい情報を獲得しました。数値には表れなくても、後の判断材料になります。</p>}</div>
    <div className="causal-explanation"><span>なぜこうなった？</span><p>{result.why}</p></div>
    <aside className="learning-panel"><span>PMBOK LEARNING</span><p>{result.learning}</p></aside>
    <footer><button ref={closeRef} className="primary" onClick={onClose}>結果を理解して続ける <span>→</span></button></footer>
  </section></div>;
}
