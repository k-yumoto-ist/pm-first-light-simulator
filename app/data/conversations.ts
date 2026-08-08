import type { CharacterId, Effect, GameState, ScoreKey } from "../types/game";

export type ConversationTopic = {
  id: string;
  character: CharacterId;
  label: string;
  playerText: string;
  reply: string | ((state: GameState) => string);
  effect?: Effect;
  tags: ScoreKey[];
  minTurn?: number;
};

export const conversationTopics: ConversationTopic[] = [
  { id: "sato_requirements", character: "sato", label: "現在の要件を確認する", playerText: "今決まっている要件と、まだ曖昧な部分を教えてください。", reply: "複数条件検索と一覧は必要です。CSV出力の対象項目は営業部とまだ詰めきれていません。", effect: { metrics: { scopeStability: 4 } }, tags: ["scope"] },
  { id: "sato_date", character: "sato", label: "リリース日の背景を聞く", playerText: "なぜこのリリース日が必要なのでしょうか？", reply: "経営会議で対外発表済みです。競合サービスへの対抗施策なので、現場としては動かしにくいです。", tags: ["schedule", "stakeholder"] },
  { id: "sato_decider", character: "sato", label: "最終意思決定者を確認する", playerText: "最終的なリリース承認は誰が行いますか？", reply: "最終判断は部長の高橋です。私は現場窓口ですが、承認権はありません。", effect: { flags: { decisionMakerKnown: true }, metrics: { stakeholderAlignment: 10 } }, tags: ["stakeholder"] },
  { id: "sato_background", character: "sato", label: "追加要望の背景を聞く", playerText: "この追加条件は、誰のどんな課題を解決するためですか？", reply: "営業部からです。実は全顧客ではなく、大口顧客3社の月次確認で使いたいそうです。代替手段も検討できるかもしれません。", effect: { flags: { requestBackgroundKnown: true }, metrics: { scopeStability: 8 } }, tags: ["scope"], minTurn: 2 },
  { id: "sato_expectation", character: "sato", label: "顧客側の成功条件を聞く", playerText: "顧客側では、何をもって成功と判断しますか？", reply: "私は使いやすさだと思いますが、高橋は事業への影響と重大障害がないことを重視しています。直接確認いただくのが確実です。", effect: { flags: { decisionMakerKnown: true } }, tags: ["stakeholder"] },

  { id: "takahashi_success", character: "takahashi", label: "成功条件を確認する", playerText: "今回、何を満たせば成功と判断されますか？", reply: "予定日に主要顧客が使い始められ、業務停止につながる障害がないことです。CSVの細部より検索の安定性を優先します。", effect: { flags: { releaseCriteriaKnown: true, stakeholderAligned: true }, metrics: { stakeholderAlignment: 14, scopeStability: 8 } }, tags: ["stakeholder", "scope"] },
  { id: "takahashi_priority", character: "takahashi", label: "優先順位をすり合わせる", playerText: "納期・機能・品質が競合した場合、何を優先しますか？", reply: "主要な検索機能と安全性です。選択肢と影響を早めに示してくれれば、段階提供も判断できます。", effect: { flags: { stakeholderAligned: true, priorityAdjusted: true }, metrics: { stakeholderAlignment: 12 } }, tags: ["stakeholder", "scope"] },
  { id: "takahashi_report", character: "takahashi", label: "現状と懸念を直接共有する", playerText: "現状と懸念、判断が必要になる点を共有します。", reply: state => state.flags.decisionMakerKnown ? "早めの共有をありがとうございます。判断材料が揃えば協力します。" : "急な話ですね。まず全体像と、私に何を判断してほしいか整理してください。", effect: { flags: { stakeholderAligned: true, reportedStatus: true }, metrics: { trust: 7, stakeholderAlignment: 8 } }, tags: ["stakeholder"] },

  { id: "tanaka_concern", character: "tanaka", label: "技術的な懸念を聞く", playerText: "今の段階で、一番気になっている技術的な点は何ですか？", reply: "外部APIです。先方の仕様確定が2週間ほど遅れるかもしれません。待ってから作ると余裕がありません。", effect: { flags: { apiRiskKnown: true }, metrics: { riskExposure: -10 } }, tags: ["risk"] },
  { id: "tanaka_schedule", character: "tanaka", label: "スケジュールの余裕を聞く", playerText: "今の計画には、どの程度の余裕がありますか？", reply: "かなり薄いです。CSVと追加条件が膨らむと、テスト期間を削ることになります。", effect: { metrics: { schedule: 3 } }, tags: ["schedule"] },
  { id: "tanaka_api", character: "tanaka", label: "外部APIを深掘りする", playerText: "外部APIが遅れた場合、先にできる準備や代替策はありますか？", reply: "仮データのモックで先行できます。仕様差分を吸収する層も用意すれば、変更の影響を局所化できます。", effect: { flags: { apiRiskKnown: true, apiRiskMitigated: true }, metrics: { riskExposure: -18, schedule: 5 } }, tags: ["risk", "schedule"] },
  { id: "tanaka_team", character: "tanaka", label: "チームの状況を聞く", playerText: "メンバーの負荷や、サポートが必要なところはありますか？", reply: "鈴木さんの見積もりが少し楽観的です。真面目ですが、詰まっても自分から言い出しにくいかもしれません。", tags: ["schedule"] },
  { id: "tanaka_difficulty", character: "tanaka", label: "開発難易度を聞く", playerText: "難易度が高い機能はどれですか？", reply: "検索条件の組み合わせとAPI連携です。CSV自体より、曖昧な条件を固める方が先です。", effect: { metrics: { scopeStability: 4 } }, tags: ["scope", "risk"] },

  { id: "suzuki_progress", character: "suzuki", label: "具体的な進捗を確認する", playerText: "完了したもの、残っているもの、予定との差を教えてください。", reply: state => state.turn <= 2 ? "画面は半分ほどです。組み合わせ検索で詰まっていて、このままだと1日ほど遅れそうです。" : "検索条件の組み合わせ部分がまだ残っています。早めに相談できていれば…と思っています。", effect: { flags: { juniorProgressChecked: true }, metrics: { schedule: 5, team: 4 } }, tags: ["schedule"] },
  { id: "suzuki_blocker", character: "suzuki", label: "困っていることを聞く", playerText: "いま困っていることや、判断待ちはありますか？", reply: "検索条件の優先順位が分からず、全部に対応しようとしています。田中さんに相談するタイミングも逃していました。", effect: { flags: { juniorProgressChecked: true }, metrics: { team: 6, schedule: 3 } }, tags: ["schedule", "scope"] },
  { id: "suzuki_estimate", character: "suzuki", label: "見積もりの前提を聞く", playerText: "見積もりに含めた作業と、含めていない作業を確認させてください。", reply: "実装だけで見積もっていて、レビュー修正と結合テストを十分に入れていませんでした。", effect: { flags: { juniorProgressChecked: true }, metrics: { schedule: 4 } }, tags: ["schedule"] },
  { id: "suzuki_support", character: "suzuki", label: "必要な支援を聞く", playerText: "予定に戻すために、どんな支援があると助かりますか？", reply: "田中さんとの30分レビューと、優先度の低い条件を後回しにできると立て直せます。", effect: { flags: { juniorProgressChecked: true, delayRecovered: true }, metrics: { schedule: 8, team: 8 } }, tags: ["schedule"] },
];
