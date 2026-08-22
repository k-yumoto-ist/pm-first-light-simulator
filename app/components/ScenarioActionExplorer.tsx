"use client";

import { useMemo, useState } from "react";
import type { Difficulty } from "@/src/data/types";
import type {
  ScenarioAction,
  ScenarioActionCategory,
  ScenarioActionCategoryId,
  ScenarioStakeholder,
} from "@/src/data/statefulScenarioTypes";

type ActionAvailability = { disabled: boolean; label?: string };

export default function ScenarioActionExplorer({
  categories,
  actions,
  stakeholders,
  difficulty,
  relevantActionIds,
  getAvailability,
  onSelect,
  initialCategoryId,
  allowCategoryReset = true,
}: {
  categories: ScenarioActionCategory[];
  actions: ScenarioAction[];
  stakeholders: ScenarioStakeholder[];
  difficulty: Difficulty;
  relevantActionIds: Set<string>;
  getAvailability: (action: ScenarioAction) => ActionAvailability;
  onSelect: (action: ScenarioAction) => void;
  initialCategoryId?: ScenarioActionCategoryId;
  allowCategoryReset?: boolean;
}) {
  const [categoryId, setCategoryId] = useState<ScenarioActionCategoryId | undefined>(initialCategoryId);
  const [stakeholderId, setStakeholderId] = useState<string>();
  const actionCounts = useMemo(() => {
    const counts = new Map<ScenarioActionCategoryId, number>();
    for (const action of actions) counts.set(action.category, (counts.get(action.category) ?? 0) + 1);
    return counts;
  }, [actions]);
  const stakeholderMap = useMemo(() => new Map(stakeholders.map((person) => [person.id, person])), [stakeholders]);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const categoryActions = categoryId ? actions.filter((action) => action.category === categoryId) : [];
  const hearingTargets = useMemo(() => {
    const ids = [...new Set(actions.filter((action) => action.category === "hearing").map((action) => action.stakeholderId).filter(Boolean))] as string[];
    return ids.map((id) => stakeholderMap.get(id)).filter((person): person is ScenarioStakeholder => Boolean(person));
  }, [actions, stakeholderMap]);
  const visibleActions = categoryId === "hearing" && stakeholderId
    ? categoryActions.filter((action) => action.stakeholderId === stakeholderId)
    : categoryId === "hearing" ? [] : categoryActions;

  if (!selectedCategory) {
    return (
      <div className="stateful-category-grid" aria-label="PMアクションカテゴリ">
        {categories.map((category) => (
          <button key={category.id} onClick={() => { setCategoryId(category.id); setStakeholderId(undefined); }}>
            <b>{category.icon}</b>
            <span><strong>{category.label}</strong><small>{category.description}</small></span>
            <em>{actionCounts.get(category.id) ?? 0} choices</em>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="stateful-action-explorer">
      <header>
        {allowCategoryReset ? <button onClick={() => { setCategoryId(undefined); setStakeholderId(undefined); }}>← 6カテゴリへ戻る</button> : <span className="stateful-explorer-step">具体的な行動を選ぶ</span>}
        <div><b>{selectedCategory.icon}</b><span><strong>{selectedCategory.label}</strong><small>{selectedCategory.description}</small></span></div>
      </header>

      {categoryId === "hearing" && !stakeholderId ? (
        <div className="stateful-target-grid" aria-label="話す相手を選ぶ">
          <p>誰に聞きますか？</p>
          {hearingTargets.map((person) => (
            <button key={person.id} onClick={() => setStakeholderId(person.id)}>
              <b>{person.avatar}</b><span><strong>{person.name}</strong><small>{person.role}</small></span><em>質問を選ぶ →</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="stateful-concrete-actions">
          {categoryId === "hearing" ? (
            <div className="stateful-question-heading">
              <button onClick={() => setStakeholderId(undefined)}>← 相手を選び直す</button>
              <p><strong>{stakeholderMap.get(stakeholderId ?? "")?.name}</strong>に何を確認しますか？</p>
            </div>
          ) : null}
          {visibleActions.map((action) => {
            const availability = getAvailability(action);
            const isRelevant = relevantActionIds.has(action.id);
            return (
              <button key={action.id} disabled={availability.disabled} onClick={() => onSelect(action)}>
                <span>
                  <strong>{action.question ?? action.title}</strong>
                  {difficulty !== "challenge" ? <small>{action.description}</small> : null}
                  {difficulty === "guided" && action.guidedHint ? <i>HINT: {action.guidedHint}</i> : null}
                </span>
                <em>{availability.label ?? (isRelevant ? "今の状況に関連" : "詳細を見る")}</em>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
