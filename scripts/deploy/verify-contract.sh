#!/usr/bin/env bash
# ============================================================
# Nutrigen Contract Verification Script
# Usage: bash scripts/deploy/verify-contract.sh <contract_address>
# ============================================================

set -e

if [ -z "$1" ]; then
  echo "Usage: bash scripts/deploy/verify-contract.sh <contract_address>"
  exit 1
fi

CONTRACT_ADDRESS=$1

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   NUTRIGEN — Contract Verification           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📌  Contract: $CONTRACT_ADDRESS"
echo ""

echo "══════════════════════════════════════════════"
echo "  STEP 1 — Verify view methods in Studio"
echo "══════════════════════════════════════════════"
echo ""
echo "  Open https://studio.genlayer.com → find contract $CONTRACT_ADDRESS"
echo "  Call these read methods and confirm they return data:"
echo ""
echo "    get_owner()                        → your wallet address"
echo "    get_request_count()                → 0 (fresh deploy)"
echo "    get_optimization_request('test')   → {\"error\": \"Request not found\"}"
echo "    get_consensus_result('test')       → {\"error\": \"Result not found\"}"
echo "    get_validator_stats('0x...')       → default stats object"
echo "    get_org_stats('test-org')          → default stats object"
echo ""

echo "══════════════════════════════════════════════"
echo "  STEP 2 — Test submit_optimization_request"
echo "══════════════════════════════════════════════"
echo ""
echo "  Call submit_optimization_request() with sample args:"
echo "    request_id: 'test-001'"
echo "    org_id: 'org-test'"
echo "    agent_id: 'agent-test'"
echo "    livestock_type: 'poultry_broiler'"
echo "    breed: 'Ross 308'"
echo "    herd_size: 500"
echo "    avg_weight_kg: 1.2"
echo "    target_weight_kg: 2.5"
echo "    growth_stage: 'grower'"
echo "    location_country: 'Nigeria'"
echo "    ... (fill remaining required fields)"
echo ""
echo "  Then call get_optimization_request('test-001')"
echo "  → Should return the stored request JSON"
echo ""

echo "══════════════════════════════════════════════"
echo "  STEP 3 — Test evaluate_feed_proposal"
echo "══════════════════════════════════════════════"
echo ""
echo "  Call evaluate_feed_proposal('test-001')"
echo "  → This triggers GenLayer consensus (may take 30-120 seconds)"
echo "  → Multiple validators independently run the LLM evaluation"
echo "  → Poll get_consensus_result('test-001') until populated"
echo ""
echo "  Expected result fields:"
echo "    consensus_verdict: ACCEPTED | REJECTED | UNDETERMINED"
echo "    compliance_score: 0-100"
echo "    risk_score: 0-100"
echo "    risk_level: low | medium | high | critical"
echo "    justification: <detailed expert analysis>"
echo ""

echo "══════════════════════════════════════════════"
echo "  STEP 4 — Update environment files"
echo "══════════════════════════════════════════════"
echo ""
echo "  frontend/.env.local:"
echo "    NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo "    NEXT_PUBLIC_GENLAYER_NETWORK=studionet"
echo ""
echo "  Vercel Dashboard → Project Settings → Environment Variables:"
echo "    NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo "    NEXT_PUBLIC_GENLAYER_NETWORK=studionet"
echo ""
echo "✅  Verification checklist complete."
echo "    Share the contract address with the team and proceed to Phase 7."
echo ""
