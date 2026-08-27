"use client";

import { useMemo, useState } from "react";
import type { ProjectContext, ScenarioStakeholder, StakeholderGroup, StakeholderRelationship } from "@/src/data/statefulScenarioTypes";
import { inferStakeholderGroup, stakeholderGroupLabels, stakeholderRelationshipLabels } from "../lib/stakeholderMap";
import { AccessibleDialog } from "./AccessibleDialog";

const groupOrder: StakeholderGroup[] = ["customer", "business", "management", "operations", "development", "quality", "other"];

export function ProjectStakeholderMap({ project, stakeholders, relationships, onClose }: { project: ProjectContext; stakeholders: ScenarioStakeholder[]; relationships: StakeholderRelationship[]; onClose: () => void }) {
  const mapStakeholders = useMemo(() => stakeholders.map(person => ({ ...person, group: person.group ?? inferStakeholderGroup(person.role) })), [stakeholders]);
  const initialId = mapStakeholders.find(person => person.attentionLevel === "warning")?.id ?? mapStakeholders.find(person => person.attentionLevel === "notice")?.id ?? mapStakeholders[0]?.id;
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = mapStakeholders.find(person => person.id === selectedId) ?? mapStakeholders[0];
  const grouped = useMemo(() => groupOrder.map(group => ({ group, people: mapStakeholders.filter(person => person.group === group) })).filter(item => item.people.length), [mapStakeholders]);
  const relationshipFor = (personId: string) => relationships.find(item => (item.from === "pm" && item.to === personId) || (item.to === "pm" && item.from === personId));
  const selectedRelationship = selected ? relationshipFor(selected.id) : undefined;
  const selectedRelationships = selected ? relationships.filter(item => item.from === selected.id || item.to === selected.id) : [];
  const stakeholderName = (id: string) => id === "pm" ? "あなた（PM）" : mapStakeholders.find(person => person.id === id)?.name ?? id;
  const visibleFacts = selected?.facts?.filter(fact => fact.status !== "unknown") ?? [];
  const unknownCount = selected?.facts?.filter(fact => fact.status === "unknown").length ?? 0;

  return <AccessibleDialog onClose={onClose} labelledBy="stakeholder-map-title" overlayClassName="action-detail-overlay stakeholder-map-overlay" dialogClassName="stakeholder-map-dialog">
    <header className="stakeholder-map-header">
      <div><p>プロジェクト関係者</p><h2 id="stakeholder-map-title">誰と、どう関わるプロジェクトか</h2></div>
      <button type="button" aria-label="プロジェクト関係者マップを閉じる" onClick={onClose}>閉じる</button>
    </header>
    <div className="stakeholder-map-layout">
      <aside className="stakeholder-project-overview" aria-label="プロジェクト概要">
        <span>プロジェクト概要</span><h3>{project.name}</h3>
        <dl>
          <div><dt>現在のフェーズ</dt><dd>{project.phase}</dd></div>
          {project.releaseTiming ? <div><dt>リリース予定・残期間</dt><dd>{project.releaseTiming}</dd></div> : null}
          {project.teamSize ? <div><dt>チーム規模・構成</dt><dd>{project.teamSize}</dd></div> : null}
        </dl>
        <section><h4>プロジェクト目的</h4><p>{project.purpose}</p></section>
        <section><h4>現在把握している主な課題</h4><ul>{project.currentIssues.slice(0, 4).map(issue => <li key={issue}>{issue}</li>)}</ul></section>
        <section className="player-role"><span>あなたの役割</span><strong>{project.playerRole}</strong>{project.playerMission ? <p>{project.playerMission}</p> : null}</section>
      </aside>

      <section className="stakeholder-map-canvas" aria-label="PMを中心とした関係者マップ">
        <header><div><span>関係者マップ</span><h3>あなた（PM）を中心に見る</h3></div><small>人物を選ぶと詳細を確認できます</small></header>
        <div className="player-node"><span>PM</span><div><strong>あなた</strong><small>プロジェクトマネージャー</small></div></div>
        <div className="relationship-legend" aria-label="関係性の凡例"><span className="relation-solid">報告・連携</span><span className="relation-dotted">相談・調整</span><span className="relation-dashed">要求・期待</span></div>
        <div className="stakeholder-groups">
          {grouped.map(({ group, people }) => <section key={group} className={`stakeholder-group group-${group}`}>
            <h4>{stakeholderGroupLabels[group]}</h4>
            <div>{people.map(person => { const relationship = relationshipFor(person.id); const relationType = relationship?.type ?? "other"; return <button key={person.id} type="button" className={`stakeholder-person-card relation-${relationType} ${selected?.id === person.id ? "is-selected" : ""}`} aria-pressed={selected?.id === person.id} onClick={() => setSelectedId(person.id)}>
              <span className="stakeholder-relation-label">{relationship?.label ?? stakeholderRelationshipLabels[relationType]}</span>
              <span className="stakeholder-avatar">{person.avatar}</span>
              <span className="stakeholder-card-copy"><strong>{person.name}さん</strong><small>{person.role}</small><em>{person.traits?.[0] ?? person.priority}</em></span>
              {person.attentionLevel && person.attentionLevel !== "normal" ? <b className={`attention-${person.attentionLevel}`}>{person.attentionLevel === "warning" ? "要確認" : "状況変化あり"}</b> : null}
            </button>})}</div>
          </section>)}
        </div>
      </section>

      <aside className="stakeholder-detail-panel" aria-live="polite">
        {selected ? <>
          <div className="stakeholder-detail-identity"><span className="stakeholder-avatar large">{selected.avatar}</span><div><small>{stakeholderGroupLabels[selected.group ?? "other"]}</small><h3>{selected.name}さん</h3><strong>{selected.role}</strong></div></div>
          <p className="stakeholder-summary">{selected.summary}</p>
          <section><h4>人物の特性</h4><ul>{selected.traits?.map(trait => <li key={trait}>{trait}</li>)}</ul></section>
          <section className="current-status"><h4>現在の状況</h4><ul>{selected.currentStatus?.map(status => <li key={status}>{status}</li>)}</ul></section>
          <section><h4>あなたとの関係</h4>{selectedRelationship ? <span className="detail-relationship">{selectedRelationship.label ?? stakeholderRelationshipLabels[selectedRelationship.type]}</span> : null}<ul>{selected.relationshipToPlayer?.map(item => <li key={item}>{item}</li>)}</ul></section>
          {selectedRelationships.length ? <section><h4>主な関係</h4><ul className="stakeholder-relationship-list">{selectedRelationships.map((item, index) => { const otherId = item.from === selected.id ? item.to : item.from; return <li key={`${item.from}-${item.to}-${index}`}><span className={`relationship-line relation-${item.type}`} aria-hidden="true"/><strong>{stakeholderName(otherId)}</strong><small>{item.label ?? stakeholderRelationshipLabels[item.type]}</small></li>})}</ul></section> : null}
          {visibleFacts.length || unknownCount ? <section><h4>把握している情報</h4><ul>{visibleFacts.map(fact => <li key={fact.text} className={fact.status === "discovered" ? "is-discovered" : ""}>{fact.status === "discovered" ? "新しく分かったこと：" : ""}{fact.text}</li>)}</ul>{unknownCount ? <p className="unknown-facts">まだ確認していない情報があります。</p> : null}</section> : null}
        </> : <p>関係者情報はまだ登録されていません。</p>}
      </aside>
    </div>
  </AccessibleDialog>;
}
