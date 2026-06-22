// contractSync.ts
// After a successful on-chain write, mirror the result to Supabase.
// Supabase is read-optimised cache only — it never overrides contract state.

import { createClient } from '@/lib/supabase/client';
import { NUTRIGEN_CONTRACT_ADDRESS, GENLAYER_CHAIN_ID, explorerTxUrl } from '@/lib/genlayer/config';

const CHAIN_ID = GENLAYER_CHAIN_ID;
const CONTRACT = NUTRIGEN_CONTRACT_ADDRESS;

function base(txHash: string) {
  return {
    contract_address: CONTRACT,
    chain_id: CHAIN_ID,
    tx_hash: txHash,
    explorer_url: explorerTxUrl(txHash),
    sync_status: 'synced',
  };
}

export async function syncFarm(
  txHash: string,
  farm: {
    farm_id: string; name: string; farm_type: string;
    location_context: string; owner_wallet: string; metadata_hash?: string;
  },
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('farms').upsert({
    id: farm.farm_id,
    name: farm.name,
    farm_type: farm.farm_type,
    location_context: farm.location_context,
    owner_wallet: farm.owner_wallet,
    metadata_hash: farm.metadata_hash ?? '',
    status: 'ACTIVE',
    created_by: userId ?? null,
    ...base(txHash),
    updated_at: new Date().toISOString(),
  });
  await logTransaction(txHash, 'create_farm', farm);
}

export async function syncFeedAdvisor(
  txHash: string,
  advisor: {
    advisor_id: string; farm_id: string; name: string;
    credential_summary: string; scope_summary: string;
    wallet: string; metadata_hash?: string;
  },
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('feed_advisors').upsert({
    id: advisor.advisor_id,
    farm_id: advisor.farm_id,
    name: advisor.name,
    credential_summary: advisor.credential_summary,
    scope_summary: advisor.scope_summary,
    wallet: advisor.wallet,
    metadata_hash: advisor.metadata_hash ?? '',
    status: 'ACTIVE',
    created_by: userId ?? null,
    ...base(txHash),
    updated_at: new Date().toISOString(),
  });
  await logTransaction(txHash, 'register_feed_advisor', advisor);
}

export async function syncLivestockBatch(
  txHash: string,
  batch: {
    batch_id: string; farm_id: string; species: string; breed_summary: string;
    production_stage: string; production_goal: string; head_count: number;
    weight_summary: string; health_status_summary: string;
    feeding_constraints: string; metadata_hash?: string;
  },
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('livestock_batches').upsert({
    id: batch.batch_id,
    farm_id: batch.farm_id,
    species: batch.species,
    breed_summary: batch.breed_summary,
    production_stage: batch.production_stage,
    production_goal: batch.production_goal,
    head_count: batch.head_count,
    weight_summary: batch.weight_summary,
    health_status_summary: batch.health_status_summary,
    feeding_constraints: batch.feeding_constraints,
    metadata_hash: batch.metadata_hash ?? '',
    status: 'ACTIVE',
    created_by: userId ?? null,
    ...base(txHash),
    updated_at: new Date().toISOString(),
  });
  await logTransaction(txHash, 'register_livestock_batch', batch);
}

export async function syncFeedIngredient(
  txHash: string,
  ingredient: {
    ingredient_id: string; farm_id: string; name: string; category: string;
    nutrient_profile_summary: string; safety_summary: string;
    availability_summary: string; cost_summary: string; metadata_hash?: string;
  },
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('feed_ingredients').upsert({
    id: ingredient.ingredient_id,
    farm_id: ingredient.farm_id,
    name: ingredient.name,
    category: ingredient.category,
    nutrient_profile_summary: ingredient.nutrient_profile_summary,
    safety_summary: ingredient.safety_summary,
    availability_summary: ingredient.availability_summary,
    cost_summary: ingredient.cost_summary,
    metadata_hash: ingredient.metadata_hash ?? '',
    status: 'ACTIVE',
    created_by: userId ?? null,
    ...base(txHash),
    updated_at: new Date().toISOString(),
  });
  await logTransaction(txHash, 'register_feed_ingredient', ingredient);
}

export async function syncFeedStandardVersion(
  txHash: string,
  sv: {
    farm_id: string; standard_id: string; version: string; title: string;
    species_scope: string; production_stage_scope: string; severity: string;
    nutrient_target_rules: string; ingredient_limit_rules: string;
    toxin_and_anti_nutrient_rules: string; health_escalation_rules: string;
    cost_and_availability_rules: string; standard_hash?: string; metadata_hash?: string;
  },
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('feed_standard_versions').upsert({
    farm_id: sv.farm_id,
    standard_id: sv.standard_id,
    version: sv.version,
    title: sv.title,
    species_scope: sv.species_scope,
    production_stage_scope: sv.production_stage_scope,
    severity: sv.severity,
    nutrient_target_rules: sv.nutrient_target_rules,
    ingredient_limit_rules: sv.ingredient_limit_rules,
    toxin_and_anti_nutrient_rules: sv.toxin_and_anti_nutrient_rules,
    health_escalation_rules: sv.health_escalation_rules,
    cost_and_availability_rules: sv.cost_and_availability_rules,
    standard_hash: sv.standard_hash ?? '',
    metadata_hash: sv.metadata_hash ?? '',
    status: 'DRAFT',
    is_current: false,
    created_by: userId ?? null,
    ...base(txHash),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'farm_id,standard_id,version' });
  await logTransaction(txHash, 'publish_feed_standard_version', sv);
}

export async function syncOptimizationRequest(
  txHash: string,
  req: {
    request_id: string; farm_id: string; batch_id: string; advisor_id: string;
    standard_ids_csv: string; ingredient_ids_csv: string;
    objective_summary: string; current_feeding_summary: string;
    available_feed_summary: string; candidate_ration_summary: string;
    nutrient_analysis_summary: string; cost_constraint_summary: string;
    supply_constraint_summary: string; health_context_summary: string;
    environment_context_summary: string; evidence_manifest_hash: string;
    ration_hash: string;
  },
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('feed_optimization_requests').upsert({
    id: req.request_id,
    farm_id: req.farm_id,
    batch_id: req.batch_id,
    advisor_id: req.advisor_id || null,
    standard_ids_csv: req.standard_ids_csv,
    ingredient_ids_csv: req.ingredient_ids_csv,
    objective_summary: req.objective_summary,
    current_feeding_summary: req.current_feeding_summary,
    available_feed_summary: req.available_feed_summary,
    candidate_ration_summary: req.candidate_ration_summary,
    nutrient_analysis_summary: req.nutrient_analysis_summary,
    cost_constraint_summary: req.cost_constraint_summary,
    supply_constraint_summary: req.supply_constraint_summary,
    health_context_summary: req.health_context_summary,
    environment_context_summary: req.environment_context_summary,
    evidence_manifest_hash: req.evidence_manifest_hash,
    ration_hash: req.ration_hash,
    status: 'PENDING',
    created_by: userId ?? null,
    ...base(txHash),
    updated_at: new Date().toISOString(),
  });
  await logTransaction(txHash, 'submit_and_optimize_feed', req);
}

export async function syncFeedDecision(
  txHash: string,
  requestId: string,
  decision: Record<string, unknown>
) {
  const supabase = createClient();
  const decisionId = `dec_${requestId}`;

  await supabase.from('feed_decisions').upsert({
    id: decisionId,
    request_id: requestId,
    verdict: decision.verdict,
    nutrient_adequacy_score: decision.nutrient_adequacy_score,
    livestock_suitability_score: decision.livestock_suitability_score,
    safety_score: decision.safety_score,
    cost_efficiency_score: decision.cost_efficiency_score,
    availability_score: decision.availability_score,
    production_goal_alignment_score: decision.production_goal_alignment_score,
    explainability_score: decision.explainability_score,
    practicality_score: decision.practicality_score,
    risk_score: decision.risk_score,
    risk_band: decision.risk_band,
    reviewer_required: decision.reviewer_required,
    revision_required: decision.revision_required,
    recommended_ration_summary: decision.recommended_ration_summary,
    ingredient_mix_summary: decision.ingredient_mix_summary,
    daily_feeding_summary: decision.daily_feeding_summary,
    transition_plan_summary: decision.transition_plan_summary,
    nutrient_gaps: decision.nutrient_gaps,
    excess_risks: decision.excess_risks,
    ingredient_risks: decision.ingredient_risks,
    health_warnings: decision.health_warnings,
    cost_findings: decision.cost_findings,
    availability_findings: decision.availability_findings,
    required_changes: decision.required_changes,
    strengths: decision.strengths,
    feeding_instructions: decision.feeding_instructions,
    monitoring_notes: decision.monitoring_notes,
    rationale: decision.rationale,
    audit_summary: decision.audit_summary,
    confidence: decision.confidence,
    adjudicated_at: decision.adjudicated_at,
    raw_contract_json: decision,
    ...base(txHash),
  });

  // Update request status
  const statusMap: Record<string, string> = {
    APPROVED: 'APPROVED', REJECTED: 'REJECTED',
    NEEDS_REVIEW: 'NEEDS_REVIEW', NEEDS_REVISION: 'NEEDS_REVISION',
  };
  const verdict = String(decision.verdict ?? '');
  await supabase.from('feed_optimization_requests').update({
    status: statusMap[verdict] ?? 'NEEDS_REVIEW',
    last_decision_id: decisionId,
    updated_at: new Date().toISOString(),
  }).eq('id', requestId);
}

export async function syncHumanReview(
  txHash: string,
  review: {
    request_id: string; final_verdict: string; review_reason: string;
    reviewer_notes: string; review_evidence_hash?: string;
  }
) {
  const supabase = createClient();
  await supabase.from('human_feed_reviews').upsert({
    request_id: review.request_id,
    final_verdict: review.final_verdict,
    review_reason: review.review_reason,
    reviewer_notes: review.reviewer_notes,
    review_evidence_hash: review.review_evidence_hash ?? '',
    decided_at: new Date().toISOString(),
    tx_hash: txHash,
    explorer_url: explorerTxUrl(txHash),
  });
  const statusMap: Record<string, string> = {
    APPROVED: 'HUMAN_APPROVED', REJECTED: 'HUMAN_REJECTED', NEEDS_REVISION: 'NEEDS_REVISION',
  };
  await supabase.from('feed_optimization_requests').update({
    status: statusMap[review.final_verdict] ?? 'NEEDS_REVISION',
    human_decided_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', review.request_id);
  await logTransaction(txHash, 'human_feed_review_decision', review);
}

export async function syncActivatedFeedPlan(
  txHash: string,
  plan: { request_id: string; activation_hash: string; activation_summary: string; activated_by: string }
) {
  const supabase = createClient();
  await supabase.from('activated_feed_plans').upsert({
    request_id: plan.request_id,
    activated_by: plan.activated_by,
    activation_hash: plan.activation_hash,
    activation_summary: plan.activation_summary,
    activated_at: new Date().toISOString(),
    tx_hash: txHash,
    explorer_url: explorerTxUrl(txHash),
  }, { onConflict: 'request_id' });
  await supabase.from('feed_optimization_requests').update({
    status: 'ACTIVATED',
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', plan.request_id);
  await logTransaction(txHash, 'mark_feed_plan_activated', plan);
}

async function logTransaction(txHash: string, method: string, args: unknown) {
  try {
    const supabase = createClient();
    await supabase.from('contract_transactions').insert({
      method,
      args,
      tx_hash: txHash,
      status: 'success',
      explorer_url: explorerTxUrl(txHash),
      chain_id: CHAIN_ID,
    });
  } catch {
    // Non-critical — don't break the UI if logging fails
  }
}
