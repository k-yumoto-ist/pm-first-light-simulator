export type PmbokDomain =
  | "governance"
  | "scope"
  | "schedule"
  | "finance"
  | "stakeholders"
  | "resources"
  | "risk";

export type Difficulty = "guided" | "standard" | "challenge";

export interface ProjectState {
  schedule: number;
  budget: number;
  quality: number;
  trust: number;
  teamHealth: number;
  businessValue: number;
  riskExposure: number;
}

export interface HiddenState {
  scopeCreep: number;
  burnoutRisk: number;
  keyPersonDependency: number;
  customerExpectationGap: number;
  decisionOwnerDefined: boolean;
  contingencyPrepared: boolean;
  technicalDebt: number;
  knowledgeConcentration: number;
  agreementRecorded: boolean;
}

export type BehaviorTag =
  | "purpose_confirmation"
  | "impact_analysis"
  | "alternative_proposal"
  | "business_value_check"
  | "scope_baseline_reference"
  | "early_escalation"
  | "risk_identification"
  | "risk_response_planning"
  | "contingency_planning"
  | "critical_path_analysis"
  | "resource_reallocation"
  | "recovery_planning"
  | "stakeholder_analysis"
  | "expectation_management"
  | "consensus_building"
  | "written_agreement"
  | "team_health_monitoring"
  | "knowledge_transfer"
  | "decision_rights_clarification";

export interface BehaviorStandardEvidence {
  areaId: string;
  elementId: string;
  behavior: BehaviorTag;
  weight: number;
}

export interface ChoiceFeedback {
  whatHappened: string;
  why: string;
  pmPoint: string;
}

export interface ScenarioChoice {
  id: string;
  title: string;
  description: string;
  effects: Partial<ProjectState>;
  hiddenEffects: Partial<HiddenState>;
  behaviorEvidence: BehaviorStandardEvidence[];
  feedback: ChoiceFeedback;
}

export interface ScenarioEvent {
  id: string;
  title: string;
  situation: string;
  decisionPrompt: string;
  choices: ScenarioChoice[];
}

export interface ScenarioBriefing {
  context: string;
  objective: string;
  initialUnknowns: string[];
}

export interface ConsequenceResult {
  effects: Partial<ProjectState>;
  hiddenEffects?: Partial<HiddenState>;
  whatHappened?: string;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  subtitle: string;
  primaryDomain: PmbokDomain;
  relatedDomains: PmbokDomain[];
  trainingTitle?: string;
  scenarioTitle?: string;
  briefing: ScenarioBriefing;
  initialState: ProjectState;
  initialHiddenState: HiddenState;
  events: ScenarioEvent[];
  observedBehaviorTags: BehaviorTag[];
  opportunityBehaviorTags: BehaviorTag[];
  resolveConsequence?: (
    hidden: HiddenState,
    eventIndex: number,
  ) => ConsequenceResult | null;
}
