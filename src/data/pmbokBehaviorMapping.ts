import type { BehaviorTag, PmbokDomain } from "./types";

export const pmbokBehaviorMapping: Record<PmbokDomain, BehaviorTag[]> = {
  governance: ["decision_rights_clarification", "written_agreement"],
  scope: ["purpose_confirmation", "impact_analysis", "alternative_proposal", "business_value_check", "scope_baseline_reference"],
  schedule: ["critical_path_analysis", "recovery_planning", "resource_reallocation", "early_escalation"],
  finance: ["impact_analysis", "alternative_proposal", "business_value_check"],
  stakeholders: ["stakeholder_analysis", "expectation_management", "consensus_building", "written_agreement", "decision_rights_clarification"],
  resources: ["resource_reallocation", "knowledge_transfer", "team_health_monitoring"],
  risk: ["risk_identification", "risk_response_planning", "contingency_planning", "early_escalation"],
};
