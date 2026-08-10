import type { GameFlags } from "../types/game";

const knowledgeItems: { flag: keyof Pick<GameFlags, "decisionMakerKnown" | "apiRiskKnown" | "releaseCriteriaKnown">; label: string; value: string }[] = [
  { flag: "decisionMakerKnown", label: "最終意思決定者", value: "高橋部長（リリース承認者）" },
  { flag: "apiRiskKnown", label: "技術上の主要リスク", value: "外部APIの仕様確定遅延" },
  { flag: "releaseCriteriaKnown", label: "リリース成功条件", value: "主要機能の提供と重大障害がないこと" },
];

export function SituationStep({ turnNumber, theme, title, notice, consider, flags, onDecide }: { turnNumber: number; theme: string; title: string; notice: string; consider: string; flags: GameFlags; onDecide: () => void }) {
  const unlocked = knowledgeItems.filter(item => flags[item.flag]);
  const unknown = knowledgeItems.filter(item => !flags[item.flag]);
  return <section className="step-stage situation-step">
    <div className="situation-step-inner">
      <header className="step-turn"><span>TURN {turnNumber}</span><b>{theme}</b></header>
      <div className="situation-reading">
        <p className="step-kicker">CURRENT SITUATION</p>
        <h1>{title}</h1>
        <p className="situation-story">{notice}</p>
        <section className="pm-thinking"><span>PMとして考えるポイント</span><p>{consider}</p></section>
      </div>
      <div className="knowledge-stage">
        <section><h2>現在わかっていること</h2><ul className="known-fact-list"><li><b>確認済み</b><span>リリース日は経営層から発表済み</span></li><li><b>確認済み</b><span>一部要件は未確定で、外部APIを利用予定</span></li>{unlocked.map(item => <li key={item.flag} className="is-unlocked"><b>判明</b><span>{item.label}<small>{item.value}</small></span></li>)}</ul></section>
        <section><h2>まだわかっていないこと</h2>{unknown.length ? <ul className="unknown-fact-list">{unknown.map(item => <li key={item.flag}><b>LOCK</b><span>{item.label}</span></li>)}</ul> : <p className="all-known">主要な不確実性は確認できています。</p>}</section>
      </div>
      <footer><button className="primary situation-next" onClick={onDecide}>PMとして判断する <span>→</span></button></footer>
    </div>
  </section>;
}
