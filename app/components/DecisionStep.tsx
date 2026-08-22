import type { ReactNode } from "react";
import type { PMActionDefinition } from "../data/actions";
import type { MetricChange, Metrics } from "../types/game";
import { SimulatorCockpit } from "./SimulatorCockpit";

export function DecisionStep({ title, unknownCount, actionsLeft, metrics, changes, actions, usedIds, disabled, scenarioDecision, footerMessage, canAdvance, finalTurn, onViewSituation, onSelectAction, onAdvance }: { title: string; unknownCount: number; actionsLeft: number; metrics: Metrics; changes: MetricChange[]; actions: PMActionDefinition[]; usedIds: PMActionDefinition["id"][]; disabled: boolean; scenarioDecision?: ReactNode; footerMessage: string; canAdvance: boolean; finalTurn: boolean; onViewSituation: () => void; onSelectAction: (action: PMActionDefinition) => void; onAdvance: () => void }) {
  return <SimulatorCockpit title={title} contextMeta={<small>未判明情報：{unknownCount}件</small>} onViewSituation={onViewSituation} metrics={metrics} changes={changes} budget={<div className="single-action-budget"><strong>{actionsLeft}</strong><span>ACTIONS<br />LEFT</span></div>} scenarioDecision={scenarioDecision} actions={actions} usedIds={usedIds} disabled={disabled} onSelectAction={onSelectAction} footerMessage={footerMessage} advanceLabel={finalTurn ? "プロジェクト結果を見る" : "次の状況へ進む"} canAdvance={canAdvance} onAdvance={onAdvance} />;
}
