"use client";

import { useState } from "react";
import type { ActionLog, Metrics } from "../types/game";

const shortLabels: Record<keyof Metrics, string> = { schedule: "Schedule", quality: "Quality", trust: "Trust", team: "Team", scopeStability: "Scope", riskExposure: "Risk", stakeholderAlignment: "Alignment" };

export function ProjectLog({ logs, compact = false, initialLimit }: { logs: ActionLog[]; compact?: boolean; initialLimit?: number }) {
  const [showAll, setShowAll] = useState(false);
  const orderedLogs = [...logs].reverse();
  const displayLimit = initialLimit ?? (compact ? undefined : 3);
  const visibleLogs = displayLimit && !showAll ? orderedLogs.slice(0, displayLimit) : orderedLogs;
  const hiddenCount = Math.max(0, orderedLogs.length - visibleLogs.length);

  return <section className={`project-log ${compact ? "compact-log" : ""}`}><header><div><span>PROJECT LOG</span><h2>判断と結果の記録</h2></div><small>{logs.length} ACTIONS</small></header>
    {logs.length === 0 ? <div className="empty-log"><strong>まだ記録はありません</strong><p>最初のアクションを実行すると、出来事・判断・結果がここに残ります。</p></div> : <>
      <div className="log-timeline">{visibleLogs.map(log => <article key={log.id} className={`log-entry log-${log.kind}`}><div className="log-time"><strong>DAY {log.day}</strong><span>TURN {log.turn}</span></div><div className="log-story"><div className="log-event"><span>出来事 / EVENT</span><p>{log.event}</p></div><div className="log-action"><span>{log.kind === "event" ? "影響 / CONSEQUENCE" : "あなたの判断 / PM ACTION"}</span><strong>{log.label}</strong><p>{log.detail}</p></div><div className="log-result"><span>結果 / RESULT</span><p>{log.result}</p><div>{log.changes.map(change => { const delta = change.after - change.before; const beneficial = change.key === "riskExposure" ? delta < 0 : delta > 0; return <b className={beneficial ? "log-improve" : "log-decline"} key={change.key}>{shortLabels[change.key]} {delta > 0 ? `+${delta}` : delta}</b>; })}</div></div></div></article>)}</div>
      {hiddenCount > 0 && <footer className="log-expand"><button type="button" onClick={() => setShowAll(true)}>すべての判断を見る（残り {hiddenCount} 件）</button></footer>}
    </>}
  </section>;
}
