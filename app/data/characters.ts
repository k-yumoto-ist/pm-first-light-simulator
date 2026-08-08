import type { CharacterId } from "../types/game";

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: string;
};

export const characters: Character[] = [
  { id: "sato", name: "佐藤", role: "顧客担当者", initials: "佐", color: "coral", status: "窓口・要望を取りまとめ" },
  { id: "takahashi", name: "高橋", role: "顧客部長", initials: "高", color: "gold", status: "多忙・事業影響を重視" },
  { id: "tanaka", name: "田中", role: "テックリード", initials: "田", color: "blue", status: "技術・開発計画を担当" },
  { id: "suzuki", name: "鈴木", role: "若手エンジニア", initials: "鈴", color: "mint", status: "検索画面を実装中" },
];
