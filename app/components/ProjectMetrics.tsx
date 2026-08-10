import type { MetricChange, Metrics } from "../types/game";

const labels: { key: keyof Pick<Metrics, "schedule" | "quality" | "trust" | "team" | "riskExposure">; label: string; inverse?: boolean }[] = [
  { key: "schedule", label: "Schedule" }, { key: "quality", label: "Quality" }, { key: "trust", label: "Customer Trust" }, { key: "team", label: "Team Condition" }, { key: "riskExposure", label: "Risk Exposure", inverse: true },
];

const statusFor = (value: number) => value >= 78 ? "順調" : value >= 60 ? "注意" : value >= 42 ? "遅延" : "危険";
const riskStatus = (value: number) => value <= 30 ? "低" : value <= 58 ? "中" : "高";

export function ProjectMetrics({ metrics, changes }: { metrics: Metrics; changes: MetricChange[] }) {
  return <section className="project-metrics" aria-label="プロジェクト状態">{labels.map(item => { const value = metrics[item.key]; const change = changes.find(entry => entry.key === item.key); const raw = change ? change.after - change.before : 0; const beneficial = item.inverse ? raw < 0 : raw > 0; return <article key={item.key} className={`metric-compact ${change ? "metric-changed" : ""} ${change && beneficial ? "metric-improved" : ""}`}><div><span>{item.label}</span><strong className={`status status-${item.inverse ? riskStatus(value) : statusFor(value)}`}>{item.inverse ? riskStatus(value) : statusFor(value)}</strong></div>{change ? <div className="metric-delta"><b>{change.before}</b><i>→</i><strong>{change.after}</strong><small>{raw > 0 ? `+${raw}` : raw}</small></div> : <div className="metric-track"><i style={{ width: `${item.inverse ? 100 - value : value}%` }} /></div>}</article>; })}</section>;
}
