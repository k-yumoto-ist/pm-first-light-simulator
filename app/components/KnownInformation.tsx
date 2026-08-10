import type { GameFlags } from "../types/game";
import { InfoPopover } from "./InfoPopover";

const items: { flag: keyof Pick<GameFlags, "decisionMakerKnown" | "apiRiskKnown" | "releaseCriteriaKnown">; label: string; value: string; hint: string }[] = [
  { flag: "decisionMakerKnown", label: "最終意思決定者", value: "高橋部長（リリース承認者）", hint: "窓口担当者と最終承認者は同じとは限りません。誰が判断するかを確認する必要があります。" },
  { flag: "apiRiskKnown", label: "技術上の主要リスク", value: "外部APIの仕様確定遅延", hint: "技術に詳しい人へ具体的な懸念を聞くと、計画に影響する不確実性が見えることがあります。" },
  { flag: "releaseCriteriaKnown", label: "リリース成功条件", value: "主要機能の提供と重大障害がないこと", hint: "『成功』の意味は関係者ごとに違います。承認者の基準を知ることが重要です。" },
];

export function KnownInformation({ flags }: { flags: GameFlags }) {
  return <aside className="known-information"><header><div><p>KNOWN INFORMATION</p><h2>判明した重要情報</h2></div><span>{items.filter(item => flags[item.flag]).length} / {items.length}</span></header><ul>{items.map(item => { const known = flags[item.flag]; return <li key={item.flag} className={known ? "unlocked" : "locked"}><span className="fact-state" aria-hidden="true">{known ? "✓" : "LOCK"}</span><span><strong>{item.label}</strong><small>{known ? item.value : "未判明 — 適切な行動で確認できます"}</small></span><InfoPopover label={`${item.label}のヒント`}><p>{item.hint}</p></InfoPopover></li>; })}</ul></aside>;
}
