import type { ReactNode } from "react";
import type { PMActionDefinition } from "../data/actions";
import type { MetricChange, Metrics } from "../types/game";
import { ActionGrid } from "./ActionGrid";
import { ProjectMetrics } from "./ProjectMetrics";

export function SimulatorCockpit({
  title,
  contextMeta,
  contextBody,
  onViewSituation,
  metrics,
  changes,
  kicker = "YOUR DECISION",
  prompt = "PMとして、次に何をしますか？",
  budget,
  scenarioDecision,
  actions,
  usedIds,
  usageCounts,
  disabled,
  onSelectAction,
  sideContent,
  footerMessage,
  advanceLabel,
  canAdvance,
  onAdvance,
}: {
  title: string;
  contextMeta?: ReactNode;
  contextBody?: ReactNode;
  onViewSituation?: () => void;
  metrics: Metrics;
  changes: MetricChange[];
  kicker?: string;
  prompt?: string;
  budget: ReactNode;
  scenarioDecision?: ReactNode;
  actions: PMActionDefinition[];
  usedIds: PMActionDefinition["id"][];
  usageCounts?: Partial<Record<PMActionDefinition["id"], number>>;
  disabled: boolean;
  onSelectAction: (action: PMActionDefinition) => void;
  sideContent?: ReactNode;
  footerMessage: string;
  advanceLabel: string;
  canAdvance: boolean;
  onAdvance: () => void;
}) {
  const actionGrid = <ActionGrid actions={actions} usedIds={usedIds} usageCounts={usageCounts} disabled={disabled} onSelect={onSelectAction} />;
  return <section className={`step-stage decision-step simulator-cockpit ${sideContent ? "has-side-content" : ""}`}>
    <div className="decision-step-inner">
      <header className="decision-context"><div><span>現在の状況</span><strong>{title}</strong>{contextMeta}</div>{onViewSituation ? <button type="button" onClick={onViewSituation}>状況を確認</button> : null}</header>
      {contextBody ? <div className="cockpit-situation-summary">{contextBody}</div> : null}
      <ProjectMetrics metrics={metrics} changes={changes} />
      <div className="decision-title"><div><p className="step-kicker">{kicker}</p><h1>{prompt}</h1></div>{budget}</div>
      {scenarioDecision}
      {sideContent ? <div className="canonical-cockpit-grid"><div className="canonical-action-area">{actionGrid}</div><aside className="canonical-cockpit-side">{sideContent}</aside></div> : actionGrid}
      <footer className="decision-footer"><p>{footerMessage}</p><button className="next-situation-button" disabled={!canAdvance} onClick={onAdvance}>{advanceLabel} <span>→</span></button></footer>
    </div>
  </section>;
}
