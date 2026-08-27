import type { ReactNode } from "react";
import { modeThemes, type SimulatorMode } from "../data/modeThemes";
import { pmStyleLabels } from "../data/uiLabels";

export type FinalMetric = {
  label: string;
  value: number;
  status: string;
};

export type OutcomeSummaryItem = {
  label: string;
  status: string;
  value?: number;
  tone?: "positive" | "neutral" | "warning" | "negative";
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
  if (score >= 85) return "優秀";
  if (score >= 70) return "良好";
  if (score >= 55) return "バランス";
  return "学びあり";
}

export function OutcomeSummary({ items }: { items: OutcomeSummaryItem[] }) {
  return <section className="final-outcome-summary" aria-label="プロジェクト評価サマリー">
    <p>結果サマリー</p>
    <div>{items.map(item => <article key={item.label} className={`tone-${item.tone ?? "neutral"}`}><span>{item.label}</span><strong>{item.status}</strong>{item.value !== undefined ? <small>{item.value}</small> : null}</article>)}</div>
  </section>;
}

export function FinalResultFramework({ mode, title, score, previousScore, style, summary, outcomeSummary, metrics, breakdown, children, actions }: {
  mode: SimulatorMode;
  title: string;
  score: number;
  previousScore?: number;
  style?: PMStyle;
  summary: string;
  outcomeSummary: OutcomeSummaryItem[];
  metrics: FinalMetric[];
  breakdown: ScoreBreakdownItem[];
  children: ReactNode;
  actions: ReactNode;
}) {
  const theme = modeThemes[mode];
  return <main className="final-result-framework">
    <header className="final-result-topbar"><div><strong>PROJECT: FIRST LIGHT</strong><span className="mode-badge">{theme.label}</span></div></header>
    <section className="final-result-hero">
      <div className="final-result-score"><span>総合スコア</span><strong>{score}</strong><small>/ 100</small><b>{scoreBand(score)}</b>{previousScore !== undefined ? <em>前回 {previousScore} → 今回 {score}</em> : null}</div>
      <div className="final-result-verdict"><p>プロジェクト結果</p><h1>{title}</h1><OutcomeSummary items={outcomeSummary} />{style ? <div className="final-style"><span>あなたの判断スタイル</span><strong>{pmStyleLabels[style.code]}</strong><p>{style.description}</p></div> : null}<p className="final-result-summary">{summary}</p></div>
    </section>
    <section className="final-result-metrics" aria-label="最終プロジェクト状態">{metrics.map(metric => <article key={metric.label}><span>{metric.label}</span><strong>{metric.status}</strong><small>{metric.value}</small><i style={{ width: `${metric.value}%` }} /></article>)}</section>
    <section className="final-score-breakdown"><header><p>スコアの内訳</p><h2>今回の運営を構成した観点</h2></header><div>{breakdown.map(item => <article key={item.label}><span>{item.label}{item.weight ? <small>{item.weight}</small> : null}</span><strong>{item.score}</strong><i><b style={{ width: `${item.score}%` }} /></i></article>)}</div></section>
    <div className="final-result-body">{children}</div>
    <footer className="final-result-actions">{actions}</footer>
  </main>;
}

export function FinalResultSection({ eyebrow, title, children, className = "" }: { eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return <section className={`final-result-section ${className}`}><header><p>{eyebrow}</p><h2>{title}</h2></header>{children}</section>;
}
