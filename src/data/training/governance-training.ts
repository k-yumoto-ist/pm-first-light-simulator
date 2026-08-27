import type { ScenarioAction, ScenarioDecision, StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { statefulActionCategories } from "../scenarios/stateful-action-categories";

const action = (value: Partial<ScenarioAction> & Pick<ScenarioAction, "id" | "title" | "category" | "result">): ScenarioAction => ({
  description: "判断材料を増やすための確認です。", availableFromTurn: 1, grantsInformation: [], repeatPolicy: value.conditionalOutcomes ? "per-turn" : "once",
  whyThisResult: "担当する情報源へ確認したためです。", ...value,
});
const decisionEvidence: Partial<Record<string, ScenarioDecision["evidence"]>> = {
  gov_map: [{ areaId: "governance", elementId: "decision-rights", behavior: "decision_rights_clarification", weight: 4 }],
  gov_criteria: [{ areaId: "governance", elementId: "criteria", behavior: "consensus_building", weight: 4 }],
  gov_record: [{ areaId: "governance", elementId: "record", behavior: "written_agreement", weight: 4 }],
};
const decision = (value: Partial<ScenarioDecision> & Pick<ScenarioDecision, "id" | "title" | "whatHappened" | "why" | "pmPoint" | "chainEffect">): ScenarioDecision => ({
  description: "確認した事実をもとに判断します。", metricEffects: {}, evidence: decisionEvidence[value.id] ?? [], ...value,
});

export const governanceTraining: StatefulScenarioDefinition = {
  id: "governance-training", title: "誰が何を決めるのか？", description: "意思決定の権限と基準を整理し、迷いを減らす3ターンの練習です。", mode: "training",
  supportedDifficulties: ["guided", "standard", "challenge"], investigationBudget: { guided: 3, standard: 2, challenge: 2 }, primaryDomain: "governance", relatedDomains: ["stakeholders", "risk", "scope"],
  initialMetrics: { schedule: 74, budget: 72, quality: 74, trust: 68, teamHealth: 72, businessValue: 70, riskExposure: 42, scopeStability: 70, stakeholderAlignment: 48 },
  initialFlags: { ownerKnown: false, criteriaKnown: false, routeDefined: false, decisionRecorded: false, majorityChosen: false },
  intro: { emphasizedHeadline: "意思決定の仕組みを整えるPMです。", description: "複数部門が別々の判断を始めています。誰が何を基準に決めるのかを整理してください。", briefTitle: "顧客ポータル改善", phase: "要件確定前", team: "PM・顧客・営業・開発", issueLabel: "現在の課題", issue: "判断権限と承認経路が曖昧", requestLabel: "関係者の声", request: "それぞれが自分の判断で進めたい", risk: "後から決定が覆る可能性" },
  stakeholders: [
    { id: "sato", name: "佐藤", role: "顧客担当者", priority: "現場の要望を早く反映したい", avatar: "佐" },
    { id: "takahashi", name: "高橋", role: "顧客決裁者", priority: "事業価値と責任範囲を明確にしたい", avatar: "高" },
    { id: "mori", name: "森", role: "営業責任者", priority: "顧客との約束を守りたい", avatar: "森" },
    { id: "tanaka", name: "田中", role: "開発リーダー", priority: "技術的な判断を適切な場で行いたい", avatar: "田" },
  ],
  actionCategories: statefulActionCategories,
  information: [
    { id: "decision_scope", label: "決める範囲", detail: "今回のリリース条件と優先順位が意思決定の対象です。", source: "要件整理" },
    { id: "decision_owner", label: "最終判断者", detail: "事業上の優先順位は高橋が最終判断します。", source: "高橋への確認" },
    { id: "approval_route", label: "承認経路", detail: "影響が大きい変更は高橋承認後に議事録へ残します。", source: "高橋への確認" },
    { id: "success_criteria", label: "判断基準", detail: "顧客価値、品質下限、納期の順に比較します。", source: "関係者確認" },
    { id: "technical_constraint", label: "技術制約", detail: "開発側は品質下限を下げる判断を単独ではできません。", source: "田中への確認" },
    { id: "escalation_route", label: "エスカレーション経路", detail: "判断期限を越える場合は高橋へ即時共有します。", source: "リスク整理" },
    { id: "decision_record", label: "決定記録", detail: "決定内容、理由、条件、責任者を記録します。", source: "ガバナンス整理" },
  ],
  actions: [
    action({ id: "gov_ask_sato_need", title: "現場の決定事項を聞く", category: "hearing", stakeholderId: "sato", question: "現場として今回決めてほしいことは何ですか？", grantsInformation: ["decision_scope"], result: "現場が求めている決定事項は、今回のリリース条件と優先順位だと分かりました。" }),
    action({ id: "gov_ask_takahashi_owner", title: "最終判断者を確認する", category: "hearing", stakeholderId: "takahashi", question: "事業上の最終判断は誰が担いますか？", grantsInformation: ["decision_owner", "approval_route"], result: "事業上の最終判断は高橋が担い、重要な変更は承認後に記録する方針だと分かりました。" }),
    action({ id: "gov_ask_mori_route", title: "営業の承認経路を聞く", category: "hearing", stakeholderId: "mori", question: "顧客への約束は誰の承認を受けていますか？", grantsInformation: [], result: "森は顧客との約束は把握していますが、正式な承認権限までは把握していませんでした。", whyThisResult: "営業は顧客関係の情報源ですが、決裁権限は顧客側へ確認する必要があります。" }),
    action({ id: "gov_schedule_deadline", title: "判断期限を確認する", category: "schedule", grantsInformation: ["escalation_route"], result: "判断を先送りできる期限と、越えた場合の共有先を整理しました。" }),
    action({ id: "gov_schedule_dependencies", title: "承認待ちの作業を確認する", category: "schedule", grantsInformation: [], result: "承認待ちの作業は複数ありますが、権限を確認しないままでは優先順位を確定できません。" }),
    action({ id: "gov_risk_route", title: "判断遅延リスクを整理する", category: "risk", grantsInformation: ["escalation_route"], result: "判断期限を越えた場合のエスカレーション経路を整理しました。" }),
    action({ id: "gov_risk_reversal", title: "決定が覆るリスクを整理する", category: "risk", grantsInformation: [], result: "判断者と記録がない場合、後から決定が覆るリスクが高いと整理しました。" }),
    action({ id: "gov_scope_criteria", title: "判断基準を整理する", category: "scope", grantsInformation: [], result: "判断基準の候補は整理できましたが、関係者の優先順位が不足しているため一般論に留まりました。", conditionalOutcomes: [{ requiresInformation: ["decision_scope", "technical_constraint"], grantsInformation: ["success_criteria"], result: "顧客価値・品質下限・納期を比較する判断基準を具体化しました。", whyThisResult: "決定範囲と技術制約を確認していたため、実務で使える基準に落とせました。" }] }),
    action({ id: "gov_scope_matrix", title: "決定権限表を作る", category: "scope", grantsInformation: [], result: "権限表の枠は作れましたが、最終判断者と承認経路が不足しています。", conditionalOutcomes: [{ requiresInformation: ["decision_owner", "approval_route"], grantsInformation: ["decision_record"], result: "決定者・承認者・記録方法を含む権限表を作成しました。", whyThisResult: "誰が決めるかと承認経路を確認してから表にしたためです。" }] }),
    action({ id: "gov_team_technical", title: "開発側の判断境界を聞く", category: "team", stakeholderId: "tanaka", grantsInformation: ["technical_constraint"], result: "開発は技術案を提示できますが、品質下限を下げる判断は単独でできないと分かりました。" }),
    action({ id: "gov_team_capacity", title: "判断待ちの負荷を確認する", category: "team", stakeholderId: "tanaka", grantsInformation: [], result: "判断待ちで作業が止まっていることが分かりましたが、決定経路は確認できませんでした。" }),
    action({ id: "gov_report_owner", title: "関係者へ決定構造を共有する", category: "report", stakeholderId: "takahashi", grantsInformation: [], setsFlags: { routeDefined: true }, result: "決定構造を共有しましたが、判断基準がないため合意は仮置きです。" }),
    action({ id: "gov_report_record", title: "決定記録の形式を提案する", category: "report", stakeholderId: "mori", grantsInformation: ["decision_record"], result: "決定内容・理由・条件・責任者を残す形式を提案しました。" }),
  ],
  turns: [
    { id: "observe", timing: "第1週 / 全3週", title: "判断が分かれている", situation: "営業は顧客へ約束し、開発は別の技術判断を始めています。誰が何を決めるかが見えていません。", thinkingPoint: "まず決める範囲と、判断者をどう確かめますか。", visibleInformation: ["営業と開発が別々に動いている", "最終的な責任者が不明"], newlyRelevantActionIds: ["gov_ask_sato_need", "gov_ask_takahashi_owner"], decisions: [
      decision({ id: "gov_wait", title: "各担当の判断に任せる", metricEffects: { stakeholderAlignment: -6, riskExposure: 5 }, setsFlags: { majorityChosen: true }, whatHappened: "担当ごとの判断が並行し、後から整合を取る必要が生じました。", why: "決定権限を確認しないまま進めたためです。", pmPoint: "判断を急ぐほど、誰が責任を持つかを先に確認します。", chainEffect: "権限不明のまま判断が分散" }),
      decision({ id: "gov_map", title: "決定範囲と判断者を確認する", requiresInformation: ["decision_scope", "decision_owner"], hidesWhenMissing: false, metricEffects: { stakeholderAlignment: 4, riskExposure: -3 }, setsFlags: { ownerKnown: true }, whatHappened: "今回の決定範囲と、事業上の最終判断者を整理しました。", why: "事実を確認してから権限を整理したためです。", pmPoint: "判断者と相談相手を分けると、議論が前に進みます。", chainEffect: "意思決定の土台を確保" }),
      decision({ id: "gov_pm_decides", title: "PMが最終判断する", irreversible: true, metricEffects: { schedule: 2, stakeholderAlignment: -8, trust: -3 }, whatHappened: "PMが早く決めましたが、顧客側の承認は残りました。", why: "PMが権限を代替してしまったためです。", pmPoint: "PMは判断材料を整え、権限者が決められる状態を作ります。", chainEffect: "早さと引き換えに合意が弱い" }),
    ] },
    { id: "criteria", timing: "第2週 / 全3週", title: "判断基準をそろえる", situation: "候補案が出ましたが、顧客価値・品質・納期のどれを優先するかで意見が分かれています。", thinkingPoint: "事実を比較可能な判断基準へ変換します。", visibleInformation: ["候補案はある", "品質下限が明文化されていない"], newlyRelevantActionIds: ["gov_scope_criteria", "gov_scope_matrix"], delayedEffects: [{ requiresAll: ["majorityChosen"], metricEffects: { stakeholderAlignment: -4, riskExposure: 4 }, text: "担当ごとの判断が衝突し、決め直しの調整が発生しました。", chainEffect: "権限不明の判断が後から手戻り" }], decisions: [
      decision({ id: "gov_majority", title: "多数決で決める", metricEffects: { schedule: 2, stakeholderAlignment: -3, trust: -2 }, setsFlags: { majorityChosen: true }, whatHappened: "多数派の案が採用されましたが、少数側の懸念が残りました。", why: "判断基準と責任者を合意しないまま票数に頼ったためです。", pmPoint: "多数決は権限や成功条件の代わりにはなりません。", chainEffect: "多数派の案に未解決リスクが残る" }),
      decision({ id: "gov_criteria", title: "判断基準を整理して比較する", requiresInformation: ["success_criteria"], hidesWhenMissing: false, metricEffects: { stakeholderAlignment: 5, riskExposure: -4, businessValue: 2 }, setsFlags: { criteriaKnown: true }, whatHappened: "顧客価値・品質下限・納期を同じ表で比較しました。", why: "先に成功条件を具体化したためです。", pmPoint: "基準がそろうと、意見の対立を選択肢の比較に変えられます。", chainEffect: "意見を比較可能な判断材料へ変換" }),
      decision({ id: "gov_defer", title: "判断を次週へ持ち越す", metricEffects: { schedule: -4, riskExposure: 4, stakeholderAlignment: -2 }, whatHappened: "決定は先送りされ、作業待ちが増えました。", why: "判断期限とエスカレーション条件を設定しなかったためです。", pmPoint: "保留する場合も、いつ誰が決めるかを明示します。", chainEffect: "保留が作業待ちへ波及" }),
    ] },
    { id: "record", timing: "第3週 / 全3週", title: "決定を確定する", situation: "リリース方針を確定する会議です。決めた内容を後から再解釈されない形で残す必要があります。", thinkingPoint: "判断者・基準・条件・記録をそろえて合意します。", visibleInformation: ["最終決定の期限", "決定後の実行担当"], newlyRelevantActionIds: ["gov_report_record"], decisions: [
      decision({ id: "gov_oral", title: "口頭で合意して進める", irreversible: true, metricEffects: { schedule: 3, stakeholderAlignment: -5, riskExposure: 5 }, whatHappened: "会議では合意しましたが、条件の解釈が分かれる余地が残りました。", why: "決定内容と責任者を記録しなかったためです。", pmPoint: "合意は記録されて初めて、次の行動へつながります。", chainEffect: "口頭合意が後の解釈差を生む" }),
      decision({ id: "gov_record", title: "判断者と条件を記録して確定する", requiresInformation: ["decision_owner", "success_criteria", "decision_record"], hidesWhenMissing: false, irreversible: true, metricEffects: { stakeholderAlignment: 7, riskExposure: -5, trust: 3 }, setsFlags: { decisionRecorded: true }, whatHappened: "判断者・基準・決定内容・条件を記録し、関係者へ共有しました。", why: "事実と判断の責任範囲を確認した上で文書化したためです。", pmPoint: "記録は監査のためだけでなく、チームが同じ判断を実行するために使います。", chainEffect: "意思決定が再現可能な合意になる" }),
      decision({ id: "gov_pm_sign", title: "PM名義で決定を通知する", irreversible: true, metricEffects: { schedule: 2, trust: -4, stakeholderAlignment: -4 }, whatHappened: "通知は早く出せましたが、決裁者との認識差が残りました。", why: "通知を承認の代わりに扱ったためです。", pmPoint: "発信者と決定者を混同しないようにします。", chainEffect: "通知は出たが責任の所在が曖昧" }),
    ] },
  ],
  reactionRules: [
    { stakeholderId: "takahashi", requiresAll: ["decisionRecorded"], text: "判断者と条件が記録されているので、責任を持って承認できます。" },
    { stakeholderId: "takahashi", text: "判断の基準と責任者を、次回は先に確認したいです。", fallback: true },
    { stakeholderId: "tanaka", requiresAll: ["criteriaKnown"], text: "品質下限が明確になり、開発側も実行に集中できます。" },
    { stakeholderId: "tanaka", text: "決定の条件が後から変わらない形で共有されると助かります。", fallback: true },
  ],
  resultConfig: {
    scoreWeights: { outcome: 0.3, decision: 0.4, information: 0.3 }, showPmStyle: false,
    learningActions: ["判断者と相談相手を分ける", "成功条件を比較可能にする", "決定内容と条件を記録する"],
    scoredInformation: [
      { id: "decision_scope", weight: 2, reviewHint: "何を決める場なのかを先に定義すると、議論が広がりません。" },
      { id: "decision_owner", weight: 2, reviewHint: "最終判断者を確認すると、PMが権限を代替せずに済みます。" },
      { id: "success_criteria", weight: 2, reviewHint: "複数の意見を比較するための基準をそろえます。" },
      { id: "approval_route", weight: 1, reviewHint: "承認経路を確認すると、決定の手戻りを防げます。" },
      { id: "decision_record", weight: 1, reviewHint: "判断者・条件・理由を記録すると、合意が実行可能になります。" },
    ], informationFullCreditRatio: 0.8,
    scoreMetrics: [{ key: "stakeholderAlignment", weight: 3 }, { key: "riskExposure", weight: 2 }, { key: "trust", weight: 1.5 }, { key: "schedule", weight: 1 }],
    finalMetricKeys: ["schedule", "quality", "trust", "teamHealth", "riskExposure"],
    outcomeSummary: [{ label: "意思決定", rules: [{ requiresAll: ["decisionRecorded"], status: "記録済み", tone: "positive" }], fallbackStatus: "要振り返り", fallbackTone: "warning" }, { label: "関係者合意", metric: "stakeholderAlignment" }, { label: "リスク", metric: "riskExposure" }, { label: "納期", metric: "schedule" }, { label: "信頼", metric: "trust" }],
  },
};
