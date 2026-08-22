import type { StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { scenarioActionCategories, scopeChangeActionSpace } from "./scope-change-action-space";

export const scopeChangeSimulation: StatefulScenarioDefinition = {
  id: "scope-change-simulation",
  title: "リリース直前の追加要件",
  description: "限られた時間で情報を集め、顧客価値・納期・品質・チーム負荷の着地点をつくる5ターンの実践シミュレーションです。",
  mode: "project",
  supportedDifficulties: ["guided", "standard", "challenge"],
  primaryDomain: "scope",
  relatedDomains: ["schedule", "stakeholders", "risk", "resources"],
  initialMetrics: { schedule: 72, budget: 72, quality: 76, trust: 64, teamHealth: 70, businessValue: 68, riskExposure: 38, scopeStability: 74, stakeholderAlignment: 58 },
  initialFlags: {
    formalCommitment: false, requestAccepted: false, impactShared: false, decisionOwnerKnown: false,
    alternativePrepared: false, agreementRecorded: false, overtimePromised: false, phasedRelease: false,
  },
  stakeholders: [
    { id: "sato", name: "佐藤", role: "顧客担当者", priority: "大口顧客の要望を実現したい", avatar: "佐" },
    { id: "takahashi", name: "高橋", role: "顧客決裁者", priority: "発表済みの納期と事業成果を守りたい", avatar: "高" },
    { id: "mori", name: "森", role: "営業責任者", priority: "契約更新と顧客関係を守りたい", avatar: "森" },
    { id: "tanaka", name: "田中", role: "開発リーダー", priority: "実現可能性と品質を守りたい", avatar: "田" },
    { id: "suzuki", name: "鈴木", role: "実装担当", priority: "無理のない負荷で確実に完成させたい", avatar: "鈴" },
  ],
  actionCategories: scenarioActionCategories,
  information: [
    { id: "request_background", label: "追加要件の背景", detail: "契約更新を検討中の大口顧客から、検索条件の追加を求められている。", source: "佐藤へのヒアリング" },
    { id: "real_priority", label: "顧客の本当の優先順位", detail: "検索条件すべてではなく、特定業種の絞り込みが最重要。", source: "佐藤への具体的な確認" },
    { id: "implementation_impact", label: "実装影響", detail: "実装2日という見立てに対し、API・回帰テストを含めると7営業日必要。", source: "田中との影響確認" },
    { id: "schedule_bottleneck", label: "日程上のボトルネック", detail: "検索APIの修正がクリティカルパス上の総合テスト開始を遅らせる。", source: "スケジュール点検" },
    { id: "sales_context", label: "営業上の影響", detail: "契約更新への影響はあるが、全機能を今回入れることまでは約束していない。", source: "森へのヒアリング" },
    { id: "decision_owner", label: "最終意思決定者", detail: "追加要件とリリース条件の最終判断は顧客部長の高橋が行う。", source: "意思決定構造の確認" },
    { id: "team_load", label: "チーム負荷", detail: "直近2週間ですでに残業が続き、追加対応をそのまま載せるとレビュー時間が削られる。", source: "チーム状況確認" },
    { id: "release_option", label: "段階リリース案", detail: "最重要の検索条件だけを先行し、残りを次回へ送る案なら納期とテスト時間を両立できる。", source: "要件・スコープ整理" },
    { id: "success_criteria", label: "リリース成功条件", detail: "高橋は全機能より、既存顧客へ障害を起こさないことと契約更新への説明可能性を重視している。", source: "高橋との確認" },
  ],
  actions: scopeChangeActionSpace,
  turns: [
    {
      id: "request", timing: "WEEK 10 / 12", title: "『小さな追加』が届く", situation: "佐藤から『検索条件を1つ増やしてほしい。大きな変更ではないと思う』と連絡が来ました。リリースまで2週間です。", thinkingPoint: "要望を受ける前に、何を知らなければ判断できないでしょうか。", visibleInformation: ["依頼は検索条件の追加", "顧客は納期厳守を求めている"], newlyRelevantActionIds: ["ask_sato_background", "ask_tanaka_impact", "schedule_critical_path"],
      decisions: [
        { id: "accept_now", title: "その場で追加を正式に受け入れる", description: "顧客への即応を優先し、現行リリースへ追加します。", irreversible: true, metricEffects: { trust: 6, schedule: -7, quality: -3, teamHealth: -4, scopeStability: -8, riskExposure: 6 }, setsFlags: { requestAccepted: true, formalCommitment: true }, evidence: [], whatHappened: "追加要件を正式に受け入れ、顧客の反応は一時的に良くなりました。", why: "影響を確認する前に約束したため、作業量と期待値が固定されました。", pmPoint: "即答は信頼を上げることもありますが、撤回時の調整コストを生みます。", chainEffect: "追加要件が確定し、開発余力が減少" },
        { id: "analyze_first", title: "回答を保留し、影響確認を宣言する", description: "期限を切って調査し、確認後に回答すると伝えます。", metricEffects: { trust: 1, riskExposure: -2, stakeholderAlignment: 2 }, setsFlags: { impactCheckPromised: true }, evidence: [{ areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 2 }], whatHappened: "佐藤へ確認期限を伝え、追加可否の回答を一度保留しました。", why: "約束の前に判断材料をそろえる時間を確保できました。", pmPoint: "分からないまま即答せず、いつまでに何を確認するかを示すこともPMの判断です。", chainEffect: "影響確認の余地を確保" },
        { id: "reject_now", title: "納期を理由に断る", description: "現行計画を守るため、追加は次回と回答します。", metricEffects: { schedule: 2, trust: -5, scopeStability: 3, businessValue: -2 }, setsFlags: { rejectedWithoutContext: true }, evidence: [{ areaId: "scope-control", elementId: "baseline", behavior: "scope_baseline_reference", weight: 1 }], whatHappened: "現行リリースの範囲は守られましたが、佐藤は背景を聞かれないまま断られたと感じました。", why: "計画を守る判断でも、目的を確認せず結論を出すと期待のずれが残ります。", pmPoint: "断る場合も、要求の目的を確認すると別の着地点を探せます。", chainEffect: "範囲は維持したが、顧客との期待差が残存" },
      ],
    },
    {
      id: "impact", timing: "WEEK 10 / 12 — DAY 3", title: "『2日』では終わらない", situation: "開発側から、検索APIと回帰テストへの影響が示唆されました。一方、営業は契約更新への影響を気にしています。", thinkingPoint: "技術影響だけでなく、事業上の優先度とチーム負荷をどう把握しますか。", visibleInformation: ["営業は顧客関係を懸念", "開発はテストへの影響を示唆"], newlyRelevantActionIds: ["ask_tanaka_impact", "ask_mori_sales", "ask_suzuki_status", "schedule_remaining"],
      eventByFlags: [{ requiresAll: ["formalCommitment"], text: "すでに顧客へ正式回答したため、調査中も作業着手を止めにくくなっています。" }],
      delayedEffects: [{ requiresAll: ["requestAccepted"], metricEffects: { schedule: -4, teamHealth: -2, scopeStability: -2 }, text: "受け入れた追加作業が開発計画へ入り、テスト準備の余力が減りました。", chainEffect: "即時受入れが日程とチーム余力へ波及" }],
      decisions: [
        { id: "overtime", title: "残業で全機能を入れる", description: "チームの追加稼働で約束を守ります。", irreversible: true, metricEffects: { schedule: 2, quality: -6, teamHealth: -10, riskExposure: 7, budget: -4 }, setsFlags: { overtimePromised: true }, evidence: [], whatHappened: "全機能を入れるため、チームへ追加稼働を依頼しました。", why: "短期の日程を守る代わりに、レビュー時間と回復余力を使いました。", pmPoint: "残業は時間を生むのではなく、品質と継続可能性から前借りする判断です。", chainEffect: "チーム負荷が上がり、品質リスクが蓄積" },
        { id: "quantify", title: "影響を整理して関係者へ共有する", description: "実装・テスト・契約影響を並べ、判断材料をそろえます。", metricEffects: { trust: 2, stakeholderAlignment: 4, riskExposure: -3 }, setsFlags: { impactShared: true }, evidence: [{ areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 2 }, { areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }], whatHappened: "技術・日程・営業の影響が同じ資料に整理されました。", why: "立場ごとの主張を、共通の判断材料へ変換できました。", pmPoint: "対立を解く前に、前提と影響をそろえることが合意形成の土台になります。", chainEffect: "関係者が同じ影響情報を共有" },
        { id: "dev_only", title: "開発チームだけで対応案を決める", description: "技術的に可能な範囲を開発側で先に決めます。", metricEffects: { quality: 2, trust: -3, stakeholderAlignment: -5 }, setsFlags: { isolatedDecision: true }, evidence: [{ areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 1 }], whatHappened: "技術案はまとまりましたが、顧客と営業の優先順位は反映されませんでした。", why: "実現可能性だけでは、事業上の判断を完結できません。", pmPoint: "PMは技術的にできることと、関係者が価値を感じることを接続します。", chainEffect: "技術案と顧客期待が分離" },
      ],
    },
    {
      id: "alignment", timing: "WEEK 11 / 12", title: "関係者の優先順位が衝突する", situation: "佐藤は追加要件、森は契約更新、田中はテスト時間、高橋は発表済み納期を重視しています。全員の希望をそのまま満たすことはできません。", thinkingPoint: "誰が、どの成功条件を基準に最終判断するべきでしょうか。", visibleInformation: ["顧客・営業・開発で優先事項が異なる", "何かを調整しなければ全条件は守れない"], newlyRelevantActionIds: ["ask_sato_owner", "ask_takahashi_success", "scope_phased_option", "report_customer"],
      decisions: [
        { id: "sato_priority", title: "佐藤の希望を優先する", description: "現場窓口との関係を重視し、全追加要件を進めます。", metricEffects: { trust: 2, schedule: -6, teamHealth: -5, stakeholderAlignment: -4, riskExposure: 5 }, setsFlags: { requestAccepted: true }, evidence: [], whatHappened: "佐藤の希望で進みましたが、高橋と開発側の成功条件は未合意のまま残りました。", why: "窓口担当者と最終判断者の役割を分けずに進めたためです。", pmPoint: "声の大きさではなく、意思決定権と成功条件を確認します。", chainEffect: "一部関係者の期待だけが固定" },
        { id: "build_options", title: "複数案を作り、判断者へ提示する", description: "全追加・段階リリース・次回対応の影響を比較します。", requiresInformation: ["request_background", "implementation_impact"], hidesWhenMissing: true, metricEffects: { businessValue: 4, stakeholderAlignment: 5, riskExposure: -4 }, setsFlags: { alternativePrepared: true }, evidence: [{ areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 2 }, { areaId: "business-value", elementId: "value", behavior: "business_value_check", weight: 1 }, { areaId: "stakeholders", elementId: "alignment", behavior: "consensus_building", weight: 1 }], whatHappened: "目的と実装影響を踏まえた3つの案を比較できるようになりました。", why: "背景と影響の両方を確認していたため、実行可能な代替案を作れました。", pmPoint: "情報取得は、後続の選択肢そのものを増やします。", chainEffect: "全員が比較できる代替案を獲得" },
        { id: "pm_decides", title: "PM判断で今回の範囲を決める", description: "調整時間を節約し、PMが現実的な範囲を指定します。", metricEffects: { schedule: 2, trust: -3, stakeholderAlignment: -6 }, setsFlags: { pmUnilateralDecision: true }, evidence: [{ areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 1 }], whatHappened: "作業範囲は早く決まりましたが、関係者の納得は得られませんでした。", why: "PMは判断を支援できますが、事業上の権限まで代替したためです。", pmPoint: "誰が決めるかを明らかにし、PMは影響と選択肢を整えます。", chainEffect: "迅速に決定したが合意が弱い" },
      ],
    },
    {
      id: "consequence", timing: "WEEK 11 / 12 — DAY 4", title: "過去の判断が表面化する", situation: "総合テスト開始が迫る中、追加対応の影響が日程とチームに現れました。ここからの変更には調整コストが伴います。", thinkingPoint: "すでにした約束を踏まえ、どこまで回復策を取れるでしょうか。", visibleInformation: ["総合テスト開始まで残りわずか", "正式な約束は簡単に撤回できない"], newlyRelevantActionIds: ["schedule_critical_path", "team_test_capacity", "scope_phased_option", "report_decision_owner"],
      eventByFlags: [
        { requiresAll: ["formalCommitment"], text: "正式受入れを撤回する場合、顧客説明と信頼回復が必要です。" },
        { requiresAll: ["overtimePromised"], text: "追加稼働によりレビュー待ちが増え、品質懸念が表面化しました。" },
        { requiresAll: ["impactShared"], text: "影響を共有していたため、関係者は調整が必要なことを理解しています。" },
      ],
      delayedEffects: [
        { requiresAll: ["formalCommitment"], metricEffects: { schedule: -4, trust: -1 }, text: "正式な約束があるため、関係者調整より先に追加作業が進みました。", chainEffect: "正式約束が調整の選択肢を制限" },
        { requiresAll: ["overtimePromised"], metricEffects: { quality: -5, teamHealth: -5, riskExposure: 5 }, text: "追加稼働の反動でレビュー待ちが増え、品質懸念が顕在化しました。", chainEffect: "残業判断が後から品質とチームへ影響" },
      ],
      decisions: [
        { id: "continue_all", title: "約束どおり全機能を完成させる", description: "品質確認を圧縮し、現在の約束を優先します。", metricEffects: { schedule: 3, quality: -9, teamHealth: -8, riskExposure: 9 }, evidence: [], whatHappened: "全機能の完了を優先し、テストとレビューを圧縮しました。", why: "約束を守るため、品質とチーム余力を使う判断になりました。", pmPoint: "納期達成だけでなく、そのために何を犠牲にしたかを明示します。", chainEffect: "納期を守る代わりに品質余力を消費" },
        { id: "withdraw", title: "追加要件の受入れを撤回する", description: "現行リリースから追加分を外します。", metricEffects: { schedule: 5, quality: 4, trust: -8, stakeholderAlignment: -5, scopeStability: 5 }, setsFlags: { requestWithdrawn: true }, evidence: [{ areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }], whatHappened: "追加要件を外して日程を回復しましたが、正式回答を覆す説明が必要になりました。", why: "不可逆な約束を後から変えたため、調整コストと信頼低下が発生しました。", pmPoint: "撤回できないわけではありませんが、早い段階の確認より高いコストがかかります。", chainEffect: "日程回復と引き換えに顧客信頼が低下",
          conditionalOutcomes: [{ requiresAll: ["impactShared"], metricEffects: { trust: 4, stakeholderAlignment: 3 }, resultSuffix: "事前に影響共有していたため、突然の撤回とは受け取られませんでした。", chainEffect: "事前共有により信頼低下を緩和" }] },
        { id: "phased", title: "段階リリースへ切り替える", description: "価値の高い条件だけを先行し、残りを次回に送ります。", requiresInformation: ["release_option"], hidesWhenMissing: true, metricEffects: { schedule: 4, quality: 4, businessValue: 3, scopeStability: 2, teamHealth: 2 }, setsFlags: { phasedRelease: true }, evidence: [{ areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 2 }, { areaId: "business-value", elementId: "value", behavior: "business_value_check", weight: 1 }], whatHappened: "最重要条件を先行し、残りを次回へ分ける案に切り替えました。", why: "代替案を準備していたため、価値を残しながら作業量を調整できました。", pmPoint: "全部かゼロかではなく、価値の単位でスコープを組み替えます。", chainEffect: "価値を残しながら作業量を縮小",
          conditionalOutcomes: [{ requiresAll: ["decisionOwnerKnown", "impactShared"], metricEffects: { trust: 5, stakeholderAlignment: 5, riskExposure: -4 }, setsFlags: { alignedPlan: true }, resultSuffix: "意思決定者と影響を共有済みだったため、段階案へ円滑に合意できました。", chainEffect: "事前合意により段階案への切替が成功" }] },
      ],
    },
    {
      id: "release", timing: "WEEK 12 / 12", title: "最終リリース判断", situation: "リリース判定会議です。納期・品質・顧客価値・チーム状態のすべてを完全には守れません。これまで集めた情報と合意状況が、選べる着地点を決めます。", thinkingPoint: "何を守り、何を次へ送るのか。誰とどの条件で合意しますか。", visibleInformation: ["リリース判定は今回が最後", "判断内容は顧客と開発の次の行動を固定する"], newlyRelevantActionIds: ["ask_takahashi_success", "report_decision_owner", "scope_phased_option"],
      decisions: [
        { id: "release_full", title: "全機能を予定日にリリースする", description: "納期と追加要件の両方を優先します。", irreversible: true, metricEffects: { schedule: 5, quality: -8, teamHealth: -6, riskExposure: 8, trust: 2 }, setsFlags: { releasedFull: true }, evidence: [], whatHappened: "全機能を予定日に出す判断を確定しました。", why: "納期と範囲を守るため、残っていた品質余力を使いました。", pmPoint: "達成項目だけでなく、受容したリスクを関係者へ明示します。", chainEffect: "全機能・納期を優先し品質リスクを受容" },
        { id: "release_phased", title: "段階リリースを正式決定する", description: "最重要条件だけを今回届け、残りの期限を合意します。", requiresInformation: ["release_option", "decision_owner"], hidesWhenMissing: true, irreversible: true, metricEffects: { schedule: 4, quality: 5, businessValue: 5, scopeStability: 3, trust: 2 }, setsFlags: { phasedRelease: true, finalAgreement: true }, evidence: [{ areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 2 }, { areaId: "stakeholders", elementId: "alignment", behavior: "consensus_building", weight: 2 }, { areaId: "scope-control", elementId: "record", behavior: "written_agreement", weight: 1 }], whatHappened: "高橋と段階リリースに合意し、今回と次回の範囲を分けました。", why: "価値の優先順位と意思決定者を確認していたため、単なる機能削減ではなく事業判断として整理できました。", pmPoint: "良い調整は、減らしたものだけでなく、守った価値と次の約束を明確にします。", chainEffect: "決裁者合意のもと価値を段階的に提供" },
        { id: "delay_release", title: "品質を優先して延期を提案する", description: "品質確認を完了してから全機能を届けます。", irreversible: true, metricEffects: { schedule: -9, quality: 8, teamHealth: 4, trust: -3, riskExposure: -5 }, setsFlags: { releaseDelayed: true }, evidence: [{ areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 2 }, { areaId: "scope-control", elementId: "impact", behavior: "impact_analysis", weight: 1 }], whatHappened: "品質確認を優先し、リリース延期を提案しました。", why: "品質事故の回避を優先し、発表済み納期への影響を受け入れました。", pmPoint: "延期も、突然の通知か事前調整済みかで信頼への影響が変わります。", chainEffect: "品質を守るため納期を再設定",
          conditionalOutcomes: [{ requiresAll: ["impactShared", "decisionOwnerKnown"], metricEffects: { trust: 5, stakeholderAlignment: 4 }, setsFlags: { alignedPlan: true }, resultSuffix: "影響と判断者を事前にそろえていたため、延期は共同判断として受け止められました。", chainEffect: "事前調整により延期への納得を獲得" }] },
      ],
    },
  ],
  reactionRules: [
    { stakeholderId: "sato", requiresAll: ["phasedRelease"], text: "最重要の要望が今回入ると分かり、顧客への説明がしやすくなりました。" },
    { stakeholderId: "sato", requiresAll: ["requestWithdrawn"], text: "一度受けてもらった要望が外れたので、もっと早く影響を知りたかったです。" },
    { stakeholderId: "sato", text: "要望への回答は得られましたが、次回の範囲も継続して確認したいです。", fallback: true },
    { stakeholderId: "tanaka", requiresAll: ["phasedRelease"], text: "優先順位が整理され、必要なテスト時間を確保できました。" },
    { stakeholderId: "tanaka", requiresAll: ["overtimePromised"], text: "短期対応はできましたが、この負荷を続けるのは難しいです。" },
    { stakeholderId: "tanaka", text: "実装範囲は決まりました。次は判断をもう少し早く共有してほしいです。", fallback: true },
    { stakeholderId: "mori", requiresAll: ["impactShared"], text: "契約への影響を含めて早めに共有されたので、顧客と話す準備ができました。" },
    { stakeholderId: "mori", text: "顧客関係は守りたいですが、営業側への共有タイミングは改善できそうです。", fallback: true },
    { stakeholderId: "takahashi", requiresAll: ["finalAgreement"], text: "価値・品質・納期を比較した上で、事業判断として合意できました。" },
    { stakeholderId: "takahashi", requiresAll: ["decisionOwnerKnown"], text: "判断に必要な影響が整理されていたので、責任を持って決められました。" },
    { stakeholderId: "takahashi", text: "最終段階で初めて聞く事項がありました。判断者への共有を早めてください。", fallback: true },
  ],
};
