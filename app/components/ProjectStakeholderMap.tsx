"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ProjectContext, ScenarioStakeholder, StakeholderGroup, StakeholderRelationship, StakeholderRelationshipType } from "@/src/data/statefulScenarioTypes";
import { inferStakeholderGroup, stakeholderGroupLabels, stakeholderRelationshipLabels } from "../lib/stakeholderMap";
import { AccessibleDialog } from "./AccessibleDialog";

type Placement = { x: number; y: number };
type RenderedEdge = StakeholderRelationship & { id: string; left: number; top: number; width: number; angle: number };

const groupOrder: StakeholderGroup[] = ["customer", "business", "management", "operations", "development", "quality", "other"];
const groupSlots: Record<StakeholderGroup, Placement[]> = {
  customer: [{ x: 19, y: 20 }, { x: 38, y: 16 }, { x: 29, y: 29 }],
  management: [{ x: 81, y: 20 }, { x: 63, y: 16 }, { x: 71, y: 29 }],
  business: [{ x: 12, y: 51 }, { x: 17, y: 70 }],
  operations: [{ x: 88, y: 51 }, { x: 83, y: 69 }],
  development: [{ x: 26, y: 82 }, { x: 56, y: 85 }, { x: 41, y: 73 }],
  quality: [{ x: 82, y: 80 }, { x: 90, y: 61 }],
  other: [{ x: 16, y: 71 }, { x: 84, y: 71 }, { x: 50, y: 87 }],
};
const fallbackSlots: Placement[] = [{ x: 16, y: 23 }, { x: 84, y: 23 }, { x: 11, y: 55 }, { x: 89, y: 55 }, { x: 25, y: 82 }, { x: 75, y: 82 }];

function relationshipLineType(type: StakeholderRelationshipType) {
  if (type === "request") return "dashed";
  if (type === "consult" || type === "coordinate") return "dotted";
  return "solid";
}

function buildPlacements(stakeholders: Array<ScenarioStakeholder & { group: StakeholderGroup }>) {
  const groupIndexes = new Map<StakeholderGroup, number>();
  return new Map(stakeholders.map((person, index) => {
    const groupIndex = groupIndexes.get(person.group) ?? 0;
    groupIndexes.set(person.group, groupIndex + 1);
    const placement = groupSlots[person.group][groupIndex] ?? fallbackSlots[index % fallbackSlots.length];
    return [person.id, placement] as const;
  }));
}

function boundaryDistance(rect: DOMRect, unitX: number, unitY: number) {
  const xDistance = Math.abs(unitX) > 0.001 ? rect.width / 2 / Math.abs(unitX) : Number.POSITIVE_INFINITY;
  const yDistance = Math.abs(unitY) > 0.001 ? rect.height / 2 / Math.abs(unitY) : Number.POSITIVE_INFINITY;
  return Math.min(xDistance, yDistance);
}

export function ProjectStakeholderMap({ project, stakeholders, relationships, onClose }: { project: ProjectContext; stakeholders: ScenarioStakeholder[]; relationships: StakeholderRelationship[]; onClose: () => void }) {
  const mapStakeholders = useMemo(() => stakeholders.map(person => ({ ...person, group: person.group ?? inferStakeholderGroup(person.role) })), [stakeholders]);
  const placements = useMemo(() => buildPlacements(mapStakeholders), [mapStakeholders]);
  const [selectedId, setSelectedId] = useState<string>();
  const [renderedEdges, setRenderedEdges] = useState<RenderedEdge[]>([]);
  const networkRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const selected = selectedId ? mapStakeholders.find(person => person.id === selectedId) : undefined;
  const relationshipFor = (personId: string) => relationships.find(item => (item.from === "pm" && item.to === personId) || (item.to === "pm" && item.from === personId));
  const selectedRelationship = selected ? relationshipFor(selected.id) : undefined;
  const selectedRelationships = selected ? relationships.filter(item => item.from === selected.id || item.to === selected.id) : [];
  const stakeholderName = (id: string) => id === "pm" ? "あなた（PM）" : mapStakeholders.find(person => person.id === id)?.name ?? id;
  const visibleFacts = selected?.facts?.filter(fact => fact.status !== "unknown") ?? [];
  const unknownCount = selected?.facts?.filter(fact => fact.status === "unknown").length ?? 0;
  const groupLabels = useMemo(() => groupOrder.map(group => {
    const people = mapStakeholders.filter(person => person.group === group);
    if (!people.length) return undefined;
    const points = people.map(person => placements.get(person.id)!).filter(Boolean);
    return { group, x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: Math.max(5, Math.min(...points.map(point => point.y)) - 12) };
  }).filter(Boolean) as Array<{ group: StakeholderGroup; x: number; y: number }>, [mapStakeholders, placements]);

  useLayoutEffect(() => {
    const network = networkRef.current;
    if (!network) return;
    let frame = 0;
    const updateEdges = () => {
      const networkBox = network.getBoundingClientRect();
      const next = relationships.flatMap((relationship, index) => {
        const from = nodeRefs.current[relationship.from];
        const to = nodeRefs.current[relationship.to];
        if (!from || !to) return [];
        const fromBox = from.getBoundingClientRect();
        const toBox = to.getBoundingClientRect();
        const fromCenter = { x: fromBox.left - networkBox.left + fromBox.width / 2, y: fromBox.top - networkBox.top + fromBox.height / 2 };
        const toCenter = { x: toBox.left - networkBox.left + toBox.width / 2, y: toBox.top - networkBox.top + toBox.height / 2 };
        const deltaX = toCenter.x - fromCenter.x;
        const deltaY = toCenter.y - fromCenter.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (!distance) return [];
        const unitX = deltaX / distance;
        const unitY = deltaY / distance;
        const startInset = boundaryDistance(fromBox, unitX, unitY) + 7;
        const endInset = boundaryDistance(toBox, unitX, unitY) + 7;
        return [{ ...relationship, id: `${relationship.from}-${relationship.to}-${index}`, left: fromCenter.x + unitX * startInset, top: fromCenter.y + unitY * startInset, width: Math.max(16, distance - startInset - endInset), angle: Math.atan2(deltaY, deltaX) * 180 / Math.PI }];
      });
      setRenderedEdges(next);
    };
    const scheduleUpdate = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateEdges); };
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(network);
    Object.values(nodeRefs.current).forEach(node => { if (node) observer.observe(node); });
    scheduleUpdate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [relationships, mapStakeholders]);

  return <AccessibleDialog onClose={onClose} labelledBy="stakeholder-map-title" overlayClassName="action-detail-overlay stakeholder-map-overlay" dialogClassName="stakeholder-map-dialog">
    <header className="stakeholder-map-header">
      <div><p>プロジェクト関係者</p><h2 id="stakeholder-map-title">誰と、どう関わるプロジェクトか</h2></div>
      <button type="button" aria-label="プロジェクト関係者マップを閉じる" onClick={onClose}>閉じる</button>
    </header>
    <div className={`stakeholder-map-layout ${selected ? "has-selection" : ""}`}>
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
        <div className="stakeholder-network" ref={networkRef}>
          <div className="stakeholder-edge-layer" aria-hidden="true">
            {renderedEdges.map(edge => <span key={edge.id} className={`stakeholder-edge line-${relationshipLineType(edge.type)}`} style={{ left: edge.left, top: edge.top, width: edge.width, transform: `rotate(${edge.angle}deg)` }}><em style={{ transform: `translate(-50%, -50%) rotate(${-edge.angle}deg)` }}>{edge.label ?? stakeholderRelationshipLabels[edge.type]}</em></span>)}
          </div>
          {groupLabels.map(label => <span key={label.group} className={`map-group-label group-${label.group}`} style={{ left: `${label.x}%`, top: `${label.y}%` }}>{stakeholderGroupLabels[label.group]}</span>)}
          <div className="player-node" ref={node => { nodeRefs.current.pm = node; }}><span>PM</span><div><strong>あなた</strong><small>プロジェクトマネージャー</small></div></div>
          <div className="stakeholder-network-nodes">
            {mapStakeholders.map(person => { const placement = placements.get(person.id)!; const relationship = relationshipFor(person.id); return <button key={person.id} ref={node => { nodeRefs.current[person.id] = node; }} type="button" style={{ "--stakeholder-x": `${placement.x}%`, "--stakeholder-y": `${placement.y}%` } as CSSProperties} className={`stakeholder-person-card ${selected?.id === person.id ? "is-selected" : ""}`} aria-pressed={selected?.id === person.id} onClick={() => setSelectedId(person.id)}>
              <span className="stakeholder-avatar">{person.avatar}</span>
              <span className="stakeholder-card-copy"><strong>{person.name}さん</strong><small>{person.role}</small><em>{person.traits?.[0] ?? person.priority}</em><i className="stakeholder-mobile-relation">{relationship?.label ?? stakeholderRelationshipLabels[relationship?.type ?? "other"]}</i></span>
              {person.attentionLevel && person.attentionLevel !== "normal" ? <span className={`attention-dot attention-${person.attentionLevel}`} aria-label={person.attentionLevel === "warning" ? "要確認" : "状況変化あり"} title={person.attentionLevel === "warning" ? "要確認" : "状況変化あり"}/> : null}
            </button>})}
          </div>
          <div className="relationship-legend" aria-label="関係性の凡例"><span className="relation-solid">報告・連携</span><span className="relation-dotted">相談・調整</span><span className="relation-dashed">要求・期待</span></div>
        </div>
      </section>

      <aside className={`stakeholder-detail-panel ${selected ? "is-open" : "is-empty"}`} aria-live="polite">
        {selected ? <>
          <div className="stakeholder-detail-identity"><span className="stakeholder-avatar large">{selected.avatar}</span><div><small>{stakeholderGroupLabels[selected.group]}</small><h3>{selected.name}さん</h3><strong>{selected.role}</strong></div></div>
          <p className="stakeholder-summary">{selected.summary}</p>
          <section><h4>人物の特性</h4><ul>{selected.traits?.map(trait => <li key={trait}>{trait}</li>)}</ul></section>
          <section className="current-status"><h4>現在の状況</h4><ul>{selected.currentStatus?.map(status => <li key={status}>{status}</li>)}</ul></section>
          <section><h4>あなたとの関係</h4>{selectedRelationship ? <span className="detail-relationship">{selectedRelationship.label ?? stakeholderRelationshipLabels[selectedRelationship.type]}</span> : null}<ul>{selected.relationshipToPlayer?.map(item => <li key={item}>{item}</li>)}</ul></section>
          {selectedRelationships.length ? <section><h4>主な関係</h4><ul className="stakeholder-relationship-list">{selectedRelationships.map((item, index) => { const otherId = item.from === selected.id ? item.to : item.from; return <li key={`${item.from}-${item.to}-${index}`}><span className={`relationship-line relation-${relationshipLineType(item.type)}`} aria-hidden="true"/><strong>{stakeholderName(otherId)}</strong><small>{item.label ?? stakeholderRelationshipLabels[item.type]}</small></li>})}</ul></section> : null}
          {visibleFacts.length || unknownCount ? <section><h4>把握している情報</h4><ul>{visibleFacts.map(fact => <li key={fact.text} className={fact.status === "discovered" ? "is-discovered" : ""}>{fact.status === "discovered" ? "新しく分かったこと：" : ""}{fact.text}</li>)}</ul>{unknownCount ? <p className="unknown-facts">まだ確認していない情報があります。</p> : null}</section> : null}
        </> : <div className="stakeholder-detail-empty"><span>人物詳細</span><h3>関係者を選択してください</h3><p>人物カードを選ぶと、その人の状況やあなたとの関係を確認できます。</p></div>}
      </aside>
    </div>
  </AccessibleDialog>;
}
