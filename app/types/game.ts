export type CharacterId = "sato" | "takahashi" | "tanaka" | "suzuki";
export type MetricKey = "schedule" | "quality" | "trust" | "team";
export type ScoreKey = "scope" | "schedule" | "stakeholder" | "risk";

export type GameFlags = {
  decisionMakerKnown: boolean;
  apiRiskKnown: boolean;
  apiRiskMitigated: boolean;
  juniorProgressChecked: boolean;
  additionalRequestAccepted: boolean;
  requestBackgroundKnown: boolean;
  impactAnalysisDone: boolean;
  stakeholderAligned: boolean;
  releaseCriteriaKnown: boolean;
  priorityAdjusted: boolean;
  delayRecovered: boolean;
  reportedStatus: boolean;
};

export type Metrics = Record<MetricKey, number> & {
  scopeStability: number;
  riskExposure: number;
  stakeholderAlignment: number;
};

export type ChatMessage = {
  id: string;
  speaker: "player" | CharacterId;
  text: string;
  turn: number;
};

export type ActionLog = {
  id: string;
  turn: number;
  label: string;
  detail: string;
  tags: ScoreKey[];
};

export type GameState = {
  phase: "intro" | "playing" | "result";
  turn: number;
  actionsLeft: number;
  metrics: Metrics;
  flags: GameFlags;
  chats: Record<CharacterId, ChatMessage[]>;
  logs: ActionLog[];
  asked: string[];
  turnNotice: string;
  requestDecision?: string;
  releaseDecision?: string;
};

export type Effect = {
  metrics?: Partial<Record<keyof Metrics, number>>;
  flags?: Partial<GameFlags>;
};
