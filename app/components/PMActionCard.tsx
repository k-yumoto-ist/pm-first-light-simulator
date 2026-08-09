import type { PMActionDefinition } from "../data/actions";

type Props = {
  action: PMActionDefinition;
  disabled: boolean;
  executing: boolean;
  onSelect: () => void;
};

export function PMActionCard({ action, disabled, executing, onSelect }: Props) {
  return <article className={`pm-action-card ${executing ? "is-executing" : ""}`}>
    <div className="action-card-head">
      <span className="action-index">{String(["hearing", "schedule", "risk", "scope", "team", "report"].indexOf(action.id) + 1).padStart(2, "0")}</span>
      <span className="action-cost">{action.cost}</span>
    </div>
    <h3>{action.title}</h3>
    <p>{action.description}</p>
    <div className="expected-block"><span>この行動で狙えること</span><ul>{action.expected.map(item => <li key={item}>{item}</li>)}</ul></div>
    <div className="action-card-footer"><div className="area-chips">{action.domains.map(area => <span key={area}>{area}</span>)}</div><button disabled={disabled || executing} onClick={onSelect}>{executing ? "実行中…" : action.id === "hearing" ? "話す相手を選ぶ" : "このアクションを実行"}</button></div>
  </article>;
}
