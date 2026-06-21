// GenLayer / NutrigenContract TypeScript types

export type FarmStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type BatchStatus = "ACTIVE" | "INACTIVE" | "CULLED";
export type IngredientStatus = "ACTIVE" | "INACTIVE" | "RECALLED";
export type StandardStatus = "DRAFT" | "ACTIVE" | "DEPRECATED" | "REVOKED";
export type AdvisorStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_REVIEW"
  | "NEEDS_REVISION"
  | "HUMAN_APPROVED"
  | "HUMAN_REJECTED"
  | "ACTIVATED"
  | "BLOCKED";
export type Verdict = "APPROVED" | "REJECTED" | "NEEDS_REVIEW" | "NEEDS_REVISION";
export type HumanVerdict = "APPROVED" | "REJECTED" | "NEEDS_REVISION";
export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FarmRole = "owner" | "admin" | "manager" | "reviewer" | "viewer" | "none";

export interface Farm {
  farm_id: string;
  name: string;
  farm_type: string;
  location_context: string;
  owner: string;
  metadata_hash: string;
  status: FarmStatus;
  optimization_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeedAdvisor {
  advisor_id: string;
  farm_id: string;
  name: string;
  credential_summary: string;
  scope_summary: string;
  wallet: string;
  metadata_hash: string;
  status: AdvisorStatus;
  registered_at: string;
  updated_at: string;
}

export interface LivestockBatch {
  batch_id: string;
  farm_id: string;
  species: string;
  breed_summary: string;
  production_stage: string;
  production_goal: string;
  head_count: number;
  weight_summary: string;
  health_status_summary: string;
  feeding_constraints: string;
  metadata_hash: string;
  status: BatchStatus;
  registered_at: string;
  updated_at: string;
}

export interface FeedIngredient {
  ingredient_id: string;
  farm_id: string;
  name: string;
  category: string;
  nutrient_profile_summary: string;
  safety_summary: string;
  availability_summary: string;
  cost_summary: string;
  metadata_hash: string;
  status: IngredientStatus;
  registered_at: string;
  updated_at: string;
}

export interface FeedStandardVersion {
  farm_id: string;
  standard_id: string;
  version: string;
  title: string;
  species_scope: string;
  production_stage_scope: string;
  severity: string;
  nutrient_target_rules: string;
  ingredient_limit_rules: string;
  toxin_and_anti_nutrient_rules: string;
  health_escalation_rules: string;
  cost_and_availability_rules: string;
  standard_hash: string;
  metadata_hash: string;
  status: StandardStatus;
  is_current: boolean;
  published_at: string;
  updated_at: string;
}

export interface OptimizationRequest {
  request_id: string;
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  standard_ids_csv: string;
  ingredient_ids_csv: string;
  objective_summary: string;
  current_feeding_summary: string;
  available_feed_summary: string;
  candidate_ration_summary: string;
  nutrient_analysis_summary: string;
  cost_constraint_summary: string;
  supply_constraint_summary: string;
  health_context_summary: string;
  environment_context_summary: string;
  evidence_manifest_hash: string;
  ration_hash: string;
  status: RequestStatus;
  last_decision_id: string;
  human_decided_at: string;
  activated_at: string;
  blocked_at: string;
  submitted_at: string;
  expires_at: string;
}

export interface FeedDecision {
  decision_id: string;
  request_id: string;
  verdict: Verdict;
  nutrient_adequacy_score: number;
  livestock_suitability_score: number;
  safety_score: number;
  cost_efficiency_score: number;
  availability_score: number;
  production_goal_alignment_score: number;
  explainability_score: number;
  practicality_score: number;
  risk_score: number;
  risk_band: RiskBand;
  reviewer_required: boolean;
  revision_required: boolean;
  recommended_ration_summary: string;
  ingredient_mix_summary: string;
  daily_feeding_summary: string;
  transition_plan_summary: string;
  nutrient_gaps: string[];
  excess_risks: string[];
  ingredient_risks: string[];
  health_warnings: string[];
  cost_findings: string[];
  availability_findings: string[];
  required_changes: string[];
  strengths: string[];
  feeding_instructions: string;
  monitoring_notes: string;
  rationale: string;
  audit_summary: string;
  confidence: number;
  adjudicated_at: string;
}

export interface HumanFeedReview {
  request_id: string;
  reviewer_wallet: string;
  final_verdict: HumanVerdict;
  review_reason: string;
  review_evidence_hash: string;
  reviewer_notes: string;
  decided_at: string;
}

export interface ActivatedFeedPlan {
  request_id: string;
  activated_by: string;
  activation_hash: string;
  activation_summary: string;
  activated_at: string;
}

export interface AuditLog {
  audit_id: string;
  farm_id: string;
  request_id: string;
  event_type: string;
  actor: string;
  summary: string;
  data_hash: string;
  logged_at: string;
}

export interface ContractSummary {
  owner: string;
  paused: boolean;
  total_farms: number;
  total_advisors: number;
  total_batches: number;
  total_ingredients: number;
  total_requests: number;
  total_decisions: number;
  total_activated_plans: number;
  total_human_reviews: number;
  version: string;
}

export interface ContractCallResult<T = unknown> {
  txHash: string;
  explorerUrl: string;
  data?: T;
  error?: string;
}
