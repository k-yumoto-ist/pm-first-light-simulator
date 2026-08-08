export const projectBrief = {
  title: "顧客ポータル 検索機能アップデート",
  purpose: "既存顧客が契約情報をすばやく探せる新しい検索体験を届ける",
  release: "12週間後（経営層が発表済み）",
  team: "PM 1名 / エンジニア 4名 / デザイナー 1名",
  requirements: "複数条件検索、検索結果一覧、CSV出力（詳細は一部未確定）",
  customer: "「競合対策のため、納期は必ず守ってください」",
  risk: "外部APIを利用予定。接続方法と確定時期は未確認",
};

export const turns = [
  {
    week: "WEEK 1 / 12",
    title: "キックオフ — 何から確かめる？",
    description: "資料には空白があります。誰に何を聞くか、最初の3アクションを選んでください。",
    theme: "関係者と不確実性",
  },
  {
    week: "WEEK 4 / 12",
    title: "「小さな」追加要望",
    description: "佐藤さんから検索条件追加の相談が届きました。返事の仕方が、この先の作業量を変えます。",
    theme: "要望と影響",
  },
  {
    week: "WEEK 8 / 12",
    title: "遅れが見えた日",
    description: "開発の遅れと外部APIの仕様変更が重なりました。状況を見極め、立て直してください。",
    theme: "早期検知とリカバリー",
  },
  {
    week: "WEEK 11 / 12",
    title: "リリース1週間前",
    description: "未完了機能と品質懸念が残る中、最終判断を求められています。何を守り、何を動かしますか。",
    theme: "合意のある意思決定",
  },
];

export const requestChoices = [
  { id: "accept", label: "分かりました。追加しましょう", note: "関係維持を優先して即答する" },
  { id: "analyze", label: "まず影響を確認させてください", note: "作業量・納期・品質への影響を見る" },
  { id: "later", label: "リリース後に回しましょう", note: "現行スコープを守る" },
  { id: "background", label: "必要な背景を教えてください", note: "要望の目的と優先順位を探る" },
];

export const releaseChoices = [
  { id: "trim", label: "機能を絞って予定日に出す", note: "主要価値と納期を守る", tone: "balanced" },
  { id: "delay", label: "延期を正式に提案する", note: "品質を優先し、日程を再合意する", tone: "quality" },
  { id: "force", label: "全機能を完成させて出す", note: "納期と全スコープを優先する", tone: "risky" },
  { id: "negotiate", label: "顧客と条件を再交渉する", note: "選択肢と影響を示して合意を作る", tone: "balanced" },
  { id: "staged", label: "段階リリースを提案する", note: "安全な範囲から価値を届ける", tone: "balanced" },
];
