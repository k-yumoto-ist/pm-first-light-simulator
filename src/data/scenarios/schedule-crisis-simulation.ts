import type { StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { scheduleCrisisActionSpace } from "./schedule-crisis-action-space";
import { statefulActionCategories } from "./stateful-action-categories";

export const scheduleCrisisSimulation: StatefulScenarioDefinition = {
  id: "schedule-crisis-simulation",
  title: "このままでは間に合わない",
  description: "クリティカルパス上の遅延を起点に、何を守り、何を変えて回復するかを考える5ターンの実践シミュレーションです。",
  mode: "project", supportedDifficulties: ["guided", "standard", "challenge"], primaryDomain: "schedule", relatedDomains: ["scope", "resources", "stakeholders", "risk"],
  initialMetrics: { schedule: 42, budget: 70, quality: 74, trust: 62, teamHealth: 66, businessValue: 70, riskExposure: 56, scopeStability: 76, stakeholderAlignment: 56 },
  initialFlags: { criticalPathKnown: false, recoveryPlanned: false, overtimePromised: false, resourceShifted: false, scopeAdjusted: false, phasedRelease: false, releaseDelayed: false, finalAgreement: false, optionsShared: false, customerInformed: false },
  intro: { emphasizedHeadline: "遅延から回復の道筋を作るPMです。", description: "リリースまで3週間。API連携がクリティカルパス上で5営業日遅れています。誰に何を聞き、何を守って回復するかを判断してください。", briefTitle: "顧客ポータル連携", phase: "リリース3週間前", team: "PM・開発・QA・営業・顧客", issueLabel: "現在の課題", issue: "API連携の5営業日遅延", requestLabel: "顧客側の制約", request: "展示会前の利用開始", risk: "テスト開始と品質判定への波及" },
  stakeholders: [
    { id: "tanaka", name: "田中", role: "開発リーダー", priority: "技術的な回復と品質を守りたい", avatar: "田" },
    { id: "qa", name: "山本", role: "QAリーダー", priority: "安全なテストとリリース判定を守りたい", avatar: "山" },
    { id: "mori", name: "森", role: "営業責任者", priority: "顧客との約束と関係を守りたい", avatar: "森" },
    { id: "sato", name: "佐藤", role: "顧客担当者", priority: "展示会前の利用開始を実現したい", avatar: "佐" },
    { id: "takahashi", name: "高橋", role: "顧客決裁者", priority: "事業価値と品質条件を両立したい", avatar: "高" },
  ], actionCategories: statefulActionCategories,
  information: [
    { id: "delay_cause", label: "遅延原因", detail: "外部API仕様の差分確認と認証試験のやり直しが遅延の主因。", source: "田中へのヒアリング" },
    { id: "blocked_dependencies", label: "止まっている後続作業", detail: "総合テストの一部とリリース判定用の証跡作成がAPI連携待ち。", source: "田中へのヒアリング" },
    { id: "critical_path", label: "クリティカルパス", detail: "API認証、総合テスト、リリース判定が最も長い依存関係上にある。", source: "スケジュール点検" },
    { id: "remaining_work", label: "工程別の残作業", detail: "実装だけでなく、レビュー・テスト・判定まで7営業日相当が残る。", source: "スケジュール点検" },
    { id: "test_entry_conditions", label: "テスト開始条件", detail: "認証試験完了とテストデータ確定がそろわないと安全に開始できない。", source: "山本へのヒアリング" },
    { id: "test_parallel_option", label: "前倒し可能なテスト準備", detail: "画面系テスト準備はAPI連携と並行して前倒しできる。", source: "山本への再確認" },
    { id: "quality_floor", label: "譲れない品質条件", detail: "認証・決済に関わる回帰テストを短縮すると重大障害につながる。", source: "山本へのヒアリング" },
    { id: "business_deadline", label: "顧客側の期限背景", detail: "展示会前の利用開始が重要だが、対象顧客を絞る余地がある。", source: "森へのヒアリング" },
    { id: "customer_flexibility", label: "調整可能な幅", detail: "対象顧客を限定するなら、予定日に段階的に始める案を検討できる。", source: "佐藤へのヒアリング" },
    { id: "decision_owner", label: "最終意思決定者", detail: "展示会までの利用開始と品質条件を基準に、高橋が最終判断する。", source: "高橋への確認" },
    { id: "parallel_work", label: "並行化可能な作業", detail: "テストデータ整備と画面テスト準備は、API認証の完了前に進められる。", source: "スケジュール点検" },
    { id: "schedule_risk", label: "主要な日程リスク", detail: "API再試験、テスト開始条件、顧客説明の遅れが回復を阻害する。", source: "リスク整理" },
    { id: "contingency_option", label: "代替案の発動条件", detail: "API再試験が所定日までに終わらない場合、対象限定リリースを提示する。", source: "リスク整理" },
    { id: "scope_tradeoff", label: "スコープの調整余地", detail: "展示会で必要な利用導線を優先し、周辺の分析機能は後続に回せる。", source: "要件・スコープ整理" },
    { id: "phased_release_option", label: "段階リリース案", detail: "対象顧客を絞れば、品質条件を守りながら予定日に利用開始できる。", source: "要件・スコープ整理" },
    { id: "team_capacity", label: "チームの回復余力", detail: "画面テスト準備は支援できるが、田中とQAはすでに高負荷。", source: "チーム状況確認" },
    { id: "burnout_risk", label: "高負荷による品質リスク", detail: "残業を増やすと翌週のレビュー余力が落ち、品質リスクが高まる。", source: "チーム状況確認" },
  ], actions: scheduleCrisisActionSpace,
  turns: [
    { id: "detect", timing: "第10週 / 全12週", title: "5営業日の遅延が見つかる", situation: "API連携タスクが5営業日遅れています。担当者は『追いつけるかもしれない』と言いますが、総合テスト開始も近づいています。", thinkingPoint: "遅延日数だけでなく、原因と波及先をどう確認しますか。", visibleInformation: ["API連携が5営業日遅延", "リリースまで3週間"], newlyRelevantActionIds: ["sch_ask_tanaka_cause", "sch_schedule_critical", "sch_ask_qa_conditions"], decisions: [
      { id: "wait_for_recovery", title: "担当チームの回復を待つ", description: "まずは自律的な挽回に任せます。", metricEffects: { schedule: -5, trust: -2, riskExposure: 5 }, setsFlags: { recoveryDelayed: true }, evidence: [], whatHappened: "確認を待つ間に、遅延が後続工程へ近づきました。", why: "原因と依存関係を確認しなかったため、早期に打てる手が減りました。", pmPoint: "兆候の段階で構造を確かめると、回復の選択肢を残せます。", chainEffect: "遅延の把握と共有が後手に回った" },
      { id: "confirm_structure", title: "原因と影響を確認してから共有する", description: "クリティカルパスとテストへの影響を確認します。", metricEffects: { riskExposure: -3, stakeholderAlignment: 2 }, setsFlags: { criticalPathKnown: true }, evidence: [{ areaId: "schedule", elementId: "critical-path", behavior: "critical_path_analysis", weight: 2 }, { areaId: "risk", elementId: "identification", behavior: "risk_identification", weight: 1 }], whatHappened: "回復策を考える前に、遅延の構造を確認する時間を確保しました。", why: "遅れている作業そのものではなく、影響する経路を調べる方針にしたためです。", pmPoint: "日程管理では、遅延の長さより全体へ伝わる経路を見ます。", chainEffect: "回復策を選ぶための分析を開始" },
      { id: "promise_overtime", title: "残業で予定日を守ると約束する", description: "追加稼働で遅れを吸収すると関係者へ伝えます。", irreversible: true, metricEffects: { trust: 3, schedule: 3, teamHealth: -8, quality: -4, riskExposure: 6 }, setsFlags: { overtimePromised: true }, evidence: [], whatHappened: "短期的には予定日を守る姿勢を示せましたが、チームの余力を先に使う約束になりました。", why: "回復できる作業と品質条件を確かめる前に、稼働時間だけで解決しようとしたためです。", pmPoint: "残業は時間を生むのではなく、品質と回復余力から前借りします。", chainEffect: "高負荷を前提にした回復を約束" },
    ] },
    { id: "spread", timing: "第10週 / 全12週・後半", title: "テスト開始へ影響が広がる", situation: "API認証の完了待ちで、総合テストの一部が始められません。QAはテスト開始条件を満たせない懸念を示しています。", thinkingPoint: "どこまでが本当に遅れ、どの作業を並行できるでしょうか。", visibleInformation: ["総合テストの一部が待機", "QAは品質条件を懸念"], newlyRelevantActionIds: ["sch_schedule_remaining", "sch_schedule_parallel", "sch_team_capacity"], delayedEffects: [
      { requiresAll: ["overtimePromised"], metricEffects: { teamHealth: -5, quality: -3, riskExposure: 4 }, text: "追加稼働で実装は進みましたが、レビュー準備の余力が落ち始めました。", chainEffect: "短期の挽回が品質確認の余力を圧迫" },
      { requiresAll: ["recoveryDelayed"], metricEffects: { schedule: -4, trust: -3 }, text: "状況共有が遅れ、顧客側も日程調整の準備を始められませんでした。", chainEffect: "早期確認を見送った影響が調整時間を削減" },
    ], decisions: [
      { id: "parallelize", title: "並行化と担当再配置を検討する", description: "前倒し可能なテスト準備と、支援できる担当を組み合わせます。", requiresInformation: ["critical_path", "parallel_work", "team_capacity"], hidesWhenMissing: true, metricEffects: { schedule: 5, riskExposure: -5, teamHealth: 1 }, setsFlags: { resourceShifted: true, recoveryPlanned: true }, evidence: [{ areaId: "schedule", elementId: "recovery", behavior: "recovery_planning", weight: 2 }, { areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 2 }], whatHappened: "依存しないテスト準備を前倒しし、支援可能な作業だけを再配置しました。", why: "依存関係とスキル・負荷の両方を確認していたためです。", pmPoint: "人員を足す前に、何を並行化でき、誰が担えるかを確かめます。", chainEffect: "回復策が具体的な担当と期限を持った" },
      { id: "add_people", title: "すぐに人員を追加する", description: "追加メンバーを投入して遅れを吸収します。", irreversible: true, metricEffects: { schedule: 2, budget: -8, teamHealth: -2, riskExposure: 2 }, setsFlags: { rushedStaffing: true }, evidence: [{ areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 1 }], whatHappened: "人は増えましたが、API連携の立ち上がりと調整の時間も必要になりました。", why: "適用できる作業と引き継ぎ条件を確認する前に投入したためです。", pmPoint: "リソース追加は、人数ではなく作業の分け方と立ち上がりで評価します。", chainEffect: "追加人員の調整コストが発生" },
      { id: "compress_test", title: "テスト期間を短縮する", description: "予定日を守るため、品質確認の一部を削ります。", irreversible: true, metricEffects: { schedule: 4, quality: -8, riskExposure: 9 }, setsFlags: { testCompressed: true }, evidence: [], whatHappened: "日程は回復しましたが、リリース判定に必要な確認を削ることになりました。", why: "品質条件を確認する前に、テスト時間を回復資源として使ったためです。", pmPoint: "テスト短縮は、何のリスクを受け入れるかを明示する判断です。", chainEffect: "日程回復と引き換えに品質リスクを増加" },
    ] },
    { id: "recovery", timing: "第11週 / 全12週", title: "回復策を組み立てる", situation: "並行化、人員追加、範囲調整、日程変更という複数の打ち手が見えてきました。どれか一つだけで全てを守ることはできません。", thinkingPoint: "何を守り、何を変える回復策にしますか。", visibleInformation: ["回復には品質・コスト・範囲のトレードオフがある", "展示会前の利用開始が顧客側の制約"], newlyRelevantActionIds: ["sch_scope_minimum", "sch_scope_release_option", "sch_risk_contingency"], delayedEffects: [
      { requiresAll: ["rushedStaffing"], metricEffects: { budget: -3, schedule: -2, teamHealth: -2 }, text: "追加メンバーの引き継ぎで、田中の支援時間が必要になりました。", chainEffect: "急な増員が短期の回復幅を小さくした" },
      { requiresAll: ["testCompressed"], metricEffects: { quality: -5, trust: -2 }, text: "QAから、未確認の認証回帰がリリース判定の懸念になったと報告されました。", chainEffect: "テスト短縮の影響が品質条件に表面化" },
    ], decisions: [
      { id: "create_recovery_plan", title: "回復策を組み合わせて計画にする", description: "並行化・担当再配置・発動条件を組み合わせ、期限と責任者を決めます。", requiresInformation: ["critical_path", "parallel_work", "schedule_risk"], hidesWhenMissing: true, metricEffects: { schedule: 4, riskExposure: -6, trust: 2, stakeholderAlignment: 3 }, setsFlags: { recoveryPlanned: true }, evidence: [{ areaId: "schedule", elementId: "recovery", behavior: "recovery_planning", weight: 2 }, { areaId: "risk", elementId: "response", behavior: "risk_response_planning", weight: 1 }, { areaId: "risk", elementId: "contingency", behavior: "contingency_planning", weight: 1 }], whatHappened: "回復策に担当・確認期限・切替条件を設定しました。", why: "分析結果を、実行可能な複数の手順へ変換したためです。", pmPoint: "回復策は『急ぐ』ではなく、誰がいつ何を確認するかまで決めます。", chainEffect: "回復策が実行計画として共有可能になった" },
      { id: "protect_scope", title: "優先度の低い範囲を後続化する", description: "展示会に必要な価値を残し、周辺機能を後続へ回します。", requiresInformation: ["scope_tradeoff", "business_deadline"], hidesWhenMissing: true, metricEffects: { schedule: 5, quality: 3, businessValue: -1, scopeStability: 4, riskExposure: -3 }, setsFlags: { scopeAdjusted: true }, evidence: [{ areaId: "scope-control", elementId: "baseline", behavior: "scope_baseline_reference", weight: 1 }, { areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 1 }, { areaId: "business-value", elementId: "value", behavior: "business_value_check", weight: 2 }], whatHappened: "展示会に必要な利用導線を残し、周辺の分析機能を後続化しました。", why: "事業価値と期限背景を確認していたため、単なる機能削減ではなく優先順位の変更として整理できました。", pmPoint: "スコープ調整は失敗ではなく、目的を守るための選択肢です。", chainEffect: "価値を残しながら作業量を縮小" },
      { id: "push_overtime", title: "高負荷で押し切る", description: "残業をさらに増やし、範囲を変えずに予定日を守ります。", irreversible: true, metricEffects: { schedule: 4, teamHealth: -10, quality: -6, riskExposure: 7 }, setsFlags: { overtimePromised: true, highLoadCommitment: true }, evidence: [], whatHappened: "範囲は維持しましたが、レビューと相談の余力を大きく消費しました。", why: "時間の不足を、チームの継続可能性で埋めたためです。", pmPoint: "高負荷の判断では、その後に起きる品質・離脱リスクまで見積もります。", chainEffect: "予定日維持の代償として疲弊を蓄積" },
    ] },
    { id: "align", timing: "第11週 / 全12週・後半", title: "回復案を関係者と調整する", situation: "顧客は展示会前の利用開始を重視し、チームは品質低下を懸念しています。ここで共有が遅れると、選択肢そのものが減ります。", thinkingPoint: "どの事実と選択肢を、誰と合意しますか。", visibleInformation: ["顧客は利用開始時期を重視", "QAは品質条件を重視"], newlyRelevantActionIds: ["sch_ask_mori_business", "sch_ask_sato_flexibility", "sch_report_options"], delayedEffects: [
      { requiresAll: ["highLoadCommitment"], metricEffects: { teamHealth: -5, quality: -4, riskExposure: 4 }, text: "高負荷が続き、レビュー待ちと判断待ちが同時に増えました。", chainEffect: "無理な挽回が品質判定の選択肢を狭めた" },
    ], decisions: [
      { id: "share_options", title: "事実と複数案を早期に共有する", description: "予定日維持・対象限定・延期の影響を比較して判断を依頼します。", requiresInformation: ["business_deadline", "quality_floor"], hidesWhenMissing: true, metricEffects: { trust: 6, stakeholderAlignment: 6, riskExposure: -4 }, setsFlags: { optionsShared: true, customerInformed: true }, evidence: [{ areaId: "stakeholders", elementId: "report", behavior: "early_escalation", weight: 2 }, { areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 2 }, { areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 1 }], whatHappened: "顧客とチームが、品質・納期・範囲の違いを比較して話せるようになりました。", why: "悪い情報だけでなく選択肢をセットにし、早めに共有したためです。", pmPoint: "報告は問題の通知ではなく、共同で判断するための設計です。", chainEffect: "関係者が同じ前提で最終判断を準備" },
      { id: "hide_risk", title: "回復できる見込みだけを伝える", description: "不安を生まないよう、品質と日程の懸念は控えます。", metricEffects: { trust: -7, stakeholderAlignment: -5, riskExposure: 5 }, setsFlags: { riskHidden: true }, evidence: [], whatHappened: "一時的には安心感が出ましたが、顧客は代替案を検討する時間を失いました。", why: "判断に必要な悪い情報を共有しなかったためです。", pmPoint: "難しい情報ほど、早く、選択肢とともに共有します。", chainEffect: "期待値の差が最終局面へ持ち越された" },
      { id: "offer_delay_only", title: "延期だけを提案する", description: "品質を守るため、延期を唯一の案として提示します。", metricEffects: { quality: 4, schedule: -5, trust: -2 }, setsFlags: { delaySuggested: true }, evidence: [{ areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }], whatHappened: "品質を守る意図は伝わりましたが、顧客は他の選択肢も比較したいと感じました。", why: "延期の理由は示せても、価値を残す代替案を用意しなかったためです。", pmPoint: "耳の痛い提案ほど、比較できる複数案を準備します。", chainEffect: "品質は守れるが事業判断の幅が狭い" },
    ] },
    { id: "release", timing: "第12週 / 全12週", title: "最終リリース方針を決める", situation: "リリース判定が迫っています。予定日、品質、チームの継続性をすべて最大化することはできません。", thinkingPoint: "誰と、どの条件で、何を正式に決めますか。", visibleInformation: ["リリース判定が迫っている", "過去の約束は簡単には戻せない"], newlyRelevantActionIds: ["sch_ask_takahashi_owner", "sch_risk_contingency", "sch_report_options"], decisions: [
      { id: "release_phased", title: "対象限定の段階リリースを正式合意する", description: "展示会に必要な対象から始め、残りは品質確認後に届けます。", requiresInformation: ["phased_release_option", "decision_owner"], hidesWhenMissing: true, irreversible: true, metricEffects: { schedule: 4, quality: 5, trust: 4, teamHealth: 2, businessValue: 4, riskExposure: -5 }, setsFlags: { phasedRelease: true, finalAgreement: true }, evidence: [{ areaId: "scope-control", elementId: "alternative", behavior: "alternative_proposal", weight: 2 }, { areaId: "stakeholders", elementId: "consensus", behavior: "consensus_building", weight: 2 }, { areaId: "stakeholders", elementId: "record", behavior: "written_agreement", weight: 1 }], whatHappened: "対象を限定して予定日に利用開始し、残りの提供条件を高橋と文書で合意しました。", why: "顧客制約、品質条件、判断者を確認していたため、価値を残す着地点を作れました。", pmPoint: "段階リリースは、守る価値と次の約束を明確にして初めて機能します。", chainEffect: "価値・品質・納期をバランスさせた最終合意" },
      { id: "release_full", title: "全範囲を予定日にリリースする", description: "追加稼働で全範囲を予定日に届けます。", irreversible: true, metricEffects: { schedule: 3, quality: -7, teamHealth: -7, riskExposure: 7, trust: 1 }, setsFlags: { releasedFull: true, finalAgreement: true }, evidence: [{ areaId: "schedule", elementId: "recovery", behavior: "recovery_planning", weight: 1 }], whatHappened: "予定日は守れましたが、チームと品質の余力を大きく使うリリースになりました。", why: "範囲を変えずに日程を守るため、確認と回復の余白を削ったためです。", pmPoint: "予定日リリースの評価は、日付だけでなく品質とチームの持続性で見ます。", chainEffect: "日程優先のリリースを確定" },
      { id: "release_delay", title: "品質条件を守るため数日延期する", description: "必要な回帰テストを完了してから全範囲を届けます。", irreversible: true, metricEffects: { schedule: -8, quality: 8, teamHealth: 4, riskExposure: -6, trust: -2 }, setsFlags: { releaseDelayed: true, finalAgreement: true }, evidence: [{ areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 2 }, { areaId: "risk", elementId: "response", behavior: "risk_response_planning", weight: 1 }], conditionalOutcomes: [{ requiresAll: ["optionsShared", "decisionOwnerKnown"], metricEffects: { trust: 5, stakeholderAlignment: 4 }, resultSuffix: "事前に比較と判断者をそろえていたため、延期は共同の事業判断として受け止められました。", chainEffect: "事前調整により延期への納得を獲得" }], whatHappened: "品質確認を優先し、数日延期して全範囲を届ける方針にしました。", why: "品質条件を守るため、発表済み日程への影響を引き受けたためです。", pmPoint: "延期も、突然の通知か事前調整済みかで、関係者の受け止め方が変わります。", chainEffect: "品質優先で日程を再設定" },
    ] },
  ],
  reactionRules: [
    { stakeholderId: "sato", requiresAll: ["phasedRelease"], text: "展示会前に必要な利用開始ができると分かり、顧客へ説明しやすくなりました。" },
    { stakeholderId: "sato", requiresAll: ["riskHidden"], text: "もっと早く選択肢を知っていれば、顧客側でも準備できたと思います。" },
    { stakeholderId: "sato", text: "リリース方針は分かりました。利用開始までの説明を継続してほしいです。", fallback: true },
    { stakeholderId: "tanaka", requiresAll: ["resourceShifted"], text: "並行できる作業へ支援を回せたので、無理のない回復策になりました。" },
    { stakeholderId: "tanaka", requiresAll: ["highLoadCommitment"], text: "予定日は守れましたが、この負荷では品質確認を続けにくいです。" },
    { stakeholderId: "tanaka", text: "方針が早く共有されるほど、開発側は優先順位を付けやすくなります。", fallback: true },
    { stakeholderId: "qa", requiresAll: ["testCompressed"], text: "判定に必要な回帰テストが不足しています。リスクの扱いを明確にしてください。" },
    { stakeholderId: "qa", requiresAll: ["phasedRelease"], text: "対象を絞れたことで、譲れない品質条件を守れました。" },
    { stakeholderId: "qa", text: "品質条件を早めに確認できると、回復策の選択肢が増えます。", fallback: true },
    { stakeholderId: "mori", requiresAll: ["optionsShared"], text: "顧客との約束を比較案として共有できたので、調整の準備ができました。" },
    { stakeholderId: "mori", text: "顧客へ伝える選択肢は、もう少し早くそろえられそうです。", fallback: true },
  ],
  resultConfig: {
    scoredInformation: [
      { id: "delay_cause", weight: 2, reviewHint: "開発リーダーへ原因を確認すると、単純な増員以外の回復策を検討できました。" },
      { id: "critical_path", weight: 2, reviewHint: "原因と後続依存を確認してからクリティカルパスを分析すると、回復対象を絞れました。" },
      { id: "quality_floor", weight: 2, reviewHint: "QAへ譲れない品質条件を確認すると、安全な日程案を比較できました。" },
      { id: "business_deadline", weight: 2, reviewHint: "営業へ期限の背景を聞くと、対象限定などの代替案を作れました。" },
      { id: "customer_flexibility", weight: 1 }, { id: "team_capacity", weight: 1 }, { id: "decision_owner", weight: 1 },
    ],
    informationFullCreditRatio: 0.8,
    scoreMetrics: [{ key: "schedule", weight: 2 }, { key: "quality", weight: 2 }, { key: "teamHealth", weight: 1.5 }, { key: "riskExposure", weight: 1.5 }, { key: "trust", weight: 1 }],
    finalMetricKeys: ["schedule", "quality", "trust", "teamHealth", "riskExposure"],
    outcomeSummary: [
      { label: "リリース方針", rules: [{ requiresAll: ["releaseDelayed"], status: "延期", tone: "warning" }, { requiresAll: ["phasedRelease"], status: "段階リリース", tone: "positive" }, { requiresAll: ["releasedFull"], status: "予定日リリース", tone: "positive" }], fallbackStatus: "判断完了", fallbackTone: "neutral" },
      { label: "納期", metric: "schedule" }, { label: "品質", metric: "quality" }, { label: "顧客信頼", metric: "trust" }, { label: "チーム状態", metric: "teamHealth" },
    ],
  },
};
