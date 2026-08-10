import type { ReactNode } from "react";
import type { PMActionDefinition } from "../data/actions";
import type { MetricChange, Metrics } from "../types/game";
import { ActionGrid } from "./ActionGrid";
import { ProjectMetrics } from "./ProjectMetrics";

export function DecisionStep({ title, unknownCount, actionsLeft, metrics, changes, actions, usedIds, disabled, scenarioDecision, footerMessage, canAdvance, finalTurn, onViewSituation, onSelectAction, onAdvance }: { title: string; unknownCount: number; actionsLeft: number; metrics: Metrics; changes: MetricChange[]; actions: PMActionDefinition[]; usedIds: PMActionDefinition["id"][]; disabled: boolean; scenarioDecision?: ReactNode; footerMessage: string; canAdvance: boolean; finalTurn: boolean; onViewSituation: () => void; onSelectAction: (action: PMActionDefinition) => void; onAdvance: () => void }) {
  return <section className="step-stage decision-step">
    <div className="decision-step-inner">
      <header className="decision-context"><div><span>現在の状況</span><strong>{title}</strong><small>未判明情報：{unknownCount}件</small></div><button type="button" onClick={onViewSituation}>状況を確認</button></header>
      <ProjectMetrics metrics={metrics} changes={changes} />
      <div className="decision-title"><div><p className="step-kicker">YOUR DECISION</p><h1>PMとして、次に何をしますか？</h1></div><div className="single-action-budget"><strong>{actionsLeft}</strong><span>ACTIONS<br />LEFT</span></div></div>
      {scenarioDecision}
      <ActionGrid actions={actions} usedIds={usedIds} disabled={disabled} onSelect={onSelectAction} />
      <footer className="decision-footer"><p>{footerMessage}</p><button className="next-situation-button" disabled={!canAdvance} onClick={onAdvance}>{finalTurn ? "プロジェクト結果を見る" : "次の状況へ進む"} <span>→</span></button></footer>
    </div>
  </section>;
}
