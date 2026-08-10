import type { PMActionDefinition } from "../data/actions";
import { InfoPopover } from "./InfoPopover";

const directionCopy = {
  strongUp: { mark: "↑↑", label: "大きく改善する可能性" },
  up: { mark: "↑", label: "改善する可能性" },
  neutral: { mark: "→", label: "直接的な影響は小さい" },
  down: { mark: "↓", label: "低下する可能性" },
};

export function ActionDetail({ action, disabled, onExecute }: { action: PMActionDefinition; disabled: boolean; onExecute: () => void }) {
  return <article className="action-detail-panel">
    <header><span className="detail-code">{action.code}</span><div><p>SELECTED ACTION</p><h2>{action.title}</h2></div></header>
    <section><div className="detail-label">何をする？</div><p className="detail-description">{action.description}</p></section>
    <section><div className="detail-label">こんな時に有効</div><ul className="use-case-list">{action.useCases.map(item => <li key={item}>{item}</li>)}</ul></section>
    <section className="impact-preview"><div className="detail-label-row"><span className="detail-label">期待できる影響</span><InfoPopover label="影響表示の見方"><strong>数値は事前に分かりません</strong><p>矢印は影響の方向性です。状況や取得済み情報によって実際の結果は変わります。</p></InfoPopover></div><div>{action.impactHints.map(item => { const copy = directionCopy[item.direction]; return <div key={item.label} className={`impact-hint impact-${item.direction}`}><span>{item.label}</span><strong aria-label={copy.label}>{copy.mark}</strong><small>{copy.label}</small></div>; })}</div></section>
    <section className="detail-tradeoff"><div className="detail-label-row"><span className="detail-label">注意点</span><InfoPopover label="この行動のトレードオフ"><p>{action.tradeoff}</p></InfoPopover></div><p>{action.tradeoff}</p></section>
    <footer><div><span>消費</span><strong>{action.cost}</strong></div><button type="button" className="primary action-detail-cta" disabled={disabled} onClick={onExecute}>{action.id === "hearing" ? "ヒアリング相手を選ぶ" : action.title}</button></footer>
  </article>;
}
