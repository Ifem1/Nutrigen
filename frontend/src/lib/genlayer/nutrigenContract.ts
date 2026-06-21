// NutrigenContract — clean wrapper over raw GenLayer client
// All contract interactions go through this file.

import { contractRead, contractWrite, parseJsonResult, parsePipeIndex } from "./client";
import {
  Farm, FeedAdvisor, LivestockBatch, FeedIngredient, FeedStandardVersion,
  OptimizationRequest, FeedDecision, HumanFeedReview, ActivatedFeedPlan,
  AuditLog, ContractSummary, FarmRole,
} from "./types";
import { NUTRIGEN_CONTRACT_ADDRESS } from "./config";

// ---- Helpers ----
function now() {
  return new Date().toISOString();
}

// ============================================================
// Admin reads
// ============================================================

export async function getOwner(): Promise<string> {
  return contractRead<string>("get_owner");
}

export async function isPaused(): Promise<boolean> {
  return contractRead<boolean>("is_paused");
}

export async function getContractSummary(): Promise<ContractSummary> {
  return contractRead<ContractSummary>("get_contract_summary");
}

// ============================================================
// Farm
// ============================================================

export async function createFarm(
  params: {
    farm_id: string;
    name: string;
    farm_type: string;
    location_context: string;
    metadata_hash?: string;
  },
  privateKey: string
) {
  return contractWrite(
    "create_farm",
    [params.farm_id, params.name, params.farm_type, params.location_context, params.metadata_hash ?? "", now()],
    privateKey
  );
}

export async function addFarmRole(farm_id: string, wallet: string, role: string, privateKey: string) {
  return contractWrite("add_farm_role", [farm_id, wallet, role, now()], privateKey);
}

export async function removeFarmRole(farm_id: string, wallet: string, privateKey: string) {
  return contractWrite("remove_farm_role", [farm_id, wallet, now()], privateKey);
}

export async function setFarmStatus(farm_id: string, status: string, privateKey: string) {
  return contractWrite("set_farm_status", [farm_id, status, now()], privateKey);
}

export async function setFarmOptimizationConfig(farm_id: string, config: Record<string, unknown>, privateKey: string) {
  return contractWrite("set_farm_optimization_config", [farm_id, JSON.stringify(config), now()], privateKey);
}

export async function getFarm(farm_id: string): Promise<Farm> {
  return contractRead<Farm>("get_farm", [farm_id]);
}

export async function getFarmRole(farm_id: string, wallet: string): Promise<FarmRole> {
  return contractRead<FarmRole>("get_farm_role", [farm_id, wallet]);
}

export async function getFarmIndex(): Promise<string[]> {
  const raw = await contractRead<string>("get_farm_index");
  return parsePipeIndex(raw);
}

// ============================================================
// Feed Advisor
// ============================================================

export async function registerFeedAdvisor(
  params: {
    advisor_id: string;
    farm_id: string;
    name: string;
    credential_summary: string;
    scope_summary: string;
    wallet: string;
    metadata_hash?: string;
  },
  privateKey: string
) {
  return contractWrite(
    "register_feed_advisor",
    [
      params.advisor_id, params.farm_id, params.name,
      params.credential_summary, params.scope_summary,
      params.wallet, params.metadata_hash ?? "", now(),
    ],
    privateKey
  );
}

export async function setFeedAdvisorStatus(advisor_id: string, status: string, privateKey: string) {
  return contractWrite("set_feed_advisor_status", [advisor_id, status, now()], privateKey);
}

export async function getFeedAdvisor(advisor_id: string): Promise<FeedAdvisor> {
  return contractRead<FeedAdvisor>("get_feed_advisor", [advisor_id]);
}

export async function getFarmAdvisorIndex(farm_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_farm_advisor_index", [farm_id]);
  return parsePipeIndex(raw);
}

// ============================================================
// Livestock Batch
// ============================================================

export async function registerLivestockBatch(
  params: {
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
    metadata_hash?: string;
  },
  privateKey: string
) {
  return contractWrite(
    "register_livestock_batch",
    [
      params.batch_id, params.farm_id, params.species, params.breed_summary,
      params.production_stage, params.production_goal, params.head_count,
      params.weight_summary, params.health_status_summary,
      params.feeding_constraints, params.metadata_hash ?? "", now(),
    ],
    privateKey
  );
}

export async function updateLivestockBatchSummary(
  params: {
    batch_id: string;
    production_goal: string;
    weight_summary: string;
    health_status_summary: string;
    feeding_constraints: string;
  },
  privateKey: string
) {
  return contractWrite(
    "update_livestock_batch_summary",
    [params.batch_id, params.production_goal, params.weight_summary,
     params.health_status_summary, params.feeding_constraints, now()],
    privateKey
  );
}

export async function setLivestockBatchStatus(batch_id: string, status: string, privateKey: string) {
  return contractWrite("set_livestock_batch_status", [batch_id, status, now()], privateKey);
}

export async function getLivestockBatch(batch_id: string): Promise<LivestockBatch> {
  return contractRead<LivestockBatch>("get_livestock_batch", [batch_id]);
}

export async function getFarmBatchIndex(farm_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_farm_batch_index", [farm_id]);
  return parsePipeIndex(raw);
}

// ============================================================
// Feed Ingredient
// ============================================================

export async function registerFeedIngredient(
  params: {
    ingredient_id: string;
    farm_id: string;
    name: string;
    category: string;
    nutrient_profile_summary: string;
    safety_summary: string;
    availability_summary: string;
    cost_summary: string;
    metadata_hash?: string;
  },
  privateKey: string
) {
  return contractWrite(
    "register_feed_ingredient",
    [
      params.ingredient_id, params.farm_id, params.name, params.category,
      params.nutrient_profile_summary, params.safety_summary,
      params.availability_summary, params.cost_summary,
      params.metadata_hash ?? "", now(),
    ],
    privateKey
  );
}

export async function updateFeedIngredient(
  params: {
    ingredient_id: string;
    nutrient_profile_summary: string;
    safety_summary: string;
    availability_summary: string;
    cost_summary: string;
  },
  privateKey: string
) {
  return contractWrite(
    "update_feed_ingredient",
    [params.ingredient_id, params.nutrient_profile_summary,
     params.safety_summary, params.availability_summary, params.cost_summary, now()],
    privateKey
  );
}

export async function setFeedIngredientStatus(ingredient_id: string, status: string, privateKey: string) {
  return contractWrite("set_feed_ingredient_status", [ingredient_id, status, now()], privateKey);
}

export async function getFeedIngredient(ingredient_id: string): Promise<FeedIngredient> {
  return contractRead<FeedIngredient>("get_feed_ingredient", [ingredient_id]);
}

export async function getFarmIngredientIndex(farm_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_farm_ingredient_index", [farm_id]);
  return parsePipeIndex(raw);
}

// ============================================================
// Feed Standard
// ============================================================

export async function publishFeedStandardVersion(
  params: {
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
    standard_hash?: string;
    metadata_hash?: string;
  },
  privateKey: string
) {
  return contractWrite(
    "publish_feed_standard_version",
    [
      params.farm_id, params.standard_id, params.version, params.title,
      params.species_scope, params.production_stage_scope, params.severity,
      params.nutrient_target_rules, params.ingredient_limit_rules,
      params.toxin_and_anti_nutrient_rules, params.health_escalation_rules,
      params.cost_and_availability_rules,
      params.standard_hash ?? "", params.metadata_hash ?? "", now(),
    ],
    privateKey
  );
}

export async function setCurrentFeedStandardVersion(farm_id: string, standard_id: string, version: string, privateKey: string) {
  return contractWrite("set_current_feed_standard_version", [farm_id, standard_id, version, now()], privateKey);
}

export async function setFeedStandardVersionStatus(farm_id: string, standard_id: string, version: string, status: string, privateKey: string) {
  return contractWrite("set_feed_standard_version_status", [farm_id, standard_id, version, status, now()], privateKey);
}

export async function getFeedStandardVersion(farm_id: string, standard_id: string, version: string): Promise<FeedStandardVersion> {
  return contractRead<FeedStandardVersion>("get_feed_standard_version", [farm_id, standard_id, version]);
}

export async function getCurrentFeedStandardVersion(farm_id: string, standard_id: string): Promise<string> {
  return contractRead<string>("get_current_feed_standard_version", [farm_id, standard_id]);
}

export async function getFarmFeedStandardIndex(farm_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_farm_feed_standard_index", [farm_id]);
  return parsePipeIndex(raw);
}

export async function getFeedStandardVersionIndex(farm_id: string, standard_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_feed_standard_version_index", [farm_id, standard_id]);
  return parsePipeIndex(raw);
}

// ============================================================
// Optimization
// ============================================================

export async function submitAndOptimizeFeed(
  params: {
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
    expires_at?: string;
  },
  privateKey: string
) {
  const ts = now();
  const expires = params.expires_at ?? new Date(Date.now() + 7 * 86400000).toISOString();
  return contractWrite(
    "submit_and_optimize_feed",
    [
      params.request_id, params.farm_id, params.batch_id, params.advisor_id,
      params.standard_ids_csv, params.ingredient_ids_csv,
      params.objective_summary, params.current_feeding_summary,
      params.available_feed_summary, params.candidate_ration_summary,
      params.nutrient_analysis_summary, params.cost_constraint_summary,
      params.supply_constraint_summary, params.health_context_summary,
      params.environment_context_summary, params.evidence_manifest_hash,
      params.ration_hash, ts, expires, ts,
    ],
    privateKey
  );
}

export async function getFeedOptimizationRequest(request_id: string): Promise<OptimizationRequest> {
  return contractRead<OptimizationRequest>("get_feed_optimization_request", [request_id]);
}

export async function getLatestDecisionForRequest(request_id: string): Promise<FeedDecision | null> {
  const raw = await contractRead<unknown>("get_latest_decision_for_request", [request_id]);
  const parsed = parseJsonResult<FeedDecision>(raw);
  if (!parsed || !('verdict' in (parsed as object))) return null;
  return parsed;
}

export async function getDecision(decision_id: string): Promise<FeedDecision> {
  return contractRead<FeedDecision>("get_decision", [decision_id]);
}

export async function getRequestDecisionId(request_id: string): Promise<string> {
  return contractRead<string>("get_request_decision_id", [request_id]);
}

// ============================================================
// Human review & activation
// ============================================================

export async function humanFeedReviewDecision(
  params: {
    request_id: string;
    final_verdict: string;
    review_reason: string;
    review_evidence_hash?: string;
    reviewer_notes: string;
  },
  privateKey: string
) {
  return contractWrite(
    "human_feed_review_decision",
    [
      params.request_id, params.final_verdict, params.review_reason,
      params.review_evidence_hash ?? "", params.reviewer_notes, now(),
    ],
    privateKey
  );
}

export async function markFeedPlanActivated(
  params: { request_id: string; activation_hash: string; activation_summary: string },
  privateKey: string
) {
  return contractWrite(
    "mark_feed_plan_activated",
    [params.request_id, params.activation_hash, params.activation_summary, now()],
    privateKey
  );
}

export async function markFeedPlanBlocked(request_id: string, block_reason: string, privateKey: string) {
  return contractWrite("mark_feed_plan_blocked", [request_id, block_reason, now()], privateKey);
}

export async function getHumanReview(request_id: string): Promise<HumanFeedReview | null> {
  const raw = await contractRead<unknown>("get_human_review", [request_id]);
  const parsed = parseJsonResult<HumanFeedReview>(raw);
  if (!parsed || !('final_verdict' in (parsed as object))) return null;
  return parsed;
}

export async function getActivatedFeedPlan(request_id: string): Promise<ActivatedFeedPlan | null> {
  const raw = await contractRead<unknown>("get_activated_feed_plan", [request_id]);
  const parsed = parseJsonResult<ActivatedFeedPlan>(raw);
  if (!parsed || !('activation_hash' in (parsed as object))) return null;
  return parsed;
}

// ============================================================
// Audit
// ============================================================

export async function getAuditLog(audit_id: string): Promise<AuditLog> {
  return contractRead<AuditLog>("get_audit_log", [audit_id]);
}

export async function getRequestAuditIndex(request_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_request_audit_index", [request_id]);
  return parsePipeIndex(raw);
}

export async function getFarmRequestIndex(farm_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_farm_request_index", [farm_id]);
  return parsePipeIndex(raw);
}

export async function getBatchRequestIndex(batch_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_batch_request_index", [batch_id]);
  return parsePipeIndex(raw);
}

export async function getAdvisorRequestIndex(advisor_id: string): Promise<string[]> {
  const raw = await contractRead<string>("get_advisor_request_index", [advisor_id]);
  return parsePipeIndex(raw);
}

export async function isRationHashApproved(ration_hash: string): Promise<string> {
  return contractRead<string>("is_ration_hash_approved", [ration_hash]);
}

export async function isRationHashBlocked(ration_hash: string): Promise<string> {
  return contractRead<string>("is_ration_hash_blocked", [ration_hash]);
}

export async function getReviewerReputation(farm_id: string, reviewer_wallet: string) {
  return contractRead("get_reviewer_reputation", [farm_id, reviewer_wallet]);
}

export { NUTRIGEN_CONTRACT_ADDRESS };
