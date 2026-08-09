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
    situation: "案件資料だけでは、判断に必要な情報が足りません。窓口、決裁者、技術面の前提がまだ見えていません。",
    consider: "まず誰の認識を確かめ、どの不確実性を先に小さくするか考えましょう。",
    day: 1,
    remaining: 84,
  },
  {
    week: "WEEK 4 / 12",
    title: "「小さな」追加要望",
    description: "佐藤さんから検索条件追加の相談が届きました。返事の仕方が、この先の作業量を変えます。",
    theme: "要望と影響",
    situation: "顧客から『小さな変更』として検索条件の追加を求められました。背景と影響はまだ整理されていません。",
    consider: "関係維持だけで即答せず、目的・優先順位・日程への影響をどう確かめるかが焦点です。",
    day: 22,
    remaining: 63,
  },
  {
    week: "WEEK 8 / 12",
    title: "遅れが見えた日",
    description: "開発の遅れと外部APIの仕様変更が重なりました。状況を見極め、立て直してください。",
    theme: "早期検知とリカバリー",
    situation: "開発の遅れと外部APIの仕様変更が同時に表面化しました。序盤の確認状況によって影響が変わります。",
    consider: "事実を早く集め、守る範囲と回復策をどこまで具体化できるか考えましょう。",
    day: 50,
    remaining: 35,
  },
  {
    week: "WEEK 11 / 12",
    title: "リリース1週間前",
    description: "未完了機能と品質懸念が残る中、最終判断を求められています。何を守り、何を動かしますか。",
    theme: "合意のある意思決定",
    situation: "リリース1週間前。未完了機能、品質懸念、顧客の納期要求、チーム疲労が重なっています。",
    consider: "納期・品質・スコープを同時には最大化できません。影響を説明し、誰と何を合意するかが焦点です。",
    day: 78,
    remaining: 7,
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
