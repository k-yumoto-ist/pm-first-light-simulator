import type { ReactNode } from "react";
import { modeThemes, type SimulatorMode } from "../data/modeThemes";

export type FinalMetric = {
  label: string;
  value: number;
  status: string;
};

export type ScoreBreakdownItem = {
  label: string;
  score: number;
  weight?: string;
};

export type PMStyle = {
  code: "VALUE BALANCER" | "DELIVERY FIRST" | "RISK CONTROLLER" | "CONSENSUS BUILDER" | "TEAM PROTECTOR";
  description: string;
};

export function scoreBand(score: number) {
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 55) return "BALANCED";
  return "LEARNING";
}

export function FinalResultFramework({ mode, title, score, previousScore, style, summary, metrics, breakdown, children, actions }: {
  mode: SimulatorMode;
  title: string;
  score: number;
  previousScore?: number;
  style: PMStyle;
  summary: string;
  metrics: FinalMetric[];
  breakdown: ScoreBreakdownItem[];
  children: ReactNode;
  actions: ReactNode;
}) {
  const theme = modeThemes[mode];
  return <main className="final-result-framework">
    <header className="final-result-topbar"><div><strong>PROJECT: FIRST LIGHT</strong><span className="mode-badge">{theme.label}</span></div></header>
    <section className="final-result-hero">
      <div className="final-result-score"><span>PROJECT SCORE</span><strong>{score}</strong><small>/ 100</small><b>{scoreBand(score)}</b>{previousScore !== undefined ? <em>前回 {previousScore} → 今回 {score}</em> : null}</div>
      <div className="final-result-verdict"><p>PROJECT RESULT</p><h1>{title}</h1><div className="final-style"><span>YOUR PM STYLE</span><strong>{style.code}</strong><p>{style.description}</p></div><p className="final-result-summary">{summary}</p></div>
    </section>
    <section className="final-result-metrics" aria-label="最終プロジェクト状態">{metrics.map(metric => <article key={metric.label}><span>{metric.label}</span><strong>{metric.status}</strong><small>{metric.value}</small><i style={{ width: `${metric.value}%` }} /></article>)}</section>
    <section className="final-score-breakdown"><header><p>HOW THE SCORE WAS FORMED</p><h2>今回の運営を構成した観点</h2></header><div>{breakdown.map(item => <article key={item.label}><span>{item.label}{item.weight ? <small>{item.weight}</small> : null}</span><strong>{item.score}</strong><i><b style={{ width: `${item.score}%` }} /></i></article>)}</div></section>
    <div className="final-result-body">{children}</div>
    <footer className="final-result-actions">{actions}</footer>
  </main>;
}

export function FinalResultSection({ eyebrow, title, children, className = "" }: { eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return <section className={`final-result-section ${className}`}><header><p>{eyebrow}</p><h2>{title}</h2></header>{children}</section>;
}
