import type { GameState, ScoreKey } from "../types/game";

export function buildFeedback(state: GameState) {
  const items: { area: ScoreKey; title: string; story: string; lesson: string; positive: boolean }[] = [];
  items.push(state.flags.decisionMakerKnown
    ? { area: "stakeholder", title: "判断する人を早めに見つけた", story: "序盤で佐藤さんの先にいる高橋さんを認識できたため、リリース判断の前に期待を確認する道ができました。", lesson: "PMBOKでは、影響力や決定権を持つ関係者を特定し、適切なタイミングで関与してもらうことを重視します。", positive: true }
    : { area: "stakeholder", title: "窓口と決裁者は同じとは限らない", story: "顧客窓口とは会話しましたが、最終意思決定者を確認しないまま終盤を迎えました。高橋さんには『聞いていない』という感覚が残りました。", lesson: "PMBOKでいうステークホルダーの特定は、名簿作りではなく、誰が何を決め、何に影響するかを理解する活動です。", positive: false });
  items.push(state.flags.impactAnalysisDone
    ? { area: "scope", title: "要望を約束に変える前に立ち止まった", story: "追加要望を、背景と影響を確認してから扱いました。顧客の真の目的と、守るべき機能を分けられました。", lesson: "スコープ管理では、変更を拒むのではなく、価値・作業量・日程への影響を見える形にして合意します。", positive: true }
    : { area: "scope", title: "小さく見える要望にも作業が連なる", story: state.flags.additionalRequestAccepted ? "追加要望をその場で受け入れた結果、実装だけでなくテストと調整の負荷も増えました。" : "追加要望への方針は決めましたが、作業量や日程への影響を十分に確かめませんでした。", lesson: "PMBOKのスコープ管理では、変更の背景と影響を評価し、優先順位を合意してから計画へ反映します。", positive: false });
  items.push(state.flags.juniorProgressChecked
    ? { area: "schedule", title: "『大丈夫』を具体化した", story: "鈴木さんの完了・残作業・予定との差を確認し、遅れが小さいうちに支援の選択肢を持てました。", lesson: "スケジュール管理は表を更新するだけでなく、実際の進み方と残作業を定期的に確かめることです。", positive: true }
    : { area: "schedule", title: "報告を待つと、遅れは大きく見つかる", story: "鈴木さんは自分から遅れを言い出せず、5日分の遅れになってから表面化しました。", lesson: "進捗確認では、責めずに事実と障害を聞ける場を作ることが、早期検知と予測の更新につながります。", positive: false });
  items.push(state.flags.apiRiskKnown
    ? { area: "risk", title: "問題になる前に不確実性を扱った", story: state.flags.apiRiskMitigated ? "外部APIの仕様遅延を知り、モックと影響局所化を準備したため、仕様変更の影響を小さくできました。" : "外部APIの不確実性を早めに認識できました。対策まで具体化できれば、さらに影響を抑えられます。", lesson: "リスク管理は悪い出来事の予言ではなく、不確実性を先に見つけ、対応を選べる状態にすることです。", positive: true }
    : { area: "risk", title: "問題が起きてからでは選択肢が減る", story: "外部APIについて確認しなかったため、仕様変更が発生してから設計と日程を見直すことになりました。", lesson: "PMBOKでは、リスクを事前に特定・分析し、回避・軽減・受容などの対応を準備します。", positive: false });
  return items;
}
