import type { MetricChange, Metrics } from "../types/game";
import { getMetricDisplayValue, getMetricStatusLabel, metricLabels } from "../data/uiLabels";

const labels: { key: keyof Pick<Metrics, "schedule" | "quality" | "trust" | "team" | "riskExposure">; label: string; inverse?: boolean }[] = [
  { key: "schedule", label: metricLabels.schedule }, { key: "quality", label: metricLabels.quality }, { key: "trust", label: metricLabels.trust }, { key: "team", label: metricLabels.team }, { key: "riskExposure", label: metricLabels.riskExposure, inverse: true },
];

export function ProjectMetrics({ metrics, changes }: { metrics: Metrics; changes: MetricChange[] }) {
  return <section className="project-metrics" aria-label="プロジェクト状態">{labels.map(item => { const value = metrics[item.key]; const status = getMetricStatusLabel(item.key, value); const change = changes.find(entry => entry.key === item.key); const raw = change ? change.after - change.before : 0; const beneficial = item.inverse ? raw < 0 : raw > 0; return <article key={item.key} className={`metric-compact ${change ? "metric-changed" : ""} ${change && beneficial ? "metric-improved" : ""}`}><div><span>{item.label}</span><strong className={`status status-${status}`}>{status}</strong></div>{change ? <div className="metric-delta"><b>{change.before}</b><i>→</i><strong>{change.after}</strong><small>{raw > 0 ? `+${raw}` : raw}</small></div> : <div className="metric-track"><i style={{ width: `${getMetricDisplayValue(item.key, value)}%` }} /></div>}</article>; })}</section>;
}
