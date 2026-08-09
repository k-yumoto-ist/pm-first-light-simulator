import type { Effect, GameState, ScoreKey } from "../types/game";

export type PMActionDefinition = {
  id: "hearing" | "schedule" | "risk" | "scope" | "team" | "report";
  title: string;
  description: string;
  expected: string[];
  domains: string[];
  tags: ScoreKey[];
  cost: string;
  getEffect?: (state: GameState) => Effect;
  getResult?: (state: GameState) => { occurred: string; why: string; learning: string };
};

export const learningByArea: Record<ScoreKey, string> = {
  stakeholder: "関係者の期待・影響力・決定権を把握し、必要なタイミングで関与してもらう活動は、ステークホルダー・エンゲージメントに関連します。",
  scope: "要求をそのまま作業にせず、目的・境界・変更影響を整理する活動は、スコープ・マネジメントに関連します。",
  schedule: "進捗の事実、残作業、依存関係を確認して見通しを更新する活動は、スケジュール・マネジメントに関連します。",
  risk: "問題になる前の不確実性を見つけ、起きた場合の対応を準備する活動は、リスク・マネジメントに関連します。",
};

export const pmActions: PMActionDefinition[] = [
  {
    id: "hearing", title: "関係者ヒアリングを実施する",
    description: "関係者を選び、期待・懸念・前提を具体的に聞きます。",
    expected: ["認識差や隠れた前提を発見", "意思決定に必要な情報を獲得"],
    domains: ["Stakeholder", "Scope"], tags: ["stakeholder", "scope"], cost: "質問すると Action × 1",
  },
  {
    id: "schedule", title: "スケジュールを点検する",
    description: "完了・残作業・依存関係を見直し、現在の見通しを更新します。",
    expected: ["遅れの兆候を発見", "優先すべき作業を整理"],
    domains: ["Schedule"], tags: ["schedule"], cost: "Action × 1",
    getEffect: () => ({ metrics: { schedule: 5 } }),
    getResult: () => ({ occurred: "完了状況と依存関係を確認し、計画上の余裕が薄い箇所を特定しました。", why: "残作業を具体化したことで、遅れが大きくなる前に計画を更新できる状態になりました。", learning: learningByArea.schedule }),
  },
  {
    id: "risk", title: "リスク対応を整理する",
    description: "不確実性と兆候を洗い出し、起きた場合の対応を考えます。",
    expected: ["将来の問題を先回り", "対応の選択肢を確保"],
    domains: ["Risk", "Schedule"], tags: ["risk"], cost: "Action × 1",
    getEffect: state => state.flags.apiRiskKnown ? { flags: { apiRiskMitigated: true }, metrics: { riskExposure: -16, schedule: 4 } } : { metrics: { riskExposure: -5 } },
    getResult: state => state.flags.apiRiskKnown
      ? { occurred: "外部APIの遅延兆候と、モックを使った先行開発の対応方針を整理しました。", why: "既知の不確実性に具体的な対応を割り当てたため、仕様変更が起きても影響を局所化できます。", learning: learningByArea.risk }
      : { occurred: "現時点で見えている不確実性を一覧化しましたが、技術面の具体的な兆候までは得られていません。", why: "整理によって警戒度は上がりました。一方、詳しい人への確認がなければ、効果的な対応策までは決められません。", learning: learningByArea.risk },
  },
  {
    id: "scope", title: "要件・スコープを整理する",
    description: "確定事項、未確定事項、変更による影響を分けて考えます。",
    expected: ["要求の曖昧さを可視化", "手戻りや作業増加を抑制"],
    domains: ["Scope", "Schedule"], tags: ["scope"], cost: "Action × 1",
    getEffect: state => state.turn === 2 ? { flags: { impactAnalysisDone: true }, metrics: { scopeStability: 14, schedule: 5 } } : { metrics: { scopeStability: 8 } },
    getResult: state => state.turn === 2
      ? { occurred: "追加要望に必要な実装・テスト・調整作業を洗い出し、当初計画への影響を可視化しました。", why: "要望を約束に変える前に影響を整理したため、優先順位を合意する材料が揃いました。", learning: learningByArea.scope }
      : { occurred: "決まっている要件と未確定事項を分け、次に確認すべき論点を明確にしました。", why: "曖昧さを見える形にしたことで、思い込みによる手戻りを減らせる状態になりました。", learning: learningByArea.scope },
  },
  {
    id: "team", title: "チーム状況を確認する",
    description: "負荷、困りごと、予定との差を責めずに確認します。",
    expected: ["遅れや詰まりを早期発見", "支援が必要な箇所を把握"],
    domains: ["Schedule", "Team"], tags: ["schedule"], cost: "Action × 1",
    getEffect: () => ({ flags: { juniorProgressChecked: true }, metrics: { team: 7, schedule: 5 } }),
    getResult: () => ({ occurred: "メンバーの負荷と困りごとを確認し、鈴木さんの作業に支援が必要な兆候を把握しました。", why: "報告を待たずに確認したことで、小さな遅れのうちに支援を検討できます。", learning: learningByArea.schedule }),
  },
  {
    id: "report", title: "顧客へ状況を共有する",
    description: "現状、懸念、次に必要な判断を早めに共有します。",
    expected: ["認識のずれを抑制", "判断を得る準備"],
    domains: ["Stakeholder"], tags: ["stakeholder"], cost: "Action × 1",
    getEffect: state => ({ flags: { reportedStatus: true }, metrics: { trust: 6, stakeholderAlignment: state.flags.decisionMakerKnown ? 8 : 3 } }),
    getResult: state => state.flags.decisionMakerKnown
      ? { occurred: "顧客へ現状と懸念、今後必要になる判断を共有しました。", why: "決裁者を意識した報告になったため、後から『聞いていない』となる可能性を下げられました。", learning: learningByArea.stakeholder }
      : { occurred: "顧客窓口へ現状を共有しましたが、最終判断をする人には届いているか確認できませんでした。", why: "情報共有自体は信頼につながりますが、誰が判断するか不明なままでは合意形成の効果が限定されます。", learning: learningByArea.stakeholder },
  },
];

export const decisionResultCopy: Record<string, { occurred: string; why: string; learning: string }> = {
  accept: { occurred: "追加要望をその場で受け入れ、顧客窓口からは前向きな反応を得ました。一方、実装とテストの作業量が増えました。", why: "短期的な信頼を優先した代わりに、背景と影響を確認しないままスコープを広げたためです。", learning: learningByArea.scope },
  analyze: { occurred: "追加要望を即答せず、作業量・品質・納期への影響を確認する時間を確保しました。", why: "変更を評価してから合意する姿勢を示したため、無計画な作業増加を防げる状態になりました。", learning: learningByArea.scope },
  later: { occurred: "当初のリリース範囲を守りましたが、顧客には一方的に断られた印象が少し残りました。", why: "スケジュールは守りやすくなった一方、要望の背景を聞かずに結論を伝えたためです。", learning: learningByArea.stakeholder },
  background: { occurred: "追加要望が一部の大口顧客向けであり、代替手段も検討できることが分かりました。", why: "『何を作るか』より先に『なぜ必要か』を聞いたことで、別の選択肢が見えるようになりました。", learning: learningByArea.scope },
  trim: { occurred: "主要機能に範囲を絞り、予定日に安全に提供できる可能性を高めました。", why: "すべてを守ろうとせず、価値と品質を基準にスコープを調整したためです。", learning: learningByArea.scope },
  delay: { occurred: "品質を確保する時間は増えましたが、発表済みの日程を動かす調整が必要になりました。", why: "納期より品質を優先する判断をしたためです。関係者との合意状況が信頼への影響を左右します。", learning: learningByArea.stakeholder },
  force: { occurred: "全機能を予定日に入れる方針により、チーム負荷と品質リスクが急上昇しました。", why: "納期・品質・全スコープを同時に守ろうとし、現実的なトレードオフを置かなかったためです。", learning: learningByArea.risk },
  negotiate: { occurred: "影響と選択肢を示して顧客と再協議し、判断を共同で行える状態を作りました。", why: "PMだけで抱えず、決定権を持つ関係者を意思決定に巻き込んだためです。", learning: learningByArea.stakeholder },
  staged: { occurred: "安全な主要機能を先に提供し、残りを後続リリースへ分ける方針で合意を進めました。", why: "価値を届ける時期と変更リスクを分割し、納期・品質・チーム負荷のバランスを取ったためです。", learning: learningByArea.risk },
};
