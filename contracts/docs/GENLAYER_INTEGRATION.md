# Nutrigen — GenLayer Integration Guide

## Contract Overview

The `NutrigenContract` is a single GenLayer Intelligent Contract that acts as
the decentralized compliance gate for all livestock feed optimization proposals.

## Contract Methods

### Write Methods

| Method | Description |
|--------|-------------|
| `submit_optimization_request(...)` | Store a feed proposal on-chain before evaluation |
| `evaluate_feed_proposal(request_id)` | **Non-deterministic** — triggers multi-validator LLM consensus |
| `record_consensus_outcome(...)` | Finalize the consensus verdict after reading the tx receipt |

### Read (View) Methods

| Method | Returns |
|--------|---------|
| `get_optimization_request(request_id)` | JSON string of the stored request |
| `get_consensus_result(request_id)` | JSON string of the evaluation result |
| `get_validator_stats(address)` | JSON string of validator reputation stats |
| `get_org_stats(org_id)` | JSON string of org-level aggregate stats |
| `get_request_count()` | Total number of requests submitted |
| `get_owner()` | Contract deployer address |

## Consensus Flow

```
Frontend                    GenLayer                     Real-World APIs
   │                           │                               │
   │ submit_optimization_request()                             │
   │──────────────────────────▶│                               │
   │                           │ stored on-chain               │
   │                           │                               │
   │ evaluate_feed_proposal()  │                               │
   │──────────────────────────▶│                               │
   │                           │──── Validator 1 ─────────────▶│ fetch commodity prices
   │                           │     (LLM eval)  ◀────────────│
   │                           │                               │
   │                           │──── Validator 2 ─────────────▶│ fetch NRC standards
   │                           │     (LLM eval)  ◀────────────│
   │                           │                               │
   │                           │──── Validator N ──────────────▶│
   │                           │     consensus aggregation      │
   │                           │                               │
   │ poll tx receipt           │                               │
   │◀──────────────────────────│                               │
   │                           │                               │
   │ record_consensus_outcome()│                               │
   │──────────────────────────▶│ final verdict stored          │
   │                           │                               │
   │ mirror result to Supabase │                               │
   │──────────────────────────▶│                               │
```

## Environment Variables

```bash
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x...   # Set after deployment
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
```

## Deployment Steps

1. Open https://studio.genlayer.com
2. Connect wallet → select StudioNet
3. New Contract → paste `contracts/src/nutrigen_contract.py`
4. Deploy → approve GEN token fee
5. Copy contract address
6. Run: `bash scripts/deploy/verify-contract.sh <address>`
7. Update `.env` files with the contract address

## Verdict Semantics

| Verdict | Meaning | Frontend Action |
|---------|---------|-----------------|
| `ACCEPTED` | Compliance ≥75%, no critical violations, cost within budget | Show green result, allow implementation |
| `REJECTED` | Compliance <50%, critical violation, or budget exceeded >20% | Show red result, require regeneration |
| `UNDETERMINED` | Borderline, conflicting signals, or data gap | Trigger human-in-the-loop escalation |
