"use client";

import { useState } from "react";
import type { ActionLog, Metrics } from "../types/game";
import { metricLabels } from "../data/uiLabels";

const shortLabels: Record<keyof Metrics, string> = { ...metricLabels, scopeStability: metricLabels.scopeStability, riskExposure: metricLabels.riskExposure, stakeholderAlignment: metricLabels.stakeholderAlignment };

export function ProjectLog({ logs, compact = false, initialLimit }: { logs: ActionLog[]; compact?: boolean; initialLimit?: number }) {
  const [showAll, setShowAll] = useState(false);
  const orderedLogs = [...logs].reverse();
  const displayLimit = initialLimit ?? (compact ? undefined : 3);
  const visibleLogs = displayLimit && !showAll ? orderedLogs.slice(0, displayLimit) : orderedLogs;
  const hiddenCount = Math.max(0, orderedLogs.length - visibleLogs.length);

  return <section className={`project-log ${compact ? "compact-log" : ""}`}><header><div><span>プロジェクトログ</span><h2>判断と結果の記録</h2></div><small>{logs.length}件の記録</small></header>
    {logs.length === 0 ? <div className="empty-log"><strong>まだ記録はありません</strong><p>最初のアクションを実行すると、出来事・判断・結果がここに残ります。</p></div> : <>
      <div className="log-timeline">{visibleLogs.map(log => <article key={log.id} className={`log-entry log-${log.kind}`}><div className="log-time"><strong>{log.day}日目</strong><span>ターン {log.turn}</span></div><div className="log-story"><div className="log-event"><span>出来事</span><p>{log.event}</p></div><div className="log-action"><span>{log.kind === "event" ? "影響" : "あなたの判断"}</span><strong>{log.label}</strong><p>{log.detail}</p></div><div className="log-result"><span>結果</span><p>{log.result}</p><div>{log.changes.map(change => { const delta = change.after - change.before; const beneficial = change.key === "riskExposure" ? delta < 0 : delta > 0; return <b className={beneficial ? "log-improve" : "log-decline"} key={change.key}>{shortLabels[change.key]} {delta > 0 ? `+${delta}` : delta}</b>; })}</div></div></div></article>)}</div>
      {hiddenCount > 0 && <footer className="log-expand"><button type="button" onClick={() => setShowAll(true)}>すべての判断を見る（残り {hiddenCount} 件）</button></footer>}
    </>}
  </section>;
}
