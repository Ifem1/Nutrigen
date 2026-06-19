"""
Pytest configuration for Nutrigen contract tests.
These tests are designed to run against the GenLayer Studio simulator.

Usage:
  # Via GenLayer CLI (runs against live simulator):
  genlayer test contracts/tests/test_nutrigen_contract.py

  # Via pytest with a GenLayer simulator plugin (if installed):
  pytest contracts/tests/ -v

The `contract` fixture is provided by the GenLayer test runner plugin.
If running outside GenLayer, this conftest provides a minimal local
stub so IDE test discovery doesn't error out.
"""

import pytest
import json
import sys
import os

# ── Try to use the real GenLayer test fixture ─────────────────────────────────
# When running via `genlayer test`, the runner injects `contract` automatically.
# The conftest below provides a fallback local stub for environments where
# GenLayer Studio is not running (CI, local unit tests without simulator).

try:
    from genlayer.testing import GenLayerContractFixture  # type: ignore

    @pytest.fixture
    def contract():
        """GenLayer contract fixture — uses the Studio simulator."""
        contract_path = os.path.join(
            os.path.dirname(__file__), "..", "src", "nutrigen_contract.py"
        )
        with GenLayerContractFixture(contract_path) as c:
            yield c

except ImportError:
    # ── Local stub for environments without GenLayer SDK ──────────────────────
    # Allows pytest collection and basic structural tests to run without a
    # running GenLayer Studio instance.

    class _LocalNutrigenStub:
        """Minimal in-process stub that mirrors the contract's state logic."""

        def __init__(self):
            self._requests: dict = {}
            self._results: dict = {}
            self._validator_stats: dict = {}
            self._org_stats: dict = {}
            self._counter: int = 0
            self._owner: str = "0xLocalStubOwner"

        def get_owner(self) -> str:
            return self._owner

        def get_request_count(self) -> int:
            return self._counter

        def get_optimization_request(self, request_id: str) -> str:
            if request_id not in self._requests:
                return json.dumps({"error": "Request not found"})
            return self._requests[request_id]

        def get_consensus_result(self, request_id: str) -> str:
            if request_id not in self._results:
                return json.dumps({"error": "Result not found"})
            return self._results[request_id]

        def get_validator_stats(self, validator_address: str) -> str:
            if validator_address not in self._validator_stats:
                return json.dumps({
                    "validator_address": validator_address,
                    "total_validations": 0,
                    "reputation_score": 50.0,
                })
            return self._validator_stats[validator_address]

        def get_org_stats(self, org_id: str) -> str:
            if org_id not in self._org_stats:
                return json.dumps({
                    "org_id": org_id,
                    "total_requests": 0,
                    "accepted": 0,
                    "rejected": 0,
                    "undetermined": 0,
                    "compliance_rate": 0.0,
                    "avg_risk_score": 0.0,
                })
            return self._org_stats[org_id]

        def submit_optimization_request(self, request_id, org_id, agent_id,
                                         livestock_type, breed, herd_size,
                                         avg_weight_kg, target_weight_kg,
                                         growth_stage, location_country,
                                         location_region, temperature_celsius,
                                         humidity_percent, season,
                                         available_forages, forage_quality_score,
                                         budget_per_head_per_day, currency,
                                         max_feed_cost_per_kg, feed_proposal,
                                         policy_rules, requester_address) -> None:
            request = {
                "request_id": request_id,
                "org_id": org_id,
                "agent_id": agent_id,
                "requester_address": requester_address,
                "livestock_type": livestock_type,
                "breed": breed,
                "herd_size": herd_size,
                "avg_weight_kg": avg_weight_kg,
                "target_weight_kg": target_weight_kg,
                "growth_stage": growth_stage,
                "location_country": location_country,
                "location_region": location_region,
                "temperature_celsius": temperature_celsius,
                "humidity_percent": humidity_percent,
                "season": season,
                "available_forages": available_forages,
                "forage_quality_score": forage_quality_score,
                "budget_per_head_per_day": budget_per_head_per_day,
                "currency": currency,
                "max_feed_cost_per_kg": max_feed_cost_per_kg,
                "feed_proposal": feed_proposal,
                "policy_rules": policy_rules,
                "status": "pending",
            }
            self._requests[request_id] = json.dumps(request)
            self._counter += 1

        def evaluate_feed_proposal(self, request_id: str) -> None:
            if request_id not in self._requests:
                raise AssertionError(f"Request not found: {request_id}")

            request = json.loads(self._requests[request_id])
            # Stub returns a deterministic mock result for local testing
            result = {
                "request_id": request_id,
                "validator_address": "0xLocalValidator",
                "consensus_verdict": "ACCEPTED",
                "compliance_score": 82.0,
                "risk_score": 18.0,
                "risk_level": "low",
                "nutritional_risk": 15.0,
                "cost_risk": 12.0,
                "welfare_risk": 10.0,
                "crude_protein_percent": 20.5,
                "metabolizable_energy_kcal": 3050.0,
                "crude_fiber_percent": 3.8,
                "welfare_score": 7.5,
                "projected_daily_gain_kg": 0.065,
                "projected_fcr": 1.85,
                "projected_days_to_target": 19.0,
                "estimated_cost_per_kg_gain": 1.38,
                "total_daily_cost_per_head": 0.09,
                "rule_violations": [],
                "requires_escalation": False,
                "escalation_reason": "",
                "justification": "The proposed formula meets NRC broiler nutritional requirements.",
                "data_sources": ["NRC standards", "FAO tables"],
                "commodity_prices_fetched": {},
                "nutrition_standards_used": {},
            }
            self._results[request_id] = json.dumps(result)

            request["status"] = "evaluated"
            self._requests[request_id] = json.dumps(request)

            # Update org stats
            org_id = request["org_id"]
            if org_id in self._org_stats:
                stats = json.loads(self._org_stats[org_id])
            else:
                stats = {
                    "org_id": org_id, "total_requests": 0, "accepted": 0,
                    "rejected": 0, "undetermined": 0,
                    "compliance_rate": 0.0, "avg_risk_score": 0.0,
                    "total_compliance_sum": 0.0, "total_risk_sum": 0.0,
                }
            stats["total_requests"] += 1
            stats["accepted"] += 1
            stats["total_compliance_sum"] = stats.get("total_compliance_sum", 0.0) + 82.0
            stats["total_risk_sum"] = stats.get("total_risk_sum", 0.0) + 18.0
            total = stats["total_requests"]
            stats["compliance_rate"] = round(stats["total_compliance_sum"] / total, 2)
            stats["avg_risk_score"] = round(stats["total_risk_sum"] / total, 2)
            self._org_stats[org_id] = json.dumps(stats)

        def record_consensus_outcome(self, request_id, final_verdict,
                                      agreement_percentage, validator_count,
                                      leader_address) -> None:
            if request_id not in self._results:
                raise AssertionError(f"Evaluation not found: {request_id}")
            if final_verdict not in ("ACCEPTED", "REJECTED", "UNDETERMINED"):
                raise AssertionError(f"Invalid verdict: {final_verdict}")

            result = json.loads(self._results[request_id])
            result["final_verdict"] = final_verdict
            result["agreement_percentage"] = agreement_percentage
            result["validator_count"] = validator_count
            result["leader_address"] = leader_address
            self._results[request_id] = json.dumps(result)

            request = json.loads(self._requests[request_id])
            status_map = {"ACCEPTED": "accepted", "REJECTED": "rejected",
                          "UNDETERMINED": "undetermined"}
            request["status"] = status_map[final_verdict]
            self._requests[request_id] = json.dumps(request)

    @pytest.fixture
    def contract():
        """Local stub fixture — used when GenLayer Studio is not available."""
        return _LocalNutrigenStub()
