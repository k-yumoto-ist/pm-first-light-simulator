import type { BehaviorTag } from "./types";

/** Internal reference: concrete expected actions distilled from docs/pm-behavior-standards.md. */
export const pmBehaviorStandards: Record<BehaviorTag, { label: string; actions: string[] }> = {
  purpose_confirmation: { label: "目的の確認", actions: ["要求の背景にある目的を確認する", "業務上の成功を言葉にする"] },
  impact_analysis: { label: "影響の整理", actions: ["工数・納期・品質への影響を整理する"] },
  alternative_proposal: { label: "代替案の提示", actions: ["目的を満たす複数案を比較して提示する"] },
  business_value_check: { label: "価値の確認", actions: ["ビジネス価値を基準に優先順位を考える"] },
  scope_baseline_reference: { label: "合意範囲の参照", actions: ["当初合意した範囲を根拠に変更を扱う"] },
  early_escalation: { label: "早期共有", actions: ["懸念と対応案を早い段階で責任者へ共有する"] },
  risk_identification: { label: "リスクの明確化", actions: ["起こり得る不確実性と影響を言語化する"] },
  risk_response_planning: { label: "リスク対応の計画", actions: ["回避・軽減などの対応方針を決めて追跡する"] },
  contingency_planning: { label: "代替計画", actions: ["発動条件と代替案を事前に準備する"] },
  critical_path_analysis: { label: "重要経路の確認", actions: ["全体に影響するタスクのつながりを確認する"] },
  resource_reallocation: { label: "リソース再配置", actions: ["負荷とスキルを見て人や作業を組み替える"] },
  recovery_planning: { label: "リカバリープラン", actions: ["遅延の原因に合わせた挽回策を作る"] },
  stakeholder_analysis: { label: "関係者の整理", actions: ["関係者の立場・影響力・期待を整理する"] },
  expectation_management: { label: "期待値の調整", actions: ["できることと制約を分かりやすく共有する"] },
  consensus_building: { label: "合意形成", actions: ["目的と事実を共有し、納得できる着地点を作る"] },
  written_agreement: { label: "合意の記録", actions: ["決まったことを文書に残し認識をそろえる"] },
  team_health_monitoring: { label: "チーム状態の確認", actions: ["負荷や困りごとを定期的に確認する"] },
  knowledge_transfer: { label: "知識移転", actions: ["属人化を見つけ、引き継ぎと共有を進める"] },
  decision_rights_clarification: { label: "意思決定者の確認", actions: ["誰が決めるのかと判断基準を明確にする"] },
};
