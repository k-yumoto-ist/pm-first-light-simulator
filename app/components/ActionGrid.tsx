import type { PMActionDefinition } from "../data/actions";

export function ActionGrid({ actions, usedIds, disabled, onSelect }: { actions: PMActionDefinition[]; usedIds: PMActionDefinition["id"][]; disabled: boolean; onSelect: (action: PMActionDefinition) => void }) {
  return <div className="step-action-grid" aria-label="PMアクション一覧">{actions.map((action, index) => {
    const used = usedIds.includes(action.id);
    return <button key={action.id} type="button" className={"step-action-card " + (used ? "was-used" : "")} disabled={disabled} onClick={() => onSelect(action)}>
      <span className="action-card-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="action-card-code">{action.code}</span>
      <span className="action-card-copy"><strong>{used ? "✓ " : ""}{action.title}</strong><small>{action.description}</small><b>{action.domains.join(" / ")}</b></span>
      {used && <em>実行済み</em>}
    </button>;
  })}</div>;
}
