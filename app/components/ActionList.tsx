import type { PMActionDefinition } from "../data/actions";
import { InfoPopover } from "./InfoPopover";

export function ActionList({ actions, selectedId, disabled, onSelect }: { actions: PMActionDefinition[]; selectedId: PMActionDefinition["id"]; disabled: boolean; onSelect: (id: PMActionDefinition["id"]) => void }) {
  return <div className="action-selector-list" aria-label="PMアクション一覧">
    {actions.map((action, index) => <div key={action.id} className={`action-selector ${selectedId === action.id ? "selected" : ""}`}>
      <button type="button" className="action-selector-main" aria-pressed={selectedId === action.id} disabled={disabled} onClick={() => onSelect(action.id)}>
        <span className="action-selector-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="action-selector-code">{action.code}</span>
        <span className="action-selector-copy"><strong>{action.title}</strong><small>{action.description}</small><span className="mini-domains">{action.domains.join(" / ")}</span></span>
      </button>
      <InfoPopover label={`${action.title}の補足`}><strong>判断のヒント</strong><p>{action.tradeoff}</p></InfoPopover>
    </div>)}
  </div>;
}
