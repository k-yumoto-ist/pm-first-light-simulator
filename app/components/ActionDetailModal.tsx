import type { PMActionDefinition } from "../data/actions";
import { AccessibleDialog } from "./AccessibleDialog";

const directionCopy = {
  strongUp: { mark: "↑↑", label: "大きく改善する可能性" },
  up: { mark: "↑", label: "改善する可能性" },
  neutral: { mark: "→", label: "直接的な影響は小さい" },
  down: { mark: "↓", label: "低下する可能性" },
};

export function ActionDetailModal({ action, actionsLeft, disabled, onClose, onExecute }: { action: PMActionDefinition; actionsLeft: number; disabled: boolean; onClose: () => void; onExecute: () => void }) {
  return <AccessibleDialog onClose={onClose} labelledBy="action-detail-title" overlayClassName="action-detail-overlay" dialogClassName="action-detail-dialog">
    <header><span className="detail-code">{action.code}</span><div><p>ACTION DETAIL</p><h2 id="action-detail-title">{action.title}</h2></div><button type="button" aria-label="アクション詳細を閉じる" onClick={onClose}>×</button></header>
    <div className="action-detail-body">
      <section><span>何をする？</span><p>{action.description}</p></section>
      <section><span>こんな時に有効</span><ul>{action.useCases.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section><span>期待できる影響</span><div className="modal-impact-list">{action.impactHints.map(item => { const copy = directionCopy[item.direction]; return <div key={item.label} className={"modal-impact impact-" + item.direction}><b>{item.label}</b><strong aria-label={copy.label}>{copy.mark}</strong><small>{copy.label}</small></div>; })}</div></section>
      <section className="modal-caution"><span>注意</span><p>{action.tradeoff}</p></section>
    </div>
    <footer><div className="modal-action-cost"><span>消費</span><strong>{action.id === "hearing" ? "質問実行時 Action × 1" : "Action × 1"}</strong></div><div className="modal-action-remaining"><span>残りAction</span><strong>{actionsLeft}</strong><i>→</i><b>{Math.max(0, actionsLeft - 1)}</b></div><div className="modal-action-buttons"><button type="button" className="dialog-secondary" onClick={onClose}>戻る</button><button type="button" className="primary" disabled={disabled} onClick={onExecute}>{action.id === "hearing" ? "話す相手を選ぶ" : action.title}</button></div></footer>
  </AccessibleDialog>;
}
