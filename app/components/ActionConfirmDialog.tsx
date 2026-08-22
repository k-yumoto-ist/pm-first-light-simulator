import { useState } from "react";
import { AccessibleDialog } from "./AccessibleDialog";

export type ActionConfirmation = {
  title: string;
  description: string;
  aims: string[];
  impacts: { label: string; direction: string }[];
};

export function ActionConfirmDialog({ confirmation, actionsLeft, onCancel, onConfirm }: { confirmation: ActionConfirmation; actionsLeft: number; onCancel: () => void; onConfirm: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmOnce = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm();
  };
  return <AccessibleDialog onClose={isSubmitting ? () => {} : onCancel} labelledBy="confirm-title" overlayClassName="confirm-overlay" dialogClassName="action-confirm-dialog">
    <header><p>PM DECISION CHECK</p><h2 id="confirm-title">{confirmation.title}</h2><span>この判断にActionを使います</span></header>
    <div className="confirm-resource"><span>残りAction</span><div><strong>{actionsLeft}</strong><i>→</i><b>{Math.max(0, actionsLeft - 1)}</b></div><small>Action × 1を消費</small></div>
    <section><h3>主な狙い</h3><p>{confirmation.description}</p><ul>{confirmation.aims.map(item => <li key={item}>{item}</li>)}</ul></section>
    <section><h3>期待できる影響</h3><div className="confirm-impact-list">{confirmation.impacts.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.direction}</strong></div>)}</div><small>実際の結果は、現在の状況とこれまでの行動によって変わります。</small></section>
    <footer><button type="button" className="dialog-secondary" disabled={isSubmitting} onClick={onCancel}>選び直す</button><button type="button" className="primary" disabled={isSubmitting} onClick={confirmOnce}>{isSubmitting ? "実行中…" : "Actionを使って実行する"}</button></footer>
  </AccessibleDialog>;
}
