import type { CharacterId } from "../types/game";
import type { StakeholderAttentionLevel, StakeholderFact, StakeholderGroup, StakeholderRelationship } from "@/src/data/statefulScenarioTypes";

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: string;
  group: StakeholderGroup;
  summary: string;
  traits: string[];
  currentStatus: string[];
  relationshipToPlayer: string[];
  attentionLevel?: StakeholderAttentionLevel;
  facts?: StakeholderFact[];
};

export const characters: Character[] = [
  { id: "sato", name: "佐藤", role: "顧客担当者", initials: "佐", color: "coral", status: "窓口・要望を取りまとめ", group: "customer", summary: "顧客側の実務窓口として、要望と現場の声を取りまとめます。", traits: ["要望の背景を把握", "顧客内の調整窓口"], currentStatus: ["検索条件に関する追加要望を整理中"], relationshipToPlayer: ["要望の目的と優先順位を確認する", "影響と対応方針を共有する"], attentionLevel: "notice", facts: [{ text: "追加要望の背景はまだ十分に確認できていません", status: "known" }] },
  { id: "takahashi", name: "高橋", role: "顧客部長", initials: "高", color: "gold", status: "多忙・事業影響を重視", group: "management", summary: "顧客側の意思決定者として、事業成果とリリース条件を判断します。", traits: ["事業影響を重視", "判断時間が限られる"], currentStatus: ["経営層へ発表済みの納期を気にしている"], relationshipToPlayer: ["重要な選択肢と影響を説明する", "最終判断と合意を依頼する"], attentionLevel: "notice" },
  { id: "tanaka", name: "田中", role: "テックリード", initials: "田", color: "blue", status: "技術・開発計画を担当", group: "development", summary: "技術面と開発計画を担い、実現可能性と品質への影響を把握します。", traits: ["技術判断を担当", "開発全体を見渡す"], currentStatus: ["外部APIと残作業の影響を確認する必要がある"], relationshipToPlayer: ["技術・日程への影響を相談する", "優先順位と実装方針を調整する"], attentionLevel: "notice" },
  { id: "suzuki", name: "鈴木", role: "若手エンジニア", initials: "鈴", color: "mint", status: "検索画面を実装中", group: "development", summary: "検索画面の実装を担当し、現場の作業負荷と進捗を最も近くで感じています。", traits: ["検索画面を担当", "実装作業に集中"], currentStatus: ["追加対応による作業切替とレビュー余力が気になる"], relationshipToPlayer: ["作業状況と困りごとを確認する", "優先順位を明確に伝える"], attentionLevel: "notice" },
];

export const lightStakeholderRelationships: StakeholderRelationship[] = [
  { from: "sato", to: "pm", type: "request", label: "要求・期待" },
  { from: "pm", to: "takahashi", type: "decision", label: "判断依頼" },
  { from: "pm", to: "tanaka", type: "coordinate", label: "技術・計画調整" },
  { from: "suzuki", to: "pm", type: "report", label: "進捗・相談" },
];
