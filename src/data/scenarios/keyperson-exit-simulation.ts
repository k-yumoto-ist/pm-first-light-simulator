import type { StatefulScenarioDefinition } from "../statefulScenarioTypes";
import { keypersonExitActionSpace } from "./keyperson-exit-action-space";
import { statefulActionCategories } from "./stateful-action-categories";

export const keypersonExitSimulation: StatefulScenarioDefinition = {
  id: "keyperson-exit-simulation", title: "キーマンが抜ける", description: "テックリードの離脱を起点に、人が抜けても続く知識・判断・体制を作る5ターンの実践シミュレーションです。", mode: "project", supportedDifficulties: ["guided", "standard", "challenge"], primaryDomain: "resources", relatedDomains: ["risk", "schedule", "stakeholders"],
  initialMetrics: { schedule: 68, budget: 68, quality: 78, trust: 70, teamHealth: 64, businessValue: 74, riskExposure: 60, scopeStability: 74, stakeholderAlignment: 62 },
  initialFlags: { retainOnly: false, knowledgeMapped: false, pairingStarted: false, knowledgeDistributed: false, successorConcentrated: false, transitionAgreed: false, agreementRecorded: false, contingencyPrepared: false, customerInformed: false },
  intro: { emphasizedHeadline: "人が抜けても続く状態を作るPMです。", description: "重要領域を担うテックリードから、1か月後に離れる可能性があると相談されました。知識・判断・関係性を誰へどう移すかを判断してください。", briefTitle: "外部API連携基盤", phase: "体制変更の準備期間", team: "PM・テックリード・開発・QA・顧客", issueLabel: "現在の課題", issue: "テックリードの離脱可能性", requestLabel: "制約", request: "引き継ぎに使える期間は約1か月", risk: "設計判断と顧客経緯が一人に集中" },
  stakeholders: [
    { id: "tanaka", name: "田中", role: "離脱予定のテックリード", priority: "責任を持って知識を残したい", avatar: "田" },
    { id: "kato", name: "加藤", role: "後任候補のエンジニア", priority: "無理なく実務を引き継ぎたい", avatar: "加" },
    { id: "suzuki", name: "鈴木", role: "開発メンバー", priority: "日常の判断を止めずに進めたい", avatar: "鈴" },
    { id: "sato", name: "佐藤", role: "顧客担当者", priority: "担当交代後も対応が止まらないこと", avatar: "佐" },
    { id: "ito", name: "伊藤", role: "部門責任者", priority: "継続可能な体制とリスク低減", avatar: "伊" },
  ], actionCategories: statefulActionCategories,
  information: [
    { id: "exit_timing", label: "離脱時期", detail: "離脱は1か月後を目安に進む可能性が高く、引き継ぎ時間は限られる。", source: "田中へのヒアリング" },
    { id: "knowledge_concentration", label: "集中している知識", detail: "外部API設計、障害時連絡先、顧客例外合意が田中に集中している。", source: "田中へのヒアリング" },
    { id: "handover_priorities", label: "移転で失われやすい知識", detail: "設計理由と障害時の切り分け順は、実作業なしには移りにくい。", source: "田中へのヒアリング" },
    { id: "successor_skills", label: "後任候補の対応可能範囲", detail: "加藤は画面・テスト連携は担えるが、API設計判断と顧客例外には支援が必要。", source: "加藤へのヒアリング" },
    { id: "team_dependencies", label: "日常作業の依存", detail: "障害判断、API変更確認、顧客問い合わせの三つで田中への確認が集中している。", source: "チームへのヒアリング" },
    { id: "customer_continuity", label: "顧客が求める継続性", detail: "顧客は担当者名より、障害時の連絡先と判断が止まらないことを心配している。", source: "佐藤へのヒアリング" },
    { id: "resource_options", label: "体制支援の条件", detail: "API経験者をレビュー支援へ一部確保できるが、全領域を一人で代替する人材はいない。", source: "伊藤へのヒアリング" },
    { id: "handover_window", label: "引き継ぎに必要な期間", detail: "最重要のAPI判断と障害対応を移すには、2週間の共同作業が必要。", source: "スケジュール点検" },
    { id: "transition_milestones", label: "移行の確認ポイント", detail: "設計説明、ペア作業、後任単独対応、顧客連絡の4段階で確認する。", source: "スケジュール点検" },
    { id: "exit_risk", label: "主要な離脱リスク", detail: "知識喪失、判断停滞、顧客不安、後任への再集中が主要リスク。", source: "リスク整理" },
    { id: "contingency_plan", label: "離脱前倒し時の対応", detail: "連絡先、判断者、外部API支援手順を準備しておく。", source: "リスク整理" },
    { id: "knowledge_priority", label: "優先して移す知識", detail: "API設計理由、障害対応、顧客例外合意を最優先で移す。", source: "要件・スコープ整理" },
    { id: "transition_scope", label: "移行期間の変更範囲", detail: "外部APIに関わる新規変更は、移行確認まで最小化する。", source: "要件・スコープ整理" },
    { id: "pairing_plan", label: "共同作業による移転計画", detail: "田中と加藤が実作業を通じて判断理由を共有する。", source: "チーム状況確認" },
    { id: "distributed_team", label: "知識を分散した体制", detail: "API設計は加藤、障害手順は鈴木、顧客連絡はPMが担う。", source: "チーム状況確認" },
  ], actions: keypersonExitActionSpace,
  turns: [
    { id: "consultation", timing: "第1週 / 全5週", title: "退職相談を受ける", situation: "田中から、家庭の事情で1か月後に離れる可能性があると相談されました。まだ確定ではありませんが、重要な外部APIを一人で担っています。", thinkingPoint: "確定前の今、何を始めればプロジェクトを止めずに済むでしょうか。", visibleInformation: ["田中が1か月後に離脱する可能性", "外部APIは田中が中心"], newlyRelevantActionIds: ["kp_ask_tanaka_timing", "kp_ask_tanaka_dependencies", "kp_risk_register"], decisions: [
      { id: "retain_only", title: "引き留めに集中する", description: "まずは田中に残ってもらう条件だけを検討します。", metricEffects: { trust: 2, schedule: 1, riskExposure: 3 }, setsFlags: { retainOnly: true }, evidence: [], whatHappened: "当面の安心感は出ましたが、知識と判断の集中はそのまま残りました。", why: "本人の継続だけに依存し、離脱時に備える準備を始めなかったためです。", pmPoint: "引き留めと並行して、誰が抜けても続く仕組みを作ります。", chainEffect: "短期の安心と引き換えに準備を先送り" },
      { id: "map_dependencies", title: "担当範囲と依存を可視化する", description: "作業・判断・連絡先を分け、何が田中に集中しているか整理します。", metricEffects: { riskExposure: -5, stakeholderAlignment: 2 }, setsFlags: { knowledgeMapped: true }, evidence: [{ areaId: "resources", elementId: "concentration", behavior: "risk_identification", weight: 2 }, { areaId: "resources", elementId: "handover", behavior: "knowledge_transfer", weight: 1 }], whatHappened: "離脱の可否にかかわらず、移すべき知識と判断を確認する方針にしました。", why: "人の名前ではなく、止まる作業と判断を対象に整理したためです。", pmPoint: "属人化は人事の問題ではなく、プロジェクトリスクとして扱います。", chainEffect: "知識移転の対象を可視化し始めた" },
      { id: "keep_quiet", title: "確定するまで共有しない", description: "不確実な話を広げず、本人とPMだけで様子を見ます。", metricEffects: { trust: -3, riskExposure: 5 }, setsFlags: { transitionHidden: true }, evidence: [], whatHappened: "チームが準備を始める時間を失い、突然の体制変更になりやすくなりました。", why: "影響を受ける人に必要な準備まで保留したためです。", pmPoint: "確定前でも、準備に必要な範囲を見極めて共有します。", chainEffect: "移行準備の開始が遅れた" },
    ] },
    { id: "concentration", timing: "第2週 / 全5週", title: "属人化が見えてくる", situation: "外部APIの設計判断、障害対応、顧客との例外合意が田中に集まっていることが見えてきました。", thinkingPoint: "作業だけでなく、何を優先して可視化・移転しますか。", visibleInformation: ["設計判断と顧客経緯が集中", "共同作業に使える時間は限られる"], newlyRelevantActionIds: ["kp_scope_prioritize", "kp_schedule_handover", "kp_team_pairing"], delayedEffects: [
      { requiresAll: ["retainOnly"], metricEffects: { riskExposure: 5, schedule: -3 }, text: "引き留めの回答が出ない間も、移転準備が進まず時間が減りました。", chainEffect: "引き留めだけの判断が準備期間を圧縮" },
      { requiresAll: ["transitionHidden"], metricEffects: { teamHealth: -4, trust: -2 }, text: "チームは急な相談に戸惑い、通常作業との調整が増えました。", chainEffect: "共有を控えた影響がチームの混乱として表面化" },
    ], decisions: [
      { id: "prioritize_transfer", title: "重要知識から移転計画を作る", description: "設計理由・障害対応・顧客経緯を優先し、共同作業の計画を作ります。", requiresInformation: ["knowledge_concentration", "handover_priorities", "handover_window"], hidesWhenMissing: true, metricEffects: { riskExposure: -7, quality: 2, schedule: -2 }, setsFlags: { transferPlanned: true }, evidence: [{ areaId: "resources", elementId: "handover", behavior: "knowledge_transfer", weight: 2 }, { areaId: "risk", elementId: "response", behavior: "risk_response_planning", weight: 1 }], whatHappened: "優先順位を付け、限られた期間で実作業まで行う引き継ぎ計画を作りました。", why: "集中している知識と時間制約の両方を確認していたためです。", pmPoint: "引き継ぎは全てを同じ深さで渡すのではなく、停止リスクの高い知識から移します。", chainEffect: "知識移転が期限と優先順位を持った" },
      { id: "document_only", title: "文書作成だけを依頼する", description: "田中に、知識をまとめた文書を残してもらいます。", metricEffects: { riskExposure: -2, teamHealth: -1 }, setsFlags: { documentOnly: true }, evidence: [{ areaId: "resources", elementId: "handover", behavior: "knowledge_transfer", weight: 1 }], whatHappened: "情報は残り始めましたが、後任が判断を使えるかは未確認のままです。", why: "文書化だけでは、暗黙知と実際の判断手順を確認できないためです。", pmPoint: "知識移転は、受け手が実際に使える状態まで確かめます。", chainEffect: "文書は残ったが実務での移転は未確認" },
      { id: "single_successor", title: "一人の後任へ集中して任せる", description: "加藤に全領域を短期間で引き継ぎます。", irreversible: true, metricEffects: { schedule: 2, riskExposure: -2, teamHealth: -3 }, setsFlags: { successorConcentrated: true }, evidence: [{ areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 1 }], whatHappened: "引き継ぎの窓口は早く決まりましたが、新しい一人依存が生まれました。", why: "速度を優先し、知識の種類ごとの分散とバックアップを設計しなかったためです。", pmPoint: "後任を決めるときも、次のキーパーソン依存を作らないようにします。", chainEffect: "一時的に移転速度は上がるが再集中リスクが残る" },
    ] },
    { id: "transfer", timing: "第3週 / 全5週", title: "知識移転を実作業で確かめる", situation: "加藤は一部の開発を担えますが、設計判断と障害対応はまだ田中への確認が必要です。", thinkingPoint: "何を誰へ、どの方法で移すと、田中がいなくても動ける状態になりますか。", visibleInformation: ["後任候補には得意・不得意がある", "文書だけでは判断の背景が移らない"], newlyRelevantActionIds: ["kp_ask_successor_skills", "kp_team_distribute", "kp_team_pairing"], delayedEffects: [
      { requiresAll: ["documentOnly"], metricEffects: { quality: -3, riskExposure: 3 }, text: "文書を読んだだけでは、例外時の判断が止まることが分かりました。", chainEffect: "実務確認を省いた影響が判断停滞として表面化" },
      { requiresAll: ["successorConcentrated"], metricEffects: { teamHealth: -4, riskExposure: 5 }, text: "加藤への質問が集中し、新しいボトルネックになり始めました。", chainEffect: "一人へ集中した引き継ぎが新たな依存を作った" },
    ], decisions: [
      { id: "pair_and_distribute", title: "ペア作業と役割分散で移す", description: "加藤だけに集中させず、設計・障害対応・顧客連絡を複数人へ移します。", requiresInformation: ["successor_skills", "team_dependencies", "knowledge_priority"], hidesWhenMissing: true, metricEffects: { riskExposure: -8, teamHealth: 3, quality: 3, stakeholderAlignment: 3 }, setsFlags: { pairingStarted: true, knowledgeDistributed: true }, evidence: [{ areaId: "resources", elementId: "handover", behavior: "knowledge_transfer", weight: 2 }, { areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 2 }], whatHappened: "実作業を通じて設計・障害対応・顧客連絡を複数人へ移し始めました。", why: "後任のスキル、日常の依存、知識の優先順位をそろえて設計したためです。", pmPoint: "移転は速度だけでなく、複数人が支えられる状態を作ることが重要です。", chainEffect: "知識と判断の集中を減らす移転を開始" },
      { id: "delegate_without_check", title: "後任へ渡して様子を見る", description: "加藤へ任せ、必要になった時だけ田中に確認します。", metricEffects: { schedule: 2, quality: -4, riskExposure: 5 }, setsFlags: { unverifiedDelegation: true }, evidence: [{ areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 1 }], whatHappened: "作業は移りましたが、例外判断のたびに田中への確認が発生しました。", why: "引き継ぎ完了の確認をせず、責任だけを先に渡したためです。", pmPoint: "委譲は、できるかを確認する場と支援ルートをセットにします。", chainEffect: "作業は移ったが判断依存が残る" },
      { id: "freeze_everything", title: "移行が終わるまで全変更を止める", description: "リスクを避けるため、関連作業を広く停止します。", metricEffects: { quality: 2, schedule: -7, businessValue: -3, teamHealth: -2 }, setsFlags: { broadFreeze: true }, evidence: [{ areaId: "risk", elementId: "response", behavior: "risk_response_planning", weight: 1 }], whatHappened: "変更リスクは抑えられましたが、必要な作業まで止まり、関係者の期待に影響しました。", why: "優先度を分けずに、全てを同じリスクとして扱ったためです。", pmPoint: "リスク対応では、止める範囲と守る価値を具体化します。", chainEffect: "安全性と引き換えに日程と価値を損失" },
    ] },
    { id: "organization", timing: "第4週 / 全5週", title: "新体制を作る", situation: "田中の離脱が確定しました。後任候補はいますが、全てを一人では担えません。顧客も今後の連絡と判断の継続性を気にしています。", thinkingPoint: "人だけを置き換えず、どの役割と判断ルートを正式に設計しますか。", visibleInformation: ["離脱が確定", "一人で全領域を代替する後任はいない"], newlyRelevantActionIds: ["kp_ask_manager_resources", "kp_risk_contingency", "kp_report_customer"], delayedEffects: [
      { requiresAll: ["successorConcentrated"], metricEffects: { riskExposure: 6, teamHealth: -3 }, text: "新しい後任への質問と判断依頼が集中し、バックアップ不足が明確になりました。", chainEffect: "再集中が体制上のリスクとして表面化" },
      { requiresAll: ["unverifiedDelegation"], metricEffects: { schedule: -3, quality: -3 }, text: "例外対応で後任が止まり、田中への確認待ちが発生しました。", chainEffect: "確認されなかった委譲が日程へ波及" },
    ], decisions: [
      { id: "formalize_transition", title: "役割・判断ルート・確認点を正式にする", description: "複数人の役割、障害時の判断、顧客連絡、移行確認を文書で合意します。", requiresInformation: ["resource_options", "customer_continuity", "transition_milestones"], hidesWhenMissing: true, irreversible: true, metricEffects: { trust: 5, riskExposure: -6, teamHealth: 3, stakeholderAlignment: 5 }, setsFlags: { transitionAgreed: true, agreementRecorded: true }, evidence: [{ areaId: "resources", elementId: "transition", behavior: "resource_reallocation", weight: 1 }, { areaId: "stakeholders", elementId: "record", behavior: "written_agreement", weight: 2 }, { areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }, { areaId: "risk", elementId: "contingency", behavior: "contingency_planning", weight: 1 }], whatHappened: "複数人の役割と、障害時に誰が判断するかを顧客・チームと合意しました。", why: "体制支援、顧客の継続性条件、移行確認をそろえて設計したためです。", pmPoint: "体制変更は、人の置換ではなく知識・権限・関係性を移すプロジェクトです。", chainEffect: "継続性を持つ新体制を正式化" },
      { id: "announce_replacement", title: "後任だけを発表する", description: "加藤が田中の役割を引き継ぐと伝え、詳細は後で調整します。", irreversible: true, metricEffects: { trust: -2, riskExposure: 4, stakeholderAlignment: -3 }, setsFlags: { replacementAnnounced: true }, evidence: [{ areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 1 }], whatHappened: "窓口は決まりましたが、役割と判断ルートの不明確さが残りました。", why: "交代を人員補充として扱い、知識と関係者の移行を設計しなかったためです。", pmPoint: "体制変更では、誰が何を決めるかまで明確にします。", chainEffect: "人は替わったが継続条件が弱い" },
      { id: "delay_customer_notice", title: "顧客への説明を後回しにする", description: "社内体制が固まってから顧客へ知らせます。", metricEffects: { trust: -5, riskExposure: 3 }, setsFlags: { customerNoticeDelayed: true }, evidence: [], whatHappened: "顧客は直前に体制変更を知り、継続性への不安を持ちました。", why: "顧客が確認したい条件を早めに共有しなかったためです。", pmPoint: "不確実な変更ほど、影響と準備状況を早く伝えます。", chainEffect: "顧客の期待差が残った" },
    ] },
    { id: "agreement", timing: "第5週 / 全5週", title: "顧客と移行完了を合意する", situation: "田中の最終稼働日が近づいています。移行を完了とみなすには、誰が何を自走でき、障害時にどう動くかを確認する必要があります。", thinkingPoint: "何を説明し、どの状態をもって移行完了としますか。", visibleInformation: ["最終稼働日が近い", "移行後の確認は簡単に巻き戻せない"], newlyRelevantActionIds: ["kp_schedule_milestones", "kp_report_formalize", "kp_ask_customer_concern"], decisions: [
      { id: "agree_continuity", title: "移行条件と確認点を顧客と合意する", description: "役割、障害時の連絡、後任の実作業確認、残るリスクを文書化します。", requiresInformation: ["customer_continuity", "distributed_team", "contingency_plan"], hidesWhenMissing: true, irreversible: true, metricEffects: { trust: 6, riskExposure: -7, teamHealth: 3, quality: 2, stakeholderAlignment: 5 }, setsFlags: { transitionAgreed: true, agreementRecorded: true }, evidence: [{ areaId: "stakeholders", elementId: "record", behavior: "written_agreement", weight: 2 }, { areaId: "risk", elementId: "contingency", behavior: "contingency_planning", weight: 2 }, { areaId: "stakeholders", elementId: "expectation", behavior: "expectation_management", weight: 1 }], conditionalOutcomes: [{ requiresAll: ["pairingStarted", "knowledgeDistributed"], metricEffects: { quality: 3, riskExposure: -3 }, resultSuffix: "共同作業と複数人への分散が進んでいたため、移行後の自走性も確認できました。", chainEffect: "実作業による移転が継続性を裏付けた" }], whatHappened: "顧客と、体制変更後も判断と対応を止めない条件を合意しました。", why: "顧客の懸念、分散体制、前倒し時の対応をそろえたためです。", pmPoint: "移行完了は、人が替わる日ではなく、新体制が継続して動ける状態で判断します。", chainEffect: "顧客と継続性の条件を正式合意" },
      { id: "declare_done", title: "後任への交代をもって完了とする", description: "田中の離脱日に、加藤が担当を引き継いだことだけを共有します。", irreversible: true, metricEffects: { schedule: 2, trust: -3, riskExposure: 4 }, setsFlags: { transitionDeclaredDone: true }, evidence: [{ areaId: "resources", elementId: "allocation", behavior: "resource_reallocation", weight: 1 }], whatHappened: "交代日は迎えましたが、顧客とチームが確認できる移行条件は残りませんでした。", why: "役割交代と継続可能な状態を同じものとして扱ったためです。", pmPoint: "体制移行では、役割だけでなく判断・連絡・確認の仕組みまで残します。", chainEffect: "形式上の交代を完了とした" },
      { id: "ask_tanaka_stay", title: "田中へ延長だけを頼む", description: "移行条件を決めず、離脱時期の延長を依頼します。", metricEffects: { schedule: 1, riskExposure: 3, teamHealth: -2 }, setsFlags: { retainOnly: true }, evidence: [], whatHappened: "時間は少し得られましたが、何を移すかと誰が担うかは決まりませんでした。", why: "時間を増やすことを、移行設計の代わりにしたためです。", pmPoint: "延長できても、移す対象と確認方法を設計しなければ依存は残ります。", chainEffect: "離脱時期を延ばしたが移転設計は未完" },
    ] },
  ],
  reactionRules: [
    { stakeholderId: "tanaka", requiresAll: ["pairingStarted", "knowledgeDistributed"], text: "判断理由を実作業で共有できたので、安心して役割を渡せそうです。" },
    { stakeholderId: "tanaka", requiresAll: ["retainOnly"], text: "残るかどうかだけでなく、抜けても困らない準備を進めてほしかったです。" },
    { stakeholderId: "tanaka", text: "残すべき知識の優先順位を早く決められると、引き継ぎしやすくなります。", fallback: true },
    { stakeholderId: "kato", requiresAll: ["knowledgeDistributed"], text: "一人で抱えず、相談先と役割が決まったので動きやすくなりました。" },
    { stakeholderId: "kato", requiresAll: ["successorConcentrated"], text: "任せてもらえた反面、判断の背景まで一人で抱えるのは不安です。" },
    { stakeholderId: "kato", text: "実作業で確認できる時間があると、引き継いだ知識を使えるようになります。", fallback: true },
    { stakeholderId: "suzuki", requiresAll: ["teamInformed"], text: "誰に何を確認すればよいかが見え、日常の判断を止めずに済みました。" },
    { stakeholderId: "suzuki", text: "体制変化を早めに共有してもらえると、準備と分担を考えやすいです。", fallback: true },
    { stakeholderId: "sato", requiresAll: ["transitionAgreed"], text: "担当が替わっても連絡と判断が止まらない条件を確認でき、安心しました。" },
    { stakeholderId: "sato", requiresAll: ["customerNoticeDelayed"], text: "直前の説明だったので、こちらの準備時間が足りませんでした。" },
    { stakeholderId: "sato", text: "体制変更の事実だけでなく、継続性をどう守るかも聞きたいです。", fallback: true },
  ],
  resultConfig: { scoredInformation: [
    { id: "exit_timing", weight: 2 }, { id: "knowledge_concentration", weight: 2, reviewHint: "分散案を作る前に本人しか知らない判断を確認すると、移転対象を具体化できました。" },
    { id: "handover_priorities", weight: 2 }, { id: "successor_skills", weight: 2 }, { id: "customer_continuity", weight: 1 }, { id: "handover_window", weight: 1 }, { id: "team_dependencies", weight: 1 },
  ], informationFullCreditRatio: 0.8, scoreMetrics: [{ key: "riskExposure", weight: 2 }, { key: "teamHealth", weight: 2 }, { key: "quality", weight: 1.5 }, { key: "trust", weight: 1.5 }, { key: "schedule", weight: 1 }], finalMetricKeys: ["schedule", "quality", "trust", "teamHealth", "riskExposure"], outcomeSummary: [
    { label: "体制移行", rules: [{ requiresAll: ["transitionAgreed"], status: "合意済み", tone: "positive" }, { requiresAll: ["replacementAnnounced"], status: "役割交代のみ", tone: "warning" }, { requiresAll: ["transitionDeclaredDone"], status: "形式上完了", tone: "warning" }], fallbackStatus: "判断完了", fallbackTone: "neutral" },
    { label: "継続性", metric: "riskExposure" }, { label: "納期", metric: "schedule" }, { label: "チーム状態", metric: "teamHealth" }, { label: "顧客信頼", metric: "trust" },
  ] },
};
