import type { DecisionAnalysis, DecisionAnalysisSummary } from "../lib/decisionAnalysis";

function EffectList({ effects }: { effects: DecisionAnalysis["immediateEffects"] }) {
  if (!effects.length) return <span className="decision-effect neutral">数値上の変化なし</span>;
  return <div className="decision-effect-list">{effects.map((effect, index) => <span className={`decision-effect ${effect.tone}`} key={`${effect.label}-${index}`}><b>{effect.label}</b>{effect.direction} {effect.delta === 0 ? "" : Math.abs(effect.delta)}</span>)}</div>;
}

export function DecisionAnalysisTimeline({ items, summary }: { items: DecisionAnalysis[]; summary: DecisionAnalysisSummary }) {
  return <div className="decision-analysis">
    <section className="decision-tendency" aria-labelledby="decision-tendency-title">
      <div><span>今回の判断傾向</span><h3 id="decision-tendency-title">優先した観点と、残ったトレードオフ</h3><p>{summary.narrative}</p></div>
      <div className="decision-category-summary">{summary.categories.map(item => <span key={item.label}>#{item.label} <b>{item.count}</b></span>)}</div>
      <div className="decision-review-pair"><article><strong>良かった判断</strong><ul>{summary.strengths.map(item => <li key={item}>{item}</li>)}</ul></article><article><strong>見直せそうな判断</strong><ul>{summary.improvements.map(item => <li key={item}>{item}</li>)}</ul></article></div>
    </section>
    <ol className="decision-timeline">{items.map((item, index) => <li key={item.id} className="decision-timeline-item">
      <div className="decision-timeline-marker"><span>{String(index + 1).padStart(2, "0")}</span></div>
      <article className="decision-analysis-card">
        <header><div><span>{item.timing}</span><h3>{item.situation}</h3></div><div className="decision-tags">{item.categories.map(tag => <span key={tag}>#{tag}</span>)}</div></header>
        <div className="decision-stage selected"><span>あなたの判断</span><strong>{item.selectedAction}</strong></div>
        <div className="decision-stage"><span>直後に起きたこと</span><p>{item.immediateResult}</p><EffectList effects={item.immediateEffects} /></div>
        {item.delayedEffects.length ? <div className="decision-stage delayed"><span>後から発生した影響</span>{item.delayedEffects.map(effect => <div key={`${effect.title}-${effect.detail}`}><strong>{effect.title}</strong><p>{effect.detail}</p><EffectList effects={effect.effects} /></div>)}</div> : null}
        <div className="decision-stage learning"><span>学習ポイント</span><p>{item.learningPoint}</p></div>
        <details><summary>詳細を見る</summary><div className="decision-detail"><strong>なぜこの結果になったか</strong><p>{item.why}</p>{item.alternatives.length ? <><strong>別の選択肢として考えられたこと</strong><ul>{item.alternatives.map(option => <li key={option}>{option}</li>)}</ul></> : null}{item.improvements.map(text => <p key={text}><b>別の考え方：</b>{text}</p>)}</div></details>
      </article>
    </li>)}</ol>
  </div>;
}
