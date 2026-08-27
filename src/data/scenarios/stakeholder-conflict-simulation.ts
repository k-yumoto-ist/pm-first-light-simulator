import type { StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { stakeholderConflictActionSpace } from "./stakeholder-conflict-action-space";
import { statefulActionCategories } from "./stateful-action-categories";

export const stakeholderConflictSimulation: StatefulScenarioDefinition = {
  id: "stakeholder-conflict-simulation", title: "顧客同士が揉めている", description: "営業・運用・情シスの異なる目的を整理し、誰が何を基準に決めるかを作る5ターンの実践シミュレーションです。", mode: "project", supportedDifficulties: ["guided", "standard", "challenge"], primaryDomain: "stakeholders", relatedDomains: ["scope", "governance", "risk", "schedule"],
  initialMetrics: { schedule: 64, budget: 72, quality: 70, trust: 48, teamHealth: 68, businessValue: 64, riskExposure: 52, scopeStability: 70, stakeholderAlignment: 36 },
  initialFlags: { oneSidedChoice: false, majorityDecision: false, decisionOwnerKnown: false, optionsPrepared: false, agreementRecorded: false, conditionalRollout: false, finalAgreement: false },
  intro: { emphasizedHeadline: "異なる目的を意思決定へ変えるPMです。", description: "営業は早期公開、運用は安定性、情シスは管理負荷の削減を求めています。誰に何を聞き、どの条件で合意を作るかを判断してください。", briefTitle: "顧客向け新機能導入", phase: "導入方針の最終調整", team: "PM・営業・運用・情シス・開発・顧客", issueLabel: "現在の課題", issue: "関係者間の導入方針の対立", requestLabel: "対立している要望", request: "早期公開・安定性・管理負荷削減", risk: "成功条件と判断者が未確定" },
  stakeholders: [
    { id: "mori", name: "森", role: "営業責任者", priority: "期末までの利用開始数を増やしたい", avatar: "森" },
    { id: "nakamura", name: "中村", role: "運用責任者", priority: "障害と切り戻し不能な状態を避けたい", avatar: "中" },
    { id: "kobayashi", name: "小林", role: "情シス責任者", priority: "管理工数と例外対応を増やしたくない", avatar: "小" },
    { id: "takahashi", name: "高橋", role: "事業責任者", priority: "事業価値とリスクの着地点を決めたい", avatar: "高" },
    { id: "suzuki", name: "鈴木", role: "開発担当", priority: "技術的に安全な導入単位を作りたい", avatar: "鈴" },
  ], actionCategories: statefulActionCategories,
  information: [
    { id: "sales_goal", label: "営業が守りたい成果", detail: "早期公開そのものより、期末までの利用開始数を重視している。", source: "森へのヒアリング" },
    { id: "sales_flexibility", label: "営業側の調整可能な幅", detail: "重点顧客から始めるなら、全面公開でなくても営業説明ができる。", source: "森へのヒアリング" },
    { id: "operations_goal", label: "運用が守りたい条件", detail: "障害時に検知・切り戻しできない状態を避けたい。", source: "中村へのヒアリング" },
    { id: "operations_conditions", label: "運用が受け入れる条件", detail: "監視・切り戻し手順・対象限定がそろえば条件付き導入を検討できる。", source: "中村へのヒアリング" },
    { id: "it_goal", label: "情シスの負荷要因", detail: "アカウント設定、問い合わせ一次対応、例外処理が主な負荷。", source: "小林へのヒアリング" },
    { id: "it_conditions", label: "情シスが受け入れる条件", detail: "対象部門限定と問い合わせ窓口分離で、管理負荷を抑えられる。", source: "小林へのヒアリング" },
    { id: "technical_option", label: "技術的な段階導入単位", detail: "対象部門限定と監視設定の先行で、技術的に段階導入できる。", source: "鈴木へのヒアリング" },
    { id: "decision_owner", label: "最終意思決定者", detail: "利用開始数・障害リスク・運用負荷を基準に高橋が最終判断する。", source: "高橋へのヒアリング" },
    { id: "decision_window", label: "意思決定期限", detail: "今週中に方針を決めないと、限定導入の準備期間が失われる。", source: "スケジュール点検" },
    { id: "rollout_timeline", label: "案ごとの導入日程", detail: "限定導入なら予定日に始められ、全面導入には追加運用準備が必要。", source: "スケジュール点検" },
    { id: "cross_risk", label: "部門横断のリスク", detail: "早期公開への期待、切り戻し、管理工数を同じ比較軸で扱う必要がある。", source: "リスク整理" },
    { id: "guardrails", label: "条件付き導入の安全策", detail: "監視指標、切り戻し条件、対象範囲、運用窓口を導入条件にする。", source: "リスク整理" },
    { id: "success_criteria", label: "共通の成功条件", detail: "利用開始数を確認しつつ、重大障害と管理負荷を増やさない。", source: "要件・スコープ整理" },
    { id: "comparison_options", label: "比較可能な導入案", detail: "全面・限定・条件付き・延期を、価値・負荷・品質・日程で比較する。", source: "要件・スコープ整理" },
    { id: "conflict_map", label: "対立の構造", detail: "営業・運用・情シスの主張と未確認条件を分けて整理した。", source: "チーム状況確認" },
  ], actions: stakeholderConflictActionSpace,
  turns: [
    { id: "conflict", timing: "第1週 / 全5週", title: "対立が表面化する", situation: "営業は早期公開、運用は安定性、情シスは管理負荷削減を求め、会議が進みません。誰の意見もそれぞれ正当です。", thinkingPoint: "主張を採用する前に、誰から何を確認しますか。", visibleInformation: ["営業・運用・情シスの意見が対立", "最終判断者と成功条件が未確定"], newlyRelevantActionIds: ["scf_ask_sales_goal", "scf_ask_ops_goal", "scf_ask_it_goal"], decisions: [
      { id: "side_sales", title: "営業の要望を優先する", description: "早期公開を優先し、他部門へ協力を求めます。", metricEffects: { schedule: 3, businessValue: 2, trust: -5, stakeholderAlignment: -8, riskExposure: 5 }, setsFlags: { oneSidedChoice: true }, evidence: [], whatHappened: "営業の期待には応えましたが、運用と情シスの条件は未解決のまま残りました。", why: "各者の目的と制約を確認せず、一部門の主張を全体方針にしたためです。", pmPoint: "対立では、声の大きさではなく目的・制約・影響を整理します。", chainEffect: "一部門を優先した期待差が残った" },
      { id: "listen_first", title: "各者の目的を確認してから進める", description: "営業・運用・情シスが守りたい成果を聞きます。", metricEffects: { trust: 3, stakeholderAlignment: 4, riskExposure: -2 }, setsFlags: { perspectivesCollected: true }, evidence: [{ areaId: "stakeholders", elementId: "analysis", behavior: "stakeholder_analysis", weight: 2 }, { areaId: "stakeholders", elementId: "purpose", behavior: "purpose_confirmation", weight: 2 }], whatHappened: "意見の対立を、各部門が守りたい目的と制約として整理する時間を確保しました。", why: "結論を急がず、複数の情報源から状況を見る方針にしたためです。", pmPoint: "関係者分析は、誰が正しいかではなく何を大切にしているかを見ます。", chainEffect: "複数の目的を比較する準備を開始" },
      { id: "majority_vote", title: "多数決で方針を決める", description: "会議の参加者が多い案を採用して前へ進めます。", metricEffects: { schedule: 2, stakeholderAlignment: -6, trust: -3, riskExposure: 3 }, setsFlags: { majorityDecision: true }, evidence: [], whatHappened: "結論は早まりましたが、少数側が持つ運用条件と責任は残りました。", why: "利害と判断権限を整理せず、人数だけで意思決定したためです。", pmPoint: "合意は賛成者の数だけでなく、影響を受ける人の条件を含みます。", chainEffect: "多数決による未解決の懸念を残した" },
    ] },
    { id: "goals", timing: "第2週 / 全5週", title: "主張の奥にある目的を探る", situation: "営業は利用開始数、運用は切り戻し、情シスは管理工数を気にしていることが見え始めました。", thinkingPoint: "各者の目的を、共通の判断材料へどう変換しますか。", visibleInformation: ["部門ごとに異なる正当な目的がある", "導入方法には複数の形があり得る"], newlyRelevantActionIds: ["scf_scope_success", "scf_risk_map", "scf_ask_ops_conditions"], delayedEffects: [
      { requiresAll: ["oneSidedChoice"], metricEffects: { trust: -4, stakeholderAlignment: -5, riskExposure: 3 }, text: "運用と情シスが、自分たちの条件を扱う場がないと感じ始めました。", chainEffect: "一部門優先が対立を深めた" },
      { requiresAll: ["majorityDecision"], metricEffects: { schedule: -3, stakeholderAlignment: -4 }, text: "少数側の懸念が再提起され、決定内容の再説明に時間が必要になりました。", chainEffect: "多数決の未解決条件が日程へ波及" },
    ], decisions: [
      { id: "make_success_criteria", title: "共通の成功条件を作る", description: "利用開始、安定性、管理負荷を同時に評価できる基準を整理します。", requiresInformation: ["sales_goal", "operations_goal", "it_goal"], hidesWhenMissing: true, metricEffects: { businessValue: 4, stakeholderAlignment: 6, riskExposure: -3 }, setsFlags: { successCriteriaDefined: true }, evidence: [{ areaId: "stakeholders", elementId: "purpose", behavior: "purpose_confirmation", weight: 2 }, { areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 1 }], whatHappened: "各部門の要求を、共通の成功条件として比較できるようにしました。", why: "複数の目的を確認していたため、主張の勝ち負けではなく成果で議論できました。", pmPoint: "対立を前へ進めるには、全員が同じ意味で使える成功条件を作ります。", chainEffect: "判断の比較軸を獲得" },
      { id: "pm_priority", title: "PMが優先順位を決める", description: "会議を終わらせるため、PMが公開方針を決めます。", metricEffects: { schedule: 2, trust: -3, stakeholderAlignment: -5 }, setsFlags: { pmUnilateral: true }, evidence: [], whatHappened: "進め方は決まりましたが、判断根拠と権限への疑問が残りました。", why: "PMが意思決定を支援する役割を越え、関係者の判断を代替したためです。", pmPoint: "PMは結論を急ぐより、判断できる状態を整えます。", chainEffect: "判断は早いが納得が弱い" },
      { id: "postpone", title: "対立が収まるまで保留する", description: "意見が一致するまで結論を出しません。", metricEffects: { schedule: -5, riskExposure: 3 }, setsFlags: { decisionDelayed: true }, evidence: [], whatHappened: "対立は残ったまま、限定導入を準備できる時間が減りました。", why: "追加情報と判断期限を設けず、保留だけを選んだためです。", pmPoint: "難しい合意ほど、確認事項と判断期限をセットにします。", chainEffect: "判断の余地を時間経過で失った" },
    ] },
    { id: "authority", timing: "第3週 / 全5週", title: "誰が何を基準に決めるか", situation: "比較案は作れそうですが、誰が最終判断し、何を成功とみなすのかがまだ曖昧です。", thinkingPoint: "意思決定権と比較軸をどうそろえますか。", visibleInformation: ["複数案を比較する余地がある", "判断者と基準が曖昧"], newlyRelevantActionIds: ["scf_ask_owner", "scf_scope_options", "scf_schedule_window"], delayedEffects: [
      { requiresAll: ["decisionDelayed"], metricEffects: { schedule: -3, businessValue: -2 }, text: "限定導入の準備期限が近づき、選べる案が減り始めました。", chainEffect: "保留が比較可能な選択肢を減らした" },
    ], decisions: [
      { id: "clarify_owner", title: "判断者と比較軸を明確にする", description: "決裁者、成功条件、判断期限をそろえます。", requiresInformation: ["success_criteria", "decision_window"], hidesWhenMissing: true, metricEffects: { trust: 4, stakeholderAlignment: 5, riskExposure: -4 }, setsFlags: { decisionOwnerKnown: true }, evidence: [{ areaId: "governance", elementId: "rights", behavior: "decision_rights_clarification", weight: 2 }, { areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 1 }], whatHappened: "誰が、どの成果を基準に、いつ決めるかを明確にしました。", why: "成功条件と時間制約を確認していたため、権限だけでなく判断の枠組みも整理できました。", pmPoint: "意思決定は、判断者・基準・期限をそろえて初めて進められます。", chainEffect: "最終合意に必要な意思決定構造を確立" },
      { id: "choose_one", title: "一部門の案を採用する", description: "最も緊急度が高い部門の案をそのまま採用します。", metricEffects: { schedule: 2, businessValue: 1, trust: -5, stakeholderAlignment: -6 }, setsFlags: { oneSidedChoice: true }, evidence: [], whatHappened: "一つの目的は満たせましたが、他部門の条件が後から問題になりました。", why: "共通の成功条件と判断権限を確認せず、一部の案に寄せたためです。", pmPoint: "対立では勝者を決めるより、全体の成功条件を作ります。", chainEffect: "一部門に寄せた未解決条件が残った" },
      { id: "ask_dev_to_decide", title: "開発へ最終判断を任せる", description: "技術的に最も詳しい担当へ導入方針を委ねます。", metricEffects: { quality: 1, trust: -4, stakeholderAlignment: -5 }, setsFlags: { ownershipUnresolved: true }, evidence: [], whatHappened: "技術案は出ましたが、事業価値と運用負荷を含む最終判断はできませんでした。", why: "技術的な実現可能性と、部門横断の意思決定権を混同したためです。", pmPoint: "専門家の分析を生かしつつ、最終判断の権限は明確にします。", chainEffect: "判断権限が未解決のまま残った" },
    ] },
    { id: "options", timing: "第4週 / 全5週", title: "複数案を比較する", situation: "全面導入、対象限定、条件付き導入、延期という案が見えてきました。どの案も、守れるものと失うものがあります。", thinkingPoint: "誰の目的を、どの条件で両立させる案を作りますか。", visibleInformation: ["全面導入だけが選択肢ではない", "導入条件を決めなければ運用リスクは残る"], newlyRelevantActionIds: ["scf_ask_dev_feasibility", "scf_risk_guardrails", "scf_schedule_rollout"], delayedEffects: [
      { requiresAll: ["ownershipUnresolved"], metricEffects: { trust: -3, schedule: -2 }, text: "最終判断者が曖昧なため、比較案へのコメントが何度も往復しました。", chainEffect: "権限の未整理が調整コストを増加" },
      { requiresAll: ["oneSidedChoice"], metricEffects: { stakeholderAlignment: -4, riskExposure: 3 }, text: "置き去りになった部門の条件が、導入案の前提として再浮上しました。", chainEffect: "一部門優先が案の実現性を下げた" },
    ], decisions: [
      { id: "prepare_conditional", title: "条件付き段階導入案を作る", description: "対象限定、監視、切り戻し、窓口分離を組み合わせます。", requiresInformation: ["sales_flexibility", "operations_conditions", "it_conditions", "technical_option"], hidesWhenMissing: true, metricEffects: { businessValue: 5, stakeholderAlignment: 7, riskExposure: -6, quality: 2 }, setsFlags: { conditionalRollout: true, optionsPrepared: true }, evidence: [{ areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 2 }, { areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 2 }, { areaId: "risk", elementId: "response", behavior: "risk_response_planning", weight: 1 }], whatHappened: "各部門の条件を組み合わせ、価値と安全性を両立する段階導入案を作りました。", why: "営業・運用・情シス・開発の条件を集めていたためです。", pmPoint: "良い代替案は、誰かの希望をそのまま採用せず、複数の制約を設計に変えます。", chainEffect: "複数目的を満たす条件付き案を獲得" },
      { id: "full_rollout", title: "全面導入を提案する", description: "利用開始数を優先し、全対象へ一度に公開します。", irreversible: true, metricEffects: { businessValue: 4, schedule: 2, riskExposure: 7, stakeholderAlignment: -4 }, setsFlags: { fullRolloutPromised: true }, evidence: [{ areaId: "business-value", elementId: "value", behavior: "business_value_check", weight: 1 }], whatHappened: "利用開始の期待には応えましたが、運用と情シスの負荷条件が残りました。", why: "公開範囲を先に決め、導入条件を十分に設計しなかったためです。", pmPoint: "事業価値を優先する場合も、運用可能な条件を同時に設計します。", chainEffect: "全面公開の約束が導入条件を固定" },
      { id: "delay_everything", title: "全面延期を提案する", description: "対立を避けるため、全条件がそろうまで公開しません。", metricEffects: { quality: 3, schedule: -6, businessValue: -4, trust: -2 }, setsFlags: { broadDelay: true }, evidence: [{ areaId: "risk", elementId: "response", behavior: "risk_response_planning", weight: 1 }], whatHappened: "運用リスクは抑えられましたが、利用開始の機会と関係者の勢いを失いました。", why: "条件を分けず、公開可否を一つの二択として扱ったためです。", pmPoint: "延期も、守るものと次の判断条件を明確にして提案します。", chainEffect: "安全性と引き換えに事業機会を先送り" },
    ] },
    { id: "agreement", timing: "第5週 / 全5週", title: "最終合意を確定する", situation: "方針を決める期限です。決定内容だけでなく、判断者・条件・見直し方法を残さなければ、対立は次の場面で繰り返されます。", thinkingPoint: "誰が、何を基準に、どの条件で合意したことにしますか。", visibleInformation: ["合意は決定内容と条件の両方が必要", "口頭合意だけでは解釈差が残る"], newlyRelevantActionIds: ["scf_report_record", "scf_report_share", "scf_ask_owner"], decisions: [
      { id: "recorded_agreement", title: "決裁者による条件付き合意を記録する", description: "決裁者、成功条件、対象範囲、切り戻し条件、見直し時期を文書で確定します。", requiresInformation: ["decision_owner", "success_criteria", "comparison_options"], hidesWhenMissing: true, irreversible: true, metricEffects: { trust: 7, stakeholderAlignment: 8, riskExposure: -6, businessValue: 3 }, setsFlags: { finalAgreement: true, agreementRecorded: true }, evidence: [{ areaId: "governance", elementId: "rights", behavior: "decision_rights_clarification", weight: 2 }, { areaId: "stakeholders", elementId: "record", behavior: "written_agreement", weight: 2 }, { areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 2 }], conditionalOutcomes: [{ requiresAll: ["conditionalRollout", "guardrailsPrepared"], metricEffects: { quality: 4, riskExposure: -4, businessValue: 3 }, resultSuffix: "段階導入案と安全策がそろっていたため、実行可能な合意として受け止められました。", chainEffect: "条件付き導入を合意で固定し、実行に移せる状態になった" }], whatHappened: "高橋が複数部門の条件を比較し、条件付きの導入方針を文書で合意しました。", why: "判断者、成功条件、比較案をそろえたためです。", pmPoint: "合意形成は、決める人・判断基準・条件・記録までそろえて完成します。", chainEffect: "関係者が参照できる最終合意を確立" },
      { id: "verbal_agreement", title: "会議で合意したことにする", description: "話し合いの流れを止めず、記録は後で整えます。", irreversible: true, metricEffects: { trust: 1, stakeholderAlignment: -2, riskExposure: 3 }, setsFlags: { verbalAgreement: true }, evidence: [{ areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 1 }], whatHappened: "会議では前へ進みましたが、対象範囲と見直し条件の解釈が残りました。", why: "決定内容と責任範囲を文書化しなかったためです。", pmPoint: "重要な合意は、会話の記憶ではなく参照できる記録に残します。", chainEffect: "口頭合意による解釈差を残した" },
      { id: "pm_announce", title: "PM判断として方針を発表する", description: "調整を終えるため、PMが最終方針を決めて通知します。", irreversible: true, metricEffects: { schedule: 2, trust: -5, stakeholderAlignment: -6 }, setsFlags: { pmUnilateral: true }, evidence: [], whatHappened: "発表は早くできましたが、決裁者と一部部門の納得を得られませんでした。", why: "PMが合意を支援する役割を越え、最終判断を代替したためです。", pmPoint: "PMは決定を急ぐより、決裁者が責任を持って決められる状態を作ります。", chainEffect: "迅速な通知と引き換えに合意が弱い" },
    ] },
  ],
  reactionRules: [
    { stakeholderId: "mori", requiresAll: ["conditionalRollout"], text: "重点顧客から利用開始できる案なら、営業としても成果を説明できます。" },
    { stakeholderId: "mori", requiresAll: ["broadDelay"], text: "利用開始の機会を逃した理由を、顧客へ説明する必要があります。" },
    { stakeholderId: "mori", text: "利用開始数の背景まで確認してもらえると、営業側も調整しやすいです。", fallback: true },
    { stakeholderId: "nakamura", requiresAll: ["guardrailsPrepared"], text: "監視と切り戻し条件があるので、運用として受け入れを検討できます。" },
    { stakeholderId: "nakamura", requiresAll: ["fullRolloutPromised"], text: "全面公開の前に、障害時の対応条件を確認したかったです。" },
    { stakeholderId: "nakamura", text: "安定性の条件を早めに比較案へ入れてほしいです。", fallback: true },
    { stakeholderId: "kobayashi", requiresAll: ["conditionalRollout"], text: "対象と窓口が限定されれば、管理負荷を見通せます。" },
    { stakeholderId: "kobayashi", text: "情シスの実務負荷も、判断の比較軸に含めてください。", fallback: true },
    { stakeholderId: "takahashi", requiresAll: ["finalAgreement"], text: "判断基準と条件が整理されていたので、責任を持って決裁できました。" },
    { stakeholderId: "takahashi", requiresAll: ["pmUnilateral"], text: "判断材料はありましたが、決裁の責任範囲が曖昧でした。" },
    { stakeholderId: "takahashi", text: "最終判断には、比較案と各部門の条件をそろえてほしいです。", fallback: true },
  ],
  resultConfig: { scoredInformation: [
    { id: "sales_goal", weight: 2 }, { id: "operations_goal", weight: 2 }, { id: "it_goal", weight: 2 },
    { id: "success_criteria", weight: 2, reviewHint: "営業・運用・情シスの目的を確認してから整理すると、共通の成功条件を作れました。" },
    { id: "decision_owner", weight: 1 }, { id: "technical_option", weight: 1 }, { id: "rollout_timeline", weight: 1 },
  ], informationFullCreditRatio: 0.8, scoreMetrics: [{ key: "stakeholderAlignment", weight: 2 }, { key: "businessValue", weight: 2 }, { key: "trust", weight: 1.5 }, { key: "riskExposure", weight: 1.5 }, { key: "schedule", weight: 1 }], finalMetricKeys: ["schedule", "quality", "trust", "teamHealth", "riskExposure", "stakeholderAlignment", "businessValue"], outcomeSummary: [
    { label: "合意状態", rules: [{ requiresAll: ["finalAgreement"], status: "条件付き合意", tone: "positive" }, { requiresAll: ["verbalAgreement"], status: "口頭合意", tone: "warning" }, { requiresAll: ["pmUnilateral"], status: "PM判断", tone: "warning" }], fallbackStatus: "判断完了", fallbackTone: "neutral" },
    { label: "関係者合意", metric: "stakeholderAlignment" }, { label: "事業価値", metric: "businessValue" }, { label: "顧客信頼", metric: "trust" }, { label: "リスク", metric: "riskExposure" },
  ] },
};
