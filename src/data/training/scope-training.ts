import type { ScenarioAction, ScenarioDecision, StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { statefulActionCategories } from "../scenarios/stateful-action-categories";

const action = (value: Partial<ScenarioAction> & Pick<ScenarioAction, "id" | "title" | "category" | "result">): ScenarioAction => ({ description: "要求と影響を整理する確認です。", availableFromTurn: 1, grantsInformation: [], repeatPolicy: value.conditionalOutcomes ? "per-turn" : "once", whyThisResult: "担当する情報源へ確認したためです。", ...value });
const decisionEvidence: Partial<Record<string, ScenarioDecision["evidence"]>> = {
  scp_discover: [{ areaId: "scope", elementId: "purpose", behavior: "purpose_confirmation", weight: 2 }, { areaId: "scope", elementId: "impact", behavior: "impact_analysis", weight: 2 }],
  scp_rank: [{ areaId: "scope", elementId: "value", behavior: "business_value_check", weight: 2 }, { areaId: "scope", elementId: "options", behavior: "alternative_proposal", weight: 2 }],
  scp_phase: [{ areaId: "scope", elementId: "baseline", behavior: "scope_baseline_reference", weight: 2 }, { areaId: "scope", elementId: "agreement", behavior: "written_agreement", weight: 2 }],
};
const decision = (value: Partial<ScenarioDecision> & Pick<ScenarioDecision, "id" | "title" | "whatHappened" | "why" | "pmPoint" | "chainEffect">): ScenarioDecision => ({ description: "確認した事実をもとに判断します。", metricEffects: {}, evidence: decisionEvidence[value.id] ?? [], ...value });

export const scopeTraining: StatefulScenarioDefinition = {
  id: "scope-training", title: "何を作り、何を作らないか？", description: "要求の目的と影響を分け、価値を守る範囲を合意する3ターンの練習です。", mode: "training", supportedDifficulties: ["guided", "standard", "challenge"], investigationBudget: { guided: 3, standard: 2, challenge: 2 }, primaryDomain: "scope", relatedDomains: ["schedule", "stakeholders", "finance"],
  initialMetrics: { schedule: 70, budget: 70, quality: 74, trust: 66, teamHealth: 72, businessValue: 62, riskExposure: 44, scopeStability: 46, stakeholderAlignment: 56 },
  initialFlags: { purposeKnown: false, impactKnown: false, priorityKnown: false, baselineSet: false, phasedOption: false, agreementRecorded: false },
  intro: { emphasizedHeadline: "要求の境界を作るPMです。", description: "顧客から追加機能の相談が来ました。目的と影響を確かめ、作るもの・作らないものを決めてください。", briefTitle: "顧客ポータル改善", phase: "要件定義", team: "PM・顧客・開発・営業", issueLabel: "現在の課題", issue: "要求の目的と範囲が曖昧", requestLabel: "顧客からの要望", request: "検索と帳票を一度に追加したい", risk: "要望をそのまま受けてスコープが膨らむ" },
  stakeholders: [{ id: "sato", name: "佐藤", role: "顧客担当者", priority: "現場の困りごとを解消したい", avatar: "佐" }, { id: "takahashi", name: "高橋", role: "顧客決裁者", priority: "事業価値と納期を守りたい", avatar: "高" }, { id: "tanaka", name: "田中", role: "開発リーダー", priority: "実現可能性と品質を守りたい", avatar: "田" }, { id: "mori", name: "森", role: "営業責任者", priority: "契約更新につながる価値を届けたい", avatar: "森" }], actionCategories: statefulActionCategories,
  information: [
    { id: "request_purpose", label: "要求の目的", detail: "問い合わせ対応の時間を減らすことが本来の目的です。", source: "佐藤へのヒアリング" },
    { id: "business_priority", label: "事業上の優先順位", detail: "検索の絞り込みが帳票より先に必要です。", source: "高橋への確認" },
    { id: "implementation_impact", label: "実装影響", detail: "検索は5日、帳票は追加で8日とテストが必要です。", source: "田中への確認" },
    { id: "scope_baseline", label: "現行スコープ", detail: "今回合意済みなのは検索の基本導線までです。", source: "要件整理" },
    { id: "release_window", label: "リリース余力", detail: "予定日に入れる追加作業は5日相当が上限です。", source: "スケジュール点検" },
    { id: "customer_flexibility", label: "調整余地", detail: "帳票は次回に分けても業務開始には影響しません。", source: "営業への確認" },
    { id: "phased_option", label: "段階対応案", detail: "検索を今回、帳票を次回とする案が成立します。", source: "スコープ整理" },
  ],
  actions: [
    action({ id: "scp_ask_sato_purpose", title: "要求の目的を聞く", category: "hearing", stakeholderId: "sato", question: "この追加機能で何を解決したいのですか？", grantsInformation: ["request_purpose"], result: "本来の目的は、問い合わせ対応の時間を減らすことだと分かりました。" }),
    action({ id: "scp_ask_takahashi_priority", title: "優先順位を聞く", category: "hearing", stakeholderId: "takahashi", question: "今回もっとも価値があるのはどの機能ですか？", grantsInformation: ["business_priority"], result: "検索の絞り込みが帳票より先に必要だと分かりました。" }),
    action({ id: "scp_ask_tanaka_impact", title: "開発影響を聞く", category: "hearing", stakeholderId: "tanaka", question: "検索と帳票の実装・テスト影響はどの程度ですか？", grantsInformation: ["implementation_impact"], result: "検索は5日、帳票は追加8日とテストが必要だと分かりました。" }),
    action({ id: "scp_schedule_window", title: "リリース余力を確認する", category: "schedule", grantsInformation: ["release_window"], result: "予定日に入れられる追加作業は5日相当が上限だと分かりました。" }),
    action({ id: "scp_schedule_backlog", title: "残作業を確認する", category: "schedule", grantsInformation: [], result: "現行作業は進んでいますが、追加要求の優先順位はまだ判断できません。" }),
    action({ id: "scp_risk_scope", title: "スコープ膨張リスクを整理する", category: "risk", grantsInformation: [], result: "要求を分解しないまま受けると、納期と品質の両方へ影響すると整理しました。" }),
    action({ id: "scp_risk_change", title: "変更条件を整理する", category: "risk", grantsInformation: [], result: "追加・削除・延期の判断条件を整理しましたが、価値の情報が不足しています。" }),
    action({ id: "scp_scope_baseline", title: "現行スコープを確認する", category: "scope", grantsInformation: ["scope_baseline"], result: "今回合意済みの範囲は検索の基本導線までだと確認しました。" }),
    action({ id: "scp_scope_option", title: "段階対応案を作る", category: "scope", grantsInformation: [], result: "方向性は見えましたが、目的・優先順位・影響が不足しており具体案にはできませんでした。", conditionalOutcomes: [{ requiresInformation: ["request_purpose", "business_priority", "implementation_impact"], grantsInformation: ["phased_option"], setsFlags: { phasedOption: true }, result: "検索を今回、帳票を次回へ分ける段階対応案を作成しました。", whyThisResult: "目的・優先順位・実装影響をそろえたため、価値を残す案にできました。" }] }),
    action({ id: "scp_team_load", title: "チーム負荷を確認する", category: "team", stakeholderId: "tanaka", grantsInformation: [], result: "開発チームは現行作業で余力が少なく、全機能同時対応は危険だと分かりました。" }),
    action({ id: "scp_team_skill", title: "担当スキルを確認する", category: "team", stakeholderId: "tanaka", grantsInformation: [], result: "検索と帳票では必要なスキルが異なり、同じ担当へ集中させると遅延します。" }),
    action({ id: "scp_report_customer", title: "顧客へ影響を共有する", category: "report", stakeholderId: "sato", grantsInformation: [], result: "要望を分解して確認中であることを顧客へ共有しました。" }),
    action({ id: "scp_report_sales", title: "営業へ価値を共有する", category: "report", stakeholderId: "mori", grantsInformation: ["customer_flexibility"], result: "帳票を次回へ分けても業務開始に影響しないと分かりました。" }),
  ],
  turns: [
    { id: "purpose", timing: "第1週 / 全3週", title: "追加要求が届く", situation: "検索と帳票を一度に追加してほしいという依頼が来ました。目的と実装影響はまだ不明です。", thinkingPoint: "要求の文面ではなく、何を実現したいのかを確かめます。", visibleInformation: ["検索と帳票の追加要求", "予定日は変えたくない"], newlyRelevantActionIds: ["scp_ask_sato_purpose", "scp_ask_tanaka_impact"], decisions: [
      decision({ id: "scp_accept", title: "2機能をそのまま受け入れる", irreversible: true, metricEffects: { scopeStability: -8, schedule: -7, quality: -4, trust: 3 }, whatHappened: "要求を一括で受け入れ、顧客の反応は良くなりました。", why: "目的と影響を確認する前に範囲を固定したためです。", pmPoint: "要求を受ける前に、目的と実現コストを分けて確認します。", chainEffect: "曖昧な要求がスコープとして固定" }),
      decision({ id: "scp_discover", title: "目的と影響を確認して回答を保留する", metricEffects: { riskExposure: -3, stakeholderAlignment: 3 }, setsFlags: { purposeKnown: true }, whatHappened: "確認期限を伝え、要求の目的と影響を調べる時間を確保しました。", why: "範囲を決める前に事実を集めたためです。", pmPoint: "保留は拒否ではなく、判断の質を上げるための行動です。", chainEffect: "スコープ判断の材料を確保" }),
      decision({ id: "scp_reject", title: "追加要求を断る", metricEffects: { schedule: 3, scopeStability: 4, trust: -5 }, whatHappened: "現行範囲は守れましたが、顧客の目的は確認されませんでした。", why: "作らない範囲を決める前に目的を閉じたためです。", pmPoint: "作らない判断でも、目的を確認すると別案を残せます。", chainEffect: "範囲は安定したが価値の確認を失った" }),
    ] },
    { id: "priority", timing: "第2週 / 全3週", title: "優先順位を整理する", situation: "検索は5日、帳票は追加8日と分かりました。限られたリリース余力では全てを同時に入れられません。", thinkingPoint: "目的・優先順位・影響を一つの比較にします。", visibleInformation: ["追加作業の影響が見え始めた", "全てを同時に入れる余力はない"], newlyRelevantActionIds: ["scp_scope_option", "scp_schedule_window"], delayedEffects: [{ requiresAll: ["scopeStability"], metricEffects: { schedule: -3, quality: -3 }, text: "範囲を確認しないまま作業が増え、テスト余力が減りました。", chainEffect: "スコープ未整理が品質確認へ波及" }], decisions: [
      decision({ id: "scp_all", title: "全機能を優先する", metricEffects: { businessValue: 2, schedule: -8, quality: -6, teamHealth: -5, scopeStability: -6 }, whatHappened: "全機能を優先しましたが、納期と品質の余裕が減りました。", why: "価値の優先順位を確認せず、機能数を価値とみなしたためです。", pmPoint: "全てを守るのではなく、目的に直結する価値を特定します。", chainEffect: "機能数の優先が日程・品質を圧迫" }),
      decision({ id: "scp_rank", title: "目的と影響から優先順位を決める", requiresInformation: ["request_purpose", "business_priority", "implementation_impact"], metricEffects: { businessValue: 4, scopeStability: 4, stakeholderAlignment: 3, riskExposure: -3 }, setsFlags: { priorityKnown: true }, whatHappened: "検索を先行し、帳票を後続にする優先順位を整理しました。", why: "目的・事業優先度・実装影響を同時に比較したためです。", pmPoint: "優先順位は声の大きさではなく、価値と影響で説明します。", chainEffect: "要求が価値単位の候補へ分解された" }),
      decision({ id: "scp_defer", title: "全てを次回へ送る", metricEffects: { schedule: 3, scopeStability: 2, businessValue: -5, trust: -3 }, whatHappened: "日程余力は守りましたが、今回届けられる価値も失いました。", why: "目的と段階案を確認せず、全てを延期したためです。", pmPoint: "スコープ管理は削ることではなく、価値を残すことです。", chainEffect: "安全策が顧客価値を過度に縮小" }),
    ] },
    { id: "agreement", timing: "第3週 / 全3週", title: "範囲を合意する", situation: "今回と次回の範囲を確定し、顧客・営業・開発が同じ約束で動ける状態を作ります。", thinkingPoint: "何を作り、何を作らないかを理由と期限つきで記録します。", visibleInformation: ["検索を先行できる可能性", "帳票を次回へ分ける選択肢"], newlyRelevantActionIds: ["scp_scope_option", "scp_report_sales"], decisions: [
      decision({ id: "scp_oral", title: "口頭で範囲を合意する", metricEffects: { schedule: 2, stakeholderAlignment: -4, riskExposure: 4 }, whatHappened: "会話では合意しましたが、次回範囲の解釈が残りました。", why: "In/Outと期限を記録しなかったためです。", pmPoint: "範囲合意は文書化して初めて変更管理につながります。", chainEffect: "口頭合意が後の追加要求を招く" }),
      decision({ id: "scp_phase", title: "段階対応を正式に合意する", requiresInformation: ["phased_option", "customer_flexibility"], hidesWhenMissing: false, irreversible: true, metricEffects: { schedule: 4, quality: 4, businessValue: 4, scopeStability: 5, stakeholderAlignment: 5, trust: 2 }, setsFlags: { agreementRecorded: true, baselineSet: true }, whatHappened: "検索を今回、帳票を次回とし、期限と範囲を記録して合意しました。", why: "価値・影響・顧客の調整余地をそろえていたためです。", pmPoint: "段階リリースは削減ではなく、価値を守るためのスコープ設計です。", chainEffect: "範囲と次の約束が明文化された" }),
      decision({ id: "scp_pm_scope", title: "PMが範囲を一方的に決める", irreversible: true, metricEffects: { schedule: 3, scopeStability: 2, stakeholderAlignment: -7, trust: -4 }, whatHappened: "範囲は早く決まりましたが、関係者の納得が不足しました。", why: "決裁者と合意条件を確認せずに決めたためです。", pmPoint: "PMは合意を設計し、関係者の権限を代替しません。", chainEffect: "早い決定が関係者調整の手戻りを生む" }),
    ] },
  ],
  reactionRules: [{ stakeholderId: "sato", requiresAll: ["agreementRecorded"], text: "今回と次回の範囲が分かり、顧客へ説明しやすくなりました。" }, { stakeholderId: "sato", text: "目的に沿った範囲を、もっと早く共有してほしかったです。", fallback: true }, { stakeholderId: "tanaka", requiresAll: ["baselineSet"], text: "作業範囲が明確になり、品質を守って進められます。" }, { stakeholderId: "tanaka", text: "範囲の変更は早めに相談してほしいです。", fallback: true }],
  resultConfig: { scoredInformation: [{ id: "request_purpose", weight: 2, reviewHint: "要求の背景ではなく、解決したい目的を確認します。" }, { id: "business_priority", weight: 2, reviewHint: "価値の高い順に範囲を並べ替えます。" }, { id: "implementation_impact", weight: 2, reviewHint: "実装・テスト影響を確認してから範囲を決めます。" }, { id: "phased_option", weight: 2, reviewHint: "段階対応は、目的と影響をそろえて初めて具体化できます。" }, { id: "customer_flexibility", weight: 1 }], informationFullCreditRatio: 0.8, scoreMetrics: [{ key: "scopeStability", weight: 3 }, { key: "businessValue", weight: 2 }, { key: "quality", weight: 2 }, { key: "schedule", weight: 1 }, { key: "trust", weight: 1 }], finalMetricKeys: ["schedule", "quality", "trust", "teamHealth", "riskExposure"], outcomeSummary: [{ label: "スコープ", rules: [{ requiresAll: ["agreementRecorded"], status: "合意済み", tone: "positive" }], fallbackStatus: "要振り返り", fallbackTone: "warning" }, { label: "事業価値", metric: "businessValue" }, { label: "納期", metric: "schedule" }, { label: "品質", metric: "quality" }, { label: "顧客信頼", metric: "trust" }] },
};
