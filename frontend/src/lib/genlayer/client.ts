import { GENLAYER_NETWORK, NUTRIGEN_CONTRACT_ADDRESS } from './config';
import type {
  Farm, FeedAdvisor, LivestockBatch, FeedIngredient, FeedStandardVersion,
  OptimizationRequest, FeedDecision, Escalation, HumanFeedReview,
  ActivatedFeedPlan, AuditLog, ReviewerReputation, ContractSummary,
} from './types';

// ── SDK singleton ──────────────────────────────────────────

let _sdk: typeof import('genlayer-js') | null = null;
async function getSDK() {
  if (!_sdk) _sdk = await import('genlayer-js');
  return _sdk;
}

function makeClient(privateKey?: string) {
  // Returned synchronously — SDK is loaded lazily per call
  return getSDK().then((sdk) =>
    sdk.createClient({
      network: GENLAYER_NETWORK,
      ...(privateKey ? { privateKey } : {}),
    })
  );
}

// ── Base call helpers ──────────────────────────────────────

export async function contractRead<T = unknown>(
  method: string,
  args: unknown[] = []
): Promise<T> {
  if (!NUTRIGEN_CONTRACT_ADDRESS)
    throw new Error('NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS is not set.');
  const client = await makeClient();
  return client.readContract({
    address: NUTRIGEN_CONTRACT_ADDRESS,
    functionName: method,
    args,
  }) as Promise<T>;
}

export async function contractWrite(
  method: string,
  args: unknown[],
  privateKey: string
): Promise<string> {
  if (!NUTRIGEN_CONTRACT_ADDRESS)
    throw new Error('NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS is not set.');
  if (!privateKey) throw new Error('Private key required for contract writes.');
  const client = await makeClient(privateKey);
  const txHash = await client.writeContract({
    address: NUTRIGEN_CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
  return txHash as string;
}

export async function waitForTransaction(
  txHash: string,
  timeoutMs = 120_000,
  pollMs = 3_000
): Promise<{ status: 'ACCEPTED' | 'REJECTED' | 'UNDETERMINED' | 'PENDING'; data?: unknown }> {
  const client = await makeClient();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const receipt = await client.getTransactionReceipt(txHash);
      if (receipt?.status && receipt.status !== 'PENDING')
        return { status: receipt.status as 'ACCEPTED' | 'REJECTED' | 'UNDETERMINED', data: receipt };
    } catch { /* not ready yet */ }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return { status: 'PENDING' };
}

// Parses non-empty JSON string, returns null for empty
function parseOrNull<T>(raw: string): T | null {
  if (!raw || raw.trim() === '') return null;
  return JSON.parse(raw) as T;
}

// Splits pipe-delimited index string into array, filters empties
function splitIndex(raw: string): string[] {
  if (!raw || raw.trim() === '') return [];
  return raw.split('|').filter(Boolean);
}

// ── Contract read wrappers ─────────────────────────────────

export async function getContractSummary(): Promise<ContractSummary | null> {
  const raw = await contractRead<string>('get_contract_summary');
  return parseOrNull<ContractSummary>(raw);
}

export async function getFarm(farmId: string): Promise<Farm | null> {
  const raw = await contractRead<string>('get_farm', [farmId]);
  return parseOrNull<Farm>(raw);
}

export async function getFarmRole(farmId: string, wallet: string): Promise<string> {
  return contractRead<string>('get_farm_role', [farmId, wallet]);
}

export async function getFarmIndex(): Promise<string[]> {
  const raw = await contractRead<string>('get_farm_index');
  return splitIndex(raw);
}

export async function getFeedAdvisor(advisorId: string): Promise<FeedAdvisor | null> {
  const raw = await contractRead<string>('get_feed_advisor', [advisorId]);
  return parseOrNull<FeedAdvisor>(raw);
}

export async function getFarmAdvisorIndex(farmId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_farm_advisor_index', [farmId]);
  return splitIndex(raw);
}

export async function getLivestockBatch(batchId: string): Promise<LivestockBatch | null> {
  const raw = await contractRead<string>('get_livestock_batch', [batchId]);
  return parseOrNull<LivestockBatch>(raw);
}

export async function getFarmBatchIndex(farmId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_farm_batch_index', [farmId]);
  return splitIndex(raw);
}

export async function getFeedIngredient(ingredientId: string): Promise<FeedIngredient | null> {
  const raw = await contractRead<string>('get_feed_ingredient', [ingredientId]);
  return parseOrNull<FeedIngredient>(raw);
}

export async function getFarmIngredientIndex(farmId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_farm_ingredient_index', [farmId]);
  return splitIndex(raw);
}

export async function getFeedStandardVersion(
  farmId: string, standardId: string, version: string
): Promise<FeedStandardVersion | null> {
  const raw = await contractRead<string>('get_feed_standard_version', [farmId, standardId, version]);
  return parseOrNull<FeedStandardVersion>(raw);
}

export async function getCurrentFeedStandardVersion(
  farmId: string, standardId: string
): Promise<string> {
  return contractRead<string>('get_current_feed_standard_version', [farmId, standardId]);
}

export async function getFarmFeedStandardIndex(farmId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_farm_feed_standard_index', [farmId]);
  return splitIndex(raw);
}

export async function getFeedStandardVersionIndex(
  farmId: string, standardId: string
): Promise<string[]> {
  const raw = await contractRead<string>('get_feed_standard_version_index', [farmId, standardId]);
  return splitIndex(raw);
}

export async function getFeedOptimizationRequest(
  requestId: string
): Promise<OptimizationRequest | null> {
  const raw = await contractRead<string>('get_feed_optimization_request', [requestId]);
  return parseOrNull<OptimizationRequest>(raw);
}

export async function getRequestDecisionId(requestId: string): Promise<string> {
  return contractRead<string>('get_request_decision_id', [requestId]);
}

export async function getDecision(decisionId: string): Promise<FeedDecision | null> {
  const raw = await contractRead<string>('get_decision', [decisionId]);
  return parseOrNull<FeedDecision>(raw);
}

export async function getLatestDecisionForRequest(
  requestId: string
): Promise<FeedDecision | null> {
  const raw = await contractRead<string>('get_latest_decision_for_request', [requestId]);
  return parseOrNull<FeedDecision>(raw);
}

export async function getEscalation(requestId: string): Promise<Escalation | null> {
  const raw = await contractRead<string>('get_escalation', [requestId]);
  return parseOrNull<Escalation>(raw);
}

export async function getHumanReview(requestId: string): Promise<HumanFeedReview | null> {
  const raw = await contractRead<string>('get_human_review', [requestId]);
  return parseOrNull<HumanFeedReview>(raw);
}

export async function getActivatedFeedPlan(
  requestId: string
): Promise<ActivatedFeedPlan | null> {
  const raw = await contractRead<string>('get_activated_feed_plan', [requestId]);
  return parseOrNull<ActivatedFeedPlan>(raw);
}

export async function getFarmRequestIndex(farmId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_farm_request_index', [farmId]);
  return splitIndex(raw);
}

export async function getBatchRequestIndex(batchId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_batch_request_index', [batchId]);
  return splitIndex(raw);
}

export async function getAdvisorRequestIndex(advisorId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_advisor_request_index', [advisorId]);
  return splitIndex(raw);
}

export async function getAuditLog(auditId: string): Promise<AuditLog | null> {
  const raw = await contractRead<string>('get_audit_log', [auditId]);
  return parseOrNull<AuditLog>(raw);
}

export async function getRequestAuditIndex(requestId: string): Promise<string[]> {
  const raw = await contractRead<string>('get_request_audit_index', [requestId]);
  return splitIndex(raw);
}

export async function getReviewerReputation(
  farmId: string, reviewerWallet: string
): Promise<ReviewerReputation | null> {
  const raw = await contractRead<string>('get_reviewer_reputation', [farmId, reviewerWallet]);
  return parseOrNull<ReviewerReputation>(raw);
}

export async function isRationHashApproved(rationHash: string): Promise<string> {
  return contractRead<string>('is_ration_hash_approved', [rationHash]);
}

export async function isRationHashBlocked(rationHash: string): Promise<string> {
  return contractRead<string>('is_ration_hash_blocked', [rationHash]);
}

// ── Contract write wrappers ────────────────────────────────

export async function createFarm(
  args: {
    farm_id: string; name: string; farm_type: string;
    location_context: string; metadata_hash: string; created_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('create_farm', [
    args.farm_id, args.name, args.farm_type,
    args.location_context, args.metadata_hash, args.created_at,
  ], privateKey);
}

export async function addFarmRole(
  args: { farm_id: string; wallet: string; role: string; added_at: string },
  privateKey: string
): Promise<string> {
  return contractWrite('add_farm_role', [
    args.farm_id, args.wallet, args.role, args.added_at,
  ], privateKey);
}

export async function removeFarmRole(
  args: { farm_id: string; wallet: string; removed_at: string },
  privateKey: string
): Promise<string> {
  return contractWrite('remove_farm_role', [
    args.farm_id, args.wallet, args.removed_at,
  ], privateKey);
}

export async function setFarmStatus(
  args: { farm_id: string; status: string; updated_at: string },
  privateKey: string
): Promise<string> {
  return contractWrite('set_farm_status', [
    args.farm_id, args.status, args.updated_at,
  ], privateKey);
}

export async function registerFeedAdvisor(
  args: {
    advisor_id: string; farm_id: string; name: string;
    credential_summary: string; scope_summary: string;
    wallet: string; metadata_hash: string; registered_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('register_feed_advisor', [
    args.advisor_id, args.farm_id, args.name,
    args.credential_summary, args.scope_summary,
    args.wallet, args.metadata_hash, args.registered_at,
  ], privateKey);
}

export async function registerLivestockBatch(
  args: {
    batch_id: string; farm_id: string; species: string;
    breed_summary: string; production_stage: string; production_goal: string;
    head_count: string; weight_summary: string; health_status_summary: string;
    feeding_constraints: string; metadata_hash: string; registered_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('register_livestock_batch', [
    args.batch_id, args.farm_id, args.species,
    args.breed_summary, args.production_stage, args.production_goal,
    args.head_count, args.weight_summary, args.health_status_summary,
    args.feeding_constraints, args.metadata_hash, args.registered_at,
  ], privateKey);
}

export async function registerFeedIngredient(
  args: {
    ingredient_id: string; farm_id: string; name: string; category: string;
    nutrient_profile_summary: string; safety_summary: string;
    availability_summary: string; cost_summary: string;
    metadata_hash: string; registered_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('register_feed_ingredient', [
    args.ingredient_id, args.farm_id, args.name, args.category,
    args.nutrient_profile_summary, args.safety_summary,
    args.availability_summary, args.cost_summary,
    args.metadata_hash, args.registered_at,
  ], privateKey);
}

export async function publishFeedStandardVersion(
  args: {
    farm_id: string; standard_id: string; version: string; title: string;
    species_scope: string; production_stage_scope: string; severity: string;
    nutrient_target_rules: string; ingredient_limit_rules: string;
    toxin_and_anti_nutrient_rules: string; health_escalation_rules: string;
    cost_and_availability_rules: string; standard_hash: string;
    metadata_hash: string; published_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('publish_feed_standard_version', [
    args.farm_id, args.standard_id, args.version, args.title,
    args.species_scope, args.production_stage_scope, args.severity,
    args.nutrient_target_rules, args.ingredient_limit_rules,
    args.toxin_and_anti_nutrient_rules, args.health_escalation_rules,
    args.cost_and_availability_rules, args.standard_hash,
    args.metadata_hash, args.published_at,
  ], privateKey);
}

export async function submitAndOptimizeFeed(
  args: {
    request_id: string; farm_id: string; batch_id: string; advisor_id: string;
    standard_ids_csv: string; ingredient_ids_csv: string;
    objective_summary: string; current_feeding_summary: string;
    available_feed_summary: string; candidate_ration_summary: string;
    nutrient_analysis_summary: string; cost_constraint_summary: string;
    supply_constraint_summary: string; health_context_summary: string;
    environment_context_summary: string; evidence_manifest_hash: string;
    ration_hash: string; submitted_at: string; expires_at: string;
    adjudicated_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('submit_and_optimize_feed', [
    args.request_id, args.farm_id, args.batch_id, args.advisor_id,
    args.standard_ids_csv, args.ingredient_ids_csv,
    args.objective_summary, args.current_feeding_summary,
    args.available_feed_summary, args.candidate_ration_summary,
    args.nutrient_analysis_summary, args.cost_constraint_summary,
    args.supply_constraint_summary, args.health_context_summary,
    args.environment_context_summary, args.evidence_manifest_hash,
    args.ration_hash, args.submitted_at, args.expires_at, args.adjudicated_at,
  ], privateKey);
}

export async function humanFeedReviewDecision(
  args: {
    request_id: string; final_verdict: string; review_reason: string;
    review_evidence_hash: string; reviewer_notes: string; decided_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('human_feed_review_decision', [
    args.request_id, args.final_verdict, args.review_reason,
    args.review_evidence_hash, args.reviewer_notes, args.decided_at,
  ], privateKey);
}

export async function markFeedPlanActivated(
  args: {
    request_id: string; activation_hash: string;
    activation_summary: string; activated_at: string;
  },
  privateKey: string
): Promise<string> {
  return contractWrite('mark_feed_plan_activated', [
    args.request_id, args.activation_hash,
    args.activation_summary, args.activated_at,
  ], privateKey);
}

export async function markFeedPlanBlocked(
  args: { request_id: string; block_reason: string; blocked_at: string },
  privateKey: string
): Promise<string> {
  return contractWrite('mark_feed_plan_blocked', [
    args.request_id, args.block_reason, args.blocked_at,
  ], privateKey);
}
