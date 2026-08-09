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
  kind: "action" | "event";
  turn: number;
  day: number;
  event: string;
  label: string;
  detail: string;
  result: string;
  why: string;
  learning: string;
  changes: MetricChange[];
  tags: ScoreKey[];
};

export type MetricChange = {
  key: keyof Metrics;
  before: number;
  after: number;
};

export type ActionResult = {
  title: string;
  occurred: string;
  why: string;
  learning: string;
  tags: ScoreKey[];
  changes: MetricChange[];
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
