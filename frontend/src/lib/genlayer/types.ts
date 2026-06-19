// TypeScript types matching NutrigenContract v0.2.18 on-chain data shapes

export interface Farm {
  farm_id: string;
  name: string;
  farm_type: string;
  location_context: string;
  metadata_hash: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  created_by: string;
  created_at: string;
  updated_at?: string;
  optimization_config: OptimizationConfig;
}

export interface OptimizationConfig {
  min_approve_nutrient_adequacy: string;
  min_approve_suitability: string;
  min_approve_safety: string;
  min_approve_availability: string;
  min_approve_practicality: string;
  max_approve_risk: string;
  auto_review_risk: string;
  auto_reject_risk: string;
}

export interface FeedAdvisor {
  advisor_id: string;
  farm_id: string;
  name: string;
  credential_summary: string;
  scope_summary: string;
  wallet: string;
  metadata_hash: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'ARCHIVED';
  registered_by: string;
  registered_at: string;
  updated_at?: string;
}

export interface LivestockBatch {
  batch_id: string;
  farm_id: string;
  species: string;
  breed_summary: string;
  production_stage: string;
  production_goal: string;
  head_count: string;
  weight_summary: string;
  health_status_summary: string;
  feeding_constraints: string;
  metadata_hash: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  registered_by: string;
  registered_at: string;
  updated_at?: string;
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
  status: 'ACTIVE' | 'UNAVAILABLE' | 'SUSPENDED' | 'ARCHIVED';
  registered_by: string;
  registered_at: string;
  updated_at?: string;
}

export interface FeedStandardVersion {
  farm_id: string;
  standard_id: string;
  version: string;
  title: string;
  species_scope: string;
  production_stage_scope: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nutrient_target_rules: string;
  ingredient_limit_rules: string;
  toxin_and_anti_nutrient_rules: string;
  health_escalation_rules: string;
  cost_and_availability_rules: string;
  standard_hash: string;
  metadata_hash: string;
  status: 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';
  published_by: string;
  published_at: string;
  updated_at?: string;
}

export type RequestStatus =
  | 'PENDING'
  | 'RETRY_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_REVIEW'
  | 'NEEDS_REVISION'
  | 'HUMAN_APPROVED'
  | 'HUMAN_REJECTED'
  | 'ACTIVATED'
  | 'BLOCKED';

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
  submitted_by: string;
  submitted_at: string;
  expires_at: string;
  status: RequestStatus;
  last_decision_id?: string;
  adjudicated_at?: string;
  human_review_id?: string;
  human_decided_at?: string;
  activation_id?: string;
  activated_at?: string;
  blocked_reason?: string;
  blocked_at?: string;
}

export type Verdict = 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | 'NEEDS_REVISION';
export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FeedOptimizationReview {
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
  feeding_instructions: string[];
  monitoring_notes: string[];
  rationale: string;
  audit_summary: string;
  confidence: number;
}

export interface FeedDecision {
  decision_id: string;
  request_id: string;
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  verdict: Verdict;
  request_status: RequestStatus;
  feed_optimization_review: FeedOptimizationReview;
  adjudicated_by: string;
  adjudicated_at: string;
}

export interface Escalation {
  escalation_id: string;
  request_id: string;
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  decision_id: string;
  status: 'OPEN' | 'CLOSED';
  reason: string;
  opened_at: string;
  opened_by: string;
  closed_by?: string;
  closed_at?: string;
  close_reason?: string;
}

export interface HumanFeedReview {
  human_review_id: string;
  request_id: string;
  farm_id: string;
  reviewer: string;
  final_verdict: Verdict;
  request_status: RequestStatus;
  review_reason: string;
  review_evidence_hash: string;
  reviewer_notes: string;
  decided_at: string;
}

export interface ActivatedFeedPlan {
  activation_id: string;
  request_id: string;
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  activation_hash: string;
  activation_summary: string;
  activated_by: string;
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
  created_at: string;
}

export interface ReviewerReputation {
  farm_id: string;
  reviewer: string;
  reviews: number;
  accepted_reviews: number;
  rejected_reviews: number;
  last_reviewed_at: string;
}

export interface ContractSummary {
  owner: string;
  paused: boolean;
  farm_counter: string;
  advisor_counter: string;
  batch_counter: string;
  ingredient_counter: string;
  standard_counter: string;
  request_counter: string;
  decision_counter: string;
  audit_counter: string;
}
