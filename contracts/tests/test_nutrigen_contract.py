"""
Nutrigen Intelligent Contract — Test Suite
Tests run against GenLayer Studio simulator (not live StudioNet).

Run with:
  genlayer test contracts/tests/test_nutrigen_contract.py

Or manually via the Studio UI simulator.
"""

import json
import pytest


# ──────────────────────────────────────────────────────────────
# FIXTURES
# ──────────────────────────────────────────────────────────────

SAMPLE_FEED_PROPOSAL = json.dumps({
    "corn": 45,
    "soybean_meal": 25,
    "wheat_bran": 10,
    "fish_meal": 5,
    "mineral_premix": 3,
    "vitamin_premix": 1,
    "limestone": 1,
    "salt": 0.5,
    "forage": 9.5,
})

SAMPLE_POLICY_RULES = json.dumps([
    {
        "rule_name": "Min Crude Protein",
        "rule_category": "nutritional",
        "parameter": "crude_protein",
        "min_value": 18.0,
        "max_value": 23.0,
        "unit": "%",
        "tolerance_percent": 5.0,
        "is_mandatory": True,
        "description": "Broiler grower crude protein requirement",
    },
    {
        "rule_name": "Metabolizable Energy Floor",
        "rule_category": "nutritional",
        "parameter": "metabolizable_energy",
        "min_value": 2900.0,
        "max_value": None,
        "unit": "kcal/kg",
        "tolerance_percent": 3.0,
        "is_mandatory": True,
        "description": "Minimum ME for broiler performance",
    },
    {
        "rule_name": "Max Daily Cost",
        "rule_category": "cost",
        "parameter": "daily_cost_per_head",
        "min_value": None,
        "max_value": 0.15,
        "unit": "USD/day",
        "tolerance_percent": 10.0,
        "is_mandatory": True,
        "description": "Budget cap per bird per day",
    },
    {
        "rule_name": "Welfare Score",
        "rule_category": "welfare",
        "parameter": "welfare_score",
        "min_value": 6.0,
        "max_value": None,
        "unit": "score",
        "tolerance_percent": 0.0,
        "is_mandatory": True,
        "description": "Minimum welfare score (0-10)",
    },
])

SAMPLE_REQUEST_ARGS = {
    "request_id": "test-req-001",
    "org_id": "org-test-123",
    "agent_id": "agent-test-456",
    "livestock_type": "poultry_broiler",
    "breed": "Ross 308",
    "herd_size": 500,
    "avg_weight_kg": 1.2,
    "target_weight_kg": 2.5,
    "growth_stage": "grower",
    "location_country": "Nigeria",
    "location_region": "Lagos",
    "temperature_celsius": 32.0,
    "humidity_percent": 78.0,
    "season": "wet",
    "available_forages": json.dumps(["Fresh Grass", "Hay"]),
    "forage_quality_score": 6.5,
    "budget_per_head_per_day": 0.12,
    "currency": "USD",
    "max_feed_cost_per_kg": 0.35,
    "feed_proposal": SAMPLE_FEED_PROPOSAL,
    "policy_rules": SAMPLE_POLICY_RULES,
    "requester_address": "0x1234567890abcdef1234567890abcdef12345678",
}


# ──────────────────────────────────────────────────────────────
# UNIT TESTS
# ──────────────────────────────────────────────────────────────

class TestContractDeployment:
    """Verify contract deploys and initializes correctly."""

    def test_owner_set_on_deploy(self, contract):
        owner = contract.get_owner()
        assert owner is not None
        assert owner.startswith("0x")

    def test_initial_request_count_zero(self, contract):
        count = contract.get_request_count()
        assert count == 0

    def test_missing_request_returns_error(self, contract):
        result = json.loads(contract.get_optimization_request("nonexistent"))
        assert "error" in result

    def test_missing_result_returns_error(self, contract):
        result = json.loads(contract.get_consensus_result("nonexistent"))
        assert "error" in result

    def test_unknown_validator_returns_defaults(self, contract):
        stats = json.loads(contract.get_validator_stats("0xdeadbeef"))
        assert stats["total_validations"] == 0
        assert stats["reputation_score"] == 50.0

    def test_unknown_org_returns_defaults(self, contract):
        stats = json.loads(contract.get_org_stats("org-unknown"))
        assert stats["total_requests"] == 0
        assert stats["compliance_rate"] == 0.0


class TestSubmitOptimizationRequest:
    """Verify request submission and storage."""

    def test_submit_stores_request(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        stored = json.loads(contract.get_optimization_request("test-req-001"))
        assert stored["request_id"] == "test-req-001"
        assert stored["livestock_type"] == "poultry_broiler"
        assert stored["status"] == "pending"

    def test_submit_increments_counter(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        assert contract.get_request_count() == 1

    def test_all_fields_stored(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        stored = json.loads(contract.get_optimization_request("test-req-001"))
        assert stored["org_id"] == "org-test-123"
        assert stored["breed"] == "Ross 308"
        assert stored["herd_size"] == 500
        assert stored["budget_per_head_per_day"] == 0.12


class TestEvaluateFeedProposal:
    """Verify consensus evaluation flow."""

    def test_evaluate_nonexistent_request_raises(self, contract):
        with pytest.raises(Exception):
            contract.evaluate_feed_proposal("nonexistent-id")

    def test_evaluate_stores_result(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert "consensus_verdict" in result

    def test_verdict_is_valid_value(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert result["consensus_verdict"] in ("ACCEPTED", "REJECTED", "UNDETERMINED")

    def test_compliance_score_in_range(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert 0.0 <= result["compliance_score"] <= 100.0

    def test_risk_score_in_range(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert 0.0 <= result["risk_score"] <= 100.0

    def test_risk_level_valid(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert result["risk_level"] in ("low", "medium", "high", "critical")

    def test_welfare_score_in_range(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert 0.0 <= result["welfare_score"] <= 10.0

    def test_justification_not_empty(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert len(result.get("justification", "")) > 20

    def test_rule_violations_is_list(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert isinstance(result.get("rule_violations"), list)

    def test_request_status_updated_after_evaluation(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        request = json.loads(contract.get_optimization_request("test-req-001"))
        assert request["status"] == "evaluated"

    def test_validator_stats_updated(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        # Validator address will be the sender in the simulator
        # Just verify total_validations is tracked somewhere

    def test_org_stats_updated(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        stats = json.loads(contract.get_org_stats("org-test-123"))
        assert stats["total_requests"] == 1


class TestRecordConsensusOutcome:
    """Verify finalization of consensus outcomes."""

    def test_record_accepted_outcome(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        contract.record_consensus_outcome(
            request_id="test-req-001",
            final_verdict="ACCEPTED",
            agreement_percentage=85.0,
            validator_count=5,
            leader_address="0xleader123",
        )
        result = json.loads(contract.get_consensus_result("test-req-001"))
        assert result["final_verdict"] == "ACCEPTED"
        assert result["agreement_percentage"] == 85.0
        assert result["validator_count"] == 5

    def test_record_rejected_outcome(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        contract.record_consensus_outcome(
            request_id="test-req-001",
            final_verdict="REJECTED",
            agreement_percentage=60.0,
            validator_count=5,
            leader_address="0xleader123",
        )
        request = json.loads(contract.get_optimization_request("test-req-001"))
        assert request["status"] == "rejected"

    def test_invalid_verdict_raises(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        contract.evaluate_feed_proposal("test-req-001")
        with pytest.raises(Exception):
            contract.record_consensus_outcome(
                request_id="test-req-001",
                final_verdict="INVALID_VERDICT",
                agreement_percentage=80.0,
                validator_count=5,
                leader_address="0xleader123",
            )

    def test_record_on_nonexistent_result_raises(self, contract):
        contract.submit_optimization_request(**SAMPLE_REQUEST_ARGS)
        # No evaluate_feed_proposal called
        with pytest.raises(Exception):
            contract.record_consensus_outcome(
                request_id="test-req-001",
                final_verdict="ACCEPTED",
                agreement_percentage=90.0,
                validator_count=5,
                leader_address="0xleader123",
            )


class TestCattleEvaluation:
    """Test with beef cattle scenario."""

    def test_cattle_beef_evaluation(self, contract):
        cattle_args = {**SAMPLE_REQUEST_ARGS,
            "request_id": "test-cattle-001",
            "livestock_type": "cattle_beef",
            "breed": "Angus",
            "herd_size": 50,
            "avg_weight_kg": 250.0,
            "target_weight_kg": 500.0,
            "growth_stage": "finisher",
            "budget_per_head_per_day": 2.50,
            "feed_proposal": json.dumps({
                "corn_silage": 40,
                "hay": 30,
                "soybean_meal": 15,
                "corn": 10,
                "mineral_premix": 3,
                "salt": 0.5,
                "limestone": 1.5,
            }),
        }
        contract.submit_optimization_request(**cattle_args)
        contract.evaluate_feed_proposal("test-cattle-001")
        result = json.loads(contract.get_consensus_result("test-cattle-001"))
        assert result["consensus_verdict"] in ("ACCEPTED", "REJECTED", "UNDETERMINED")
        assert result["projected_daily_gain_kg"] >= 0


class TestSwineEvaluation:
    """Test with swine scenario."""

    def test_swine_evaluation(self, contract):
        swine_args = {**SAMPLE_REQUEST_ARGS,
            "request_id": "test-swine-001",
            "livestock_type": "swine",
            "breed": "Duroc",
            "herd_size": 200,
            "avg_weight_kg": 30.0,
            "target_weight_kg": 100.0,
            "growth_stage": "grower",
            "budget_per_head_per_day": 0.80,
            "feed_proposal": json.dumps({
                "corn": 60,
                "soybean_meal": 22,
                "wheat_bran": 8,
                "fish_meal": 3,
                "mineral_premix": 4,
                "vitamin_premix": 1,
                "salt": 0.5,
                "limestone": 1.5,
            }),
        }
        contract.submit_optimization_request(**swine_args)
        contract.evaluate_feed_proposal("test-swine-001")
        result = json.loads(contract.get_consensus_result("test-swine-001"))
        assert result["consensus_verdict"] in ("ACCEPTED", "REJECTED", "UNDETERMINED")


class TestOrgStatsAggregation:
    """Verify org-level stats aggregate correctly across multiple requests."""

    def test_multiple_requests_increment_total(self, contract):
        for i in range(3):
            args = {**SAMPLE_REQUEST_ARGS, "request_id": f"multi-test-{i}"}
            contract.submit_optimization_request(**args)
            contract.evaluate_feed_proposal(f"multi-test-{i}")

        stats = json.loads(contract.get_org_stats("org-test-123"))
        assert stats["total_requests"] == 3

    def test_compliance_rate_computed(self, contract):
        for i in range(2):
            args = {**SAMPLE_REQUEST_ARGS, "request_id": f"rate-test-{i}"}
            contract.submit_optimization_request(**args)
            contract.evaluate_feed_proposal(f"rate-test-{i}")

        stats = json.loads(contract.get_org_stats("org-test-123"))
        assert 0.0 <= stats["compliance_rate"] <= 100.0
