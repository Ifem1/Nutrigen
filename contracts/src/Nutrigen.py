# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import typing


class NutrigenContract(gl.Contract):
    """
    NutrigenContract

    A GenLayer-native livestock feed optimization and feed-plan accountability
    contract.

    Product purpose:
    Nutrigen helps farmers decide how to feed livestock optimally using AI and
    GenLayer consensus. A farm submits livestock context, available feed
    ingredients, costs, nutrient summaries, constraints, and a candidate or
    requested ration. GenLayer validators review whether the proposed feed plan
    is safe, nutritionally adequate, cost-aware, practical, and aligned with the
    production goal.

    The contract returns an authoritative on-chain verdict and a structured feed
    optimization report.

    What belongs on-chain:
    - farm and role registry
    - livestock batch registry
    - feed ingredient registry and hashes
    - versioned livestock feed standards
    - optimization requests
    - GenLayer consensus feed verdicts
    - recommended ration summaries
    - cost and risk findings
    - human/veterinary review outcomes
    - immutable audit trail

    What should stay off-chain:
    - full files, lab reports, private farm documents, long feed tables,
      images, PDFs, detailed local inventory records, and frontend analytics.
      Store those in Supabase/Postgres/storage and put hashes or summaries here.
    """

    owner: str
    paused: bool

    farm_counter: u256
    advisor_counter: u256
    batch_counter: u256
    ingredient_counter: u256
    standard_counter: u256
    request_counter: u256
    decision_counter: u256
    audit_counter: u256
    escalation_counter: u256
    human_review_counter: u256
    activation_counter: u256

    farms: TreeMap[str, str]
    farm_roles: TreeMap[str, str]
    farm_index: TreeMap[str, str]

    advisors: TreeMap[str, str]
    farm_advisor_index: TreeMap[str, str]

    livestock_batches: TreeMap[str, str]
    farm_batch_index: TreeMap[str, str]

    feed_ingredients: TreeMap[str, str]
    farm_ingredient_index: TreeMap[str, str]

    feed_standards: TreeMap[str, str]
    current_standard_versions: TreeMap[str, str]
    farm_standard_index: TreeMap[str, str]
    standard_version_index: TreeMap[str, str]

    optimization_requests: TreeMap[str, str]
    request_decisions: TreeMap[str, str]
    farm_request_index: TreeMap[str, str]
    batch_request_index: TreeMap[str, str]
    advisor_request_index: TreeMap[str, str]

    decisions: TreeMap[str, str]
    escalations: TreeMap[str, str]
    human_reviews: TreeMap[str, str]
    activated_feed_plans: TreeMap[str, str]

    audit_logs: TreeMap[str, str]
    request_audit_index: TreeMap[str, str]

    reviewer_reputation: TreeMap[str, str]
    reviewer_decision_index: TreeMap[str, str]

    approved_ration_hashes: TreeMap[str, str]
    blocked_ration_hashes: TreeMap[str, str]

    def __init__(self) -> None:
        self.owner = gl.message.sender_address.as_hex
        self.paused = False

        self.farm_counter = u256(0)
        self.advisor_counter = u256(0)
        self.batch_counter = u256(0)
        self.ingredient_counter = u256(0)
        self.standard_counter = u256(0)
        self.request_counter = u256(0)
        self.decision_counter = u256(0)
        self.audit_counter = u256(0)
        self.escalation_counter = u256(0)
        self.human_review_counter = u256(0)
        self.activation_counter = u256(0)

        self.farms = TreeMap()
        self.farm_roles = TreeMap()
        self.farm_index = TreeMap()

        self.advisors = TreeMap()
        self.farm_advisor_index = TreeMap()

        self.livestock_batches = TreeMap()
        self.farm_batch_index = TreeMap()

        self.feed_ingredients = TreeMap()
        self.farm_ingredient_index = TreeMap()

        self.feed_standards = TreeMap()
        self.current_standard_versions = TreeMap()
        self.farm_standard_index = TreeMap()
        self.standard_version_index = TreeMap()

        self.optimization_requests = TreeMap()
        self.request_decisions = TreeMap()
        self.farm_request_index = TreeMap()
        self.batch_request_index = TreeMap()
        self.advisor_request_index = TreeMap()

        self.decisions = TreeMap()
        self.escalations = TreeMap()
        self.human_reviews = TreeMap()
        self.activated_feed_plans = TreeMap()

        self.audit_logs = TreeMap()
        self.request_audit_index = TreeMap()

        self.reviewer_reputation = TreeMap()
        self.reviewer_decision_index = TreeMap()

        self.approved_ration_hashes = TreeMap()
        self.blocked_ration_hashes = TreeMap()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _sender(self) -> str:
        return gl.message.sender_address.as_hex.lower()

    def _json(self, value: typing.Any) -> str:
        return json.dumps(value, sort_keys=True)

    def _load(self, raw: str) -> typing.Any:
        if raw is None or raw == "":
            return {}
        return json.loads(raw)

    def _require_owner(self) -> None:
        if self._sender() != self.owner.lower():
            raise gl.vm.UserError("Only contract owner")

    def _require_not_paused(self) -> None:
        if self.paused:
            raise gl.vm.UserError("Contract is paused")

    def _require_non_empty(self, value: str, field_name: str) -> None:
        if value is None or len(value.strip()) == 0:
            raise gl.vm.UserError(field_name + " is required")

    def _key2(self, a: str, b: str) -> str:
        return a + "::" + b

    def _key3(self, a: str, b: str, c: str) -> str:
        return a + "::" + b + "::" + c

    def _append(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        return existing + "|" + item

    def _append_unique(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        parts = existing.split("|")
        for part in parts:
            if part == item:
                return existing
        return existing + "|" + item

    def _limit(self, value: typing.Any, max_len: int) -> str:
        text = str(value)
        if len(text) > max_len:
            return text[:max_len]
        return text

    def _to_int(self, value: typing.Any, fallback: int) -> int:
        try:
            return int(value)
        except Exception:
            return fallback

    def _bounded_score(self, value: typing.Any, fallback: int) -> int:
        score = self._to_int(value, fallback)
        if score < 0:
            return 0
        if score > 100:
            return 100
        return score

    def _list_of_strings(self, value: typing.Any, max_items: int, max_len: int) -> typing.List[str]:
        result: typing.List[str] = []
        if isinstance(value, list):
            for item in value:
                if len(result) >= max_items:
                    break
                result.append(self._limit(item, max_len))
            return result
        if value is None:
            return result
        text = str(value)
        if len(text.strip()) == 0:
            return result
        result.append(self._limit(text, max_len))
        return result

    def _next_id(self, prefix: str, counter_name: str) -> str:
        if counter_name == "farm":
            self.farm_counter = self.farm_counter + u256(1)
            return prefix + "-" + str(self.farm_counter)
        if counter_name == "advisor":
            self.advisor_counter = self.advisor_counter + u256(1)
            return prefix + "-" + str(self.advisor_counter)
        if counter_name == "batch":
            self.batch_counter = self.batch_counter + u256(1)
            return prefix + "-" + str(self.batch_counter)
        if counter_name == "ingredient":
            self.ingredient_counter = self.ingredient_counter + u256(1)
            return prefix + "-" + str(self.ingredient_counter)
        if counter_name == "standard":
            self.standard_counter = self.standard_counter + u256(1)
            return prefix + "-" + str(self.standard_counter)
        if counter_name == "request":
            self.request_counter = self.request_counter + u256(1)
            return prefix + "-" + str(self.request_counter)
        if counter_name == "decision":
            self.decision_counter = self.decision_counter + u256(1)
            return prefix + "-" + str(self.decision_counter)
        if counter_name == "audit":
            self.audit_counter = self.audit_counter + u256(1)
            return prefix + "-" + str(self.audit_counter)
        if counter_name == "escalation":
            self.escalation_counter = self.escalation_counter + u256(1)
            return prefix + "-" + str(self.escalation_counter)
        if counter_name == "human_review":
            self.human_review_counter = self.human_review_counter + u256(1)
            return prefix + "-" + str(self.human_review_counter)
        if counter_name == "activation":
            self.activation_counter = self.activation_counter + u256(1)
            return prefix + "-" + str(self.activation_counter)
        raise gl.vm.UserError("Unknown counter")

    def _normalise_status(self, value: str, allowed: str, field_name: str) -> str:
        status = value.strip().upper()
        allowed_values = allowed.split("|")
        for item in allowed_values:
            if status == item:
                return status
        raise gl.vm.UserError("Invalid " + field_name)

    def _normalise_verdict(self, value: typing.Any) -> str:
        verdict = str(value).strip().upper()
        if verdict in ["APPROVE", "APPROVED", "PASS", "OPTIMAL", "ACCEPTABLE", "SAFE"]:
            return "APPROVED"
        if verdict in ["REJECT", "REJECTED", "FAIL", "UNSAFE", "BLOCK"]:
            return "REJECTED"
        if verdict in ["NEEDS_REVIEW", "REVIEW", "VET_REVIEW", "NUTRITIONIST_REVIEW", "ESCALATE"]:
            return "NEEDS_REVIEW"
        if verdict in ["NEEDS_REVISION", "REVISION", "REVISE", "REBALANCE", "REFORMULATE", "REGENERATE"]:
            return "NEEDS_REVISION"
        return "NEEDS_REVIEW"

    def _normalise_risk_band(self, value: typing.Any) -> str:
        band = str(value).strip().upper()
        if band in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            return band
        return "HIGH"

    def _require_farm_exists(self, farm_id: str) -> typing.Any:
        raw = self.farms.get(farm_id, "")
        if raw == "":
            raise gl.vm.UserError("Farm not found")
        return self._load(raw)

    def _require_advisor_exists(self, advisor_id: str) -> typing.Any:
        raw = self.advisors.get(advisor_id, "")
        if raw == "":
            raise gl.vm.UserError("Feed advisor not found")
        return self._load(raw)

    def _require_batch_exists(self, batch_id: str) -> typing.Any:
        raw = self.livestock_batches.get(batch_id, "")
        if raw == "":
            raise gl.vm.UserError("Livestock batch not found")
        return self._load(raw)

    def _require_ingredient_exists(self, ingredient_id: str) -> typing.Any:
        raw = self.feed_ingredients.get(ingredient_id, "")
        if raw == "":
            raise gl.vm.UserError("Feed ingredient not found")
        return self._load(raw)

    def _require_standard_version_exists(self, farm_id: str, standard_id: str, version: str) -> typing.Any:
        key = self._key3(farm_id, standard_id, version)
        raw = self.feed_standards.get(key, "")
        if raw == "":
            raise gl.vm.UserError("Feed standard version not found")
        return self._load(raw)

    def _is_farm_owner_or_admin(self, farm_id: str, wallet: str) -> bool:
        role = self.farm_roles.get(self._key2(farm_id, wallet.lower()), "")
        return role == "OWNER" or role == "ADMIN"

    def _is_farm_reviewer_or_admin(self, farm_id: str, wallet: str) -> bool:
        role = self.farm_roles.get(self._key2(farm_id, wallet.lower()), "")
        return role == "OWNER" or role == "ADMIN" or role == "NUTRITIONIST" or role == "VET" or role == "REVIEWER"

    def _require_farm_owner_or_admin(self, farm_id: str) -> None:
        if not self._is_farm_owner_or_admin(farm_id, self._sender()):
            raise gl.vm.UserError("Only farm owner/admin")

    def _require_farm_reviewer_or_admin(self, farm_id: str) -> None:
        if not self._is_farm_reviewer_or_admin(farm_id, self._sender()):
            raise gl.vm.UserError("Only farm nutritionist/vet/reviewer/admin")

    def _assert_no_predecided_verdict(self, text: str) -> None:
        lower = text.lower()
        forbidden = [
            '"verdict"',
            "'verdict'",
            "verdict:",
            '"approved"',
            "'approved'",
            "approved:",
            '"rejected"',
            "'rejected'",
            "rejected:",
            '"optimal"',
            "'optimal'",
            "optimal:",
            '"unsafe"',
            "'unsafe'",
            "unsafe:",
            '"safety_score"',
            "'safety_score'",
            "safety_score:",
            '"cost_score"',
            "'cost_score'",
            "cost_score:",
            '"nutrition_score"',
            "'nutrition_score'",
            "nutrition_score:",
            '"final_decision"',
            "'final_decision'",
            "final_decision:",
        ]
        for item in forbidden:
            if item in lower:
                raise gl.vm.UserError("Caller input contains pre-decided feed review language: " + item)

    def _record_audit(
        self,
        farm_id: str,
        request_id: str,
        event_type: str,
        actor: str,
        summary: str,
        data_hash: str,
        created_at: str,
    ) -> str:
        audit_id = self._next_id("AUDIT", "audit")
        entry = {
            "audit_id": audit_id,
            "farm_id": farm_id,
            "request_id": request_id,
            "event_type": event_type,
            "actor": actor.lower(),
            "summary": self._limit(summary, 800),
            "data_hash": data_hash,
            "created_at": created_at,
        }
        self.audit_logs[audit_id] = self._json(entry)
        if request_id != "":
            self.request_audit_index[request_id] = self._append(
                self.request_audit_index.get(request_id, ""),
                audit_id,
            )
        return audit_id

    def _collect_standard_packet(self, farm_id: str, standard_ids_csv: str) -> str:
        standard_ids = standard_ids_csv.split(",")
        collected: typing.List[typing.Any] = []

        for raw_standard_id in standard_ids:
            standard_id = raw_standard_id.strip()
            if standard_id == "":
                continue

            current_version = self.current_standard_versions.get(self._key2(farm_id, standard_id), "")
            if current_version == "":
                raise gl.vm.UserError("No current version for feed standard " + standard_id)

            standard = self._require_standard_version_exists(farm_id, standard_id, current_version)
            if standard.get("status", "") != "ACTIVE":
                raise gl.vm.UserError("Feed standard is not active: " + standard_id)

            collected.append(
                {
                    "standard_id": standard_id,
                    "version": current_version,
                    "title": standard.get("title", ""),
                    "species_scope": standard.get("species_scope", ""),
                    "production_stage_scope": standard.get("production_stage_scope", ""),
                    "severity": standard.get("severity", ""),
                    "standard_hash": standard.get("standard_hash", ""),
                    "nutrient_target_rules": standard.get("nutrient_target_rules", ""),
                    "ingredient_limit_rules": standard.get("ingredient_limit_rules", ""),
                    "toxin_and_anti_nutrient_rules": standard.get("toxin_and_anti_nutrient_rules", ""),
                    "health_escalation_rules": standard.get("health_escalation_rules", ""),
                    "cost_and_availability_rules": standard.get("cost_and_availability_rules", ""),
                }
            )

        if len(collected) == 0:
            raise gl.vm.UserError("At least one active feed standard is required")

        return self._json(collected)

    def _collect_ingredient_packet(self, farm_id: str, ingredient_ids_csv: str) -> str:
        ingredient_ids = ingredient_ids_csv.split(",")
        collected: typing.List[typing.Any] = []

        for raw_ingredient_id in ingredient_ids:
            ingredient_id = raw_ingredient_id.strip()
            if ingredient_id == "":
                continue

            ingredient = self._require_ingredient_exists(ingredient_id)
            if ingredient.get("farm_id", "") != farm_id:
                raise gl.vm.UserError("Ingredient does not belong to farm")
            if ingredient.get("status", "") != "ACTIVE":
                raise gl.vm.UserError("Ingredient is not active: " + ingredient_id)

            collected.append(
                {
                    "ingredient_id": ingredient_id,
                    "name": ingredient.get("name", ""),
                    "category": ingredient.get("category", ""),
                    "nutrient_profile_summary": ingredient.get("nutrient_profile_summary", ""),
                    "safety_summary": ingredient.get("safety_summary", ""),
                    "availability_summary": ingredient.get("availability_summary", ""),
                    "cost_summary": ingredient.get("cost_summary", ""),
                    "metadata_hash": ingredient.get("metadata_hash", ""),
                }
            )

        if len(collected) == 0:
            raise gl.vm.UserError("At least one active feed ingredient is required")

        return self._json(collected)

    def _normalise_ai_review(self, raw: typing.Any) -> typing.Any:
        if isinstance(raw, str):
            parsed = json.loads(raw)
        else:
            parsed = raw

        verdict = self._normalise_verdict(parsed.get("verdict", "NEEDS_REVIEW"))
        risk_band = self._normalise_risk_band(parsed.get("risk_band", "HIGH"))

        nutrient_gaps = self._list_of_strings(parsed.get("nutrient_gaps", []), 12, 320)
        excess_risks = self._list_of_strings(parsed.get("excess_risks", []), 12, 320)
        ingredient_risks = self._list_of_strings(parsed.get("ingredient_risks", []), 12, 320)
        health_warnings = self._list_of_strings(parsed.get("health_warnings", []), 12, 320)
        cost_findings = self._list_of_strings(parsed.get("cost_findings", []), 10, 320)
        availability_findings = self._list_of_strings(parsed.get("availability_findings", []), 10, 320)
        required_changes = self._list_of_strings(parsed.get("required_changes", []), 14, 360)
        strengths = self._list_of_strings(parsed.get("strengths", []), 10, 280)
        feeding_instructions = self._list_of_strings(parsed.get("feeding_instructions", []), 12, 360)
        monitoring_notes = self._list_of_strings(parsed.get("monitoring_notes", []), 12, 360)

        reviewer_required = bool(parsed.get("reviewer_required", False))
        revision_required = bool(parsed.get("revision_required", False))

        if verdict == "REJECTED":
            reviewer_required = False
            revision_required = False
        if verdict == "NEEDS_REVIEW":
            reviewer_required = True
        if verdict == "NEEDS_REVISION":
            revision_required = True

        return {
            "verdict": verdict,
            "nutrient_adequacy_score": self._bounded_score(parsed.get("nutrient_adequacy_score", 0), 0),
            "livestock_suitability_score": self._bounded_score(parsed.get("livestock_suitability_score", 0), 0),
            "safety_score": self._bounded_score(parsed.get("safety_score", 0), 0),
            "cost_efficiency_score": self._bounded_score(parsed.get("cost_efficiency_score", 0), 0),
            "availability_score": self._bounded_score(parsed.get("availability_score", 0), 0),
            "production_goal_alignment_score": self._bounded_score(parsed.get("production_goal_alignment_score", 0), 0),
            "explainability_score": self._bounded_score(parsed.get("explainability_score", 0), 0),
            "practicality_score": self._bounded_score(parsed.get("practicality_score", 0), 0),
            "risk_score": self._bounded_score(parsed.get("risk_score", 100), 100),
            "risk_band": risk_band,
            "reviewer_required": reviewer_required,
            "revision_required": revision_required,
            "recommended_ration_summary": self._limit(parsed.get("recommended_ration_summary", ""), 1600),
            "ingredient_mix_summary": self._limit(parsed.get("ingredient_mix_summary", ""), 1600),
            "daily_feeding_summary": self._limit(parsed.get("daily_feeding_summary", ""), 1200),
            "transition_plan_summary": self._limit(parsed.get("transition_plan_summary", ""), 1000),
            "nutrient_gaps": nutrient_gaps,
            "excess_risks": excess_risks,
            "ingredient_risks": ingredient_risks,
            "health_warnings": health_warnings,
            "cost_findings": cost_findings,
            "availability_findings": availability_findings,
            "required_changes": required_changes,
            "strengths": strengths,
            "feeding_instructions": feeding_instructions,
            "monitoring_notes": monitoring_notes,
            "rationale": self._limit(parsed.get("rationale", ""), 1600),
            "audit_summary": self._limit(parsed.get("audit_summary", ""), 1000),
            "confidence": self._bounded_score(parsed.get("confidence", 50), 50),
        }

    def _apply_feed_thresholds(self, review: typing.Any, farm: typing.Any) -> typing.Any:
        config = farm.get("optimization_config", {})

        min_approve_nutrient_adequacy = self._bounded_score(config.get("min_approve_nutrient_adequacy", 78), 78)
        min_approve_suitability = self._bounded_score(config.get("min_approve_suitability", 78), 78)
        min_approve_safety = self._bounded_score(config.get("min_approve_safety", 84), 84)
        min_approve_availability = self._bounded_score(config.get("min_approve_availability", 65), 65)
        min_approve_practicality = self._bounded_score(config.get("min_approve_practicality", 65), 65)
        max_approve_risk = self._bounded_score(config.get("max_approve_risk", 35), 35)
        auto_review_risk = self._bounded_score(config.get("auto_review_risk", 60), 60)
        auto_reject_risk = self._bounded_score(config.get("auto_reject_risk", 88), 88)

        verdict = review["verdict"]

        if len(review["health_warnings"]) > 0 and verdict == "APPROVED":
            verdict = "NEEDS_REVIEW"

        if len(review["ingredient_risks"]) > 0 and verdict == "APPROVED":
            verdict = "NEEDS_REVIEW"

        if review["risk_score"] >= auto_reject_risk:
            verdict = "REJECTED"

        if verdict == "APPROVED" and review["risk_score"] >= auto_review_risk:
            verdict = "NEEDS_REVIEW"

        if (
            verdict == "APPROVED"
            and (
                review["nutrient_adequacy_score"] < min_approve_nutrient_adequacy
                or review["livestock_suitability_score"] < min_approve_suitability
                or review["safety_score"] < min_approve_safety
                or review["availability_score"] < min_approve_availability
                or review["practicality_score"] < min_approve_practicality
                or review["risk_score"] > max_approve_risk
            )
        ):
            verdict = "NEEDS_REVIEW"

        review["verdict"] = verdict
        review["reviewer_required"] = verdict == "NEEDS_REVIEW"
        review["revision_required"] = verdict == "NEEDS_REVISION"

        if verdict == "REJECTED":
            review["reviewer_required"] = False
            review["revision_required"] = False

        return review

    def _create_optimization_request(
        self,
        request_id: str,
        farm_id: str,
        batch_id: str,
        advisor_id: str,
        standard_ids_csv: str,
        ingredient_ids_csv: str,
        objective_summary: str,
        current_feeding_summary: str,
        available_feed_summary: str,
        candidate_ration_summary: str,
        nutrient_analysis_summary: str,
        cost_constraint_summary: str,
        supply_constraint_summary: str,
        health_context_summary: str,
        environment_context_summary: str,
        evidence_manifest_hash: str,
        ration_hash: str,
        submitted_at: str,
        expires_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(farm_id, "farm_id")
        self._require_non_empty(batch_id, "batch_id")
        self._require_non_empty(advisor_id, "advisor_id")
        self._require_non_empty(standard_ids_csv, "standard_ids_csv")
        self._require_non_empty(ingredient_ids_csv, "ingredient_ids_csv")
        self._require_non_empty(objective_summary, "objective_summary")
        self._require_non_empty(available_feed_summary, "available_feed_summary")
        self._require_non_empty(evidence_manifest_hash, "evidence_manifest_hash")
        self._require_non_empty(ration_hash, "ration_hash")

        self._assert_no_predecided_verdict(
            objective_summary
            + " "
            + current_feeding_summary
            + " "
            + available_feed_summary
            + " "
            + candidate_ration_summary
            + " "
            + nutrient_analysis_summary
            + " "
            + cost_constraint_summary
            + " "
            + supply_constraint_summary
            + " "
            + health_context_summary
        )

        farm = self._require_farm_exists(farm_id)
        if farm.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Farm is not active")

        batch = self._require_batch_exists(batch_id)
        if batch.get("farm_id", "") != farm_id:
            raise gl.vm.UserError("Livestock batch does not belong to farm")
        if batch.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Livestock batch is not active")

        advisor = self._require_advisor_exists(advisor_id)
        if advisor.get("farm_id", "") != farm_id:
            raise gl.vm.UserError("Advisor does not belong to farm")
        if advisor.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Advisor is not active")

        if self.blocked_ration_hashes.get(ration_hash, "") != "":
            raise gl.vm.UserError("Ration hash was previously blocked")
        if self.approved_ration_hashes.get(ration_hash, "") != "":
            raise gl.vm.UserError("Ration hash was already approved")

        final_request_id = request_id
        if final_request_id.strip() == "":
            final_request_id = self._next_id("REQ", "request")
        if self.optimization_requests.get(final_request_id, "") != "":
            raise gl.vm.UserError("Feed optimization request already exists")

        record = {
            "request_id": final_request_id,
            "farm_id": farm_id,
            "batch_id": batch_id,
            "advisor_id": advisor_id,
            "standard_ids_csv": standard_ids_csv,
            "ingredient_ids_csv": ingredient_ids_csv,
            "objective_summary": self._limit(objective_summary, 1400),
            "current_feeding_summary": self._limit(current_feeding_summary, 1600),
            "available_feed_summary": self._limit(available_feed_summary, 1800),
            "candidate_ration_summary": self._limit(candidate_ration_summary, 2200),
            "nutrient_analysis_summary": self._limit(nutrient_analysis_summary, 1600),
            "cost_constraint_summary": self._limit(cost_constraint_summary, 1200),
            "supply_constraint_summary": self._limit(supply_constraint_summary, 1200),
            "health_context_summary": self._limit(health_context_summary, 1400),
            "environment_context_summary": self._limit(environment_context_summary, 1000),
            "evidence_manifest_hash": evidence_manifest_hash,
            "ration_hash": ration_hash,
            "submitted_by": self._sender(),
            "submitted_at": submitted_at,
            "expires_at": expires_at,
            "status": "PENDING",
        }

        self.optimization_requests[final_request_id] = self._json(record)

        self.farm_request_index[farm_id] = self._append(
            self.farm_request_index.get(farm_id, ""),
            final_request_id,
        )
        self.batch_request_index[batch_id] = self._append(
            self.batch_request_index.get(batch_id, ""),
            final_request_id,
        )
        self.advisor_request_index[advisor_id] = self._append(
            self.advisor_request_index.get(advisor_id, ""),
            final_request_id,
        )

        self._record_audit(
            farm_id,
            final_request_id,
            "FEED_OPTIMIZATION_REQUEST_CREATED",
            self._sender(),
            "Livestock feed optimization request submitted",
            evidence_manifest_hash,
            submitted_at,
        )

        return final_request_id

    def _run_consensus_feed_review(
        self,
        request_record: typing.Any,
        farm: typing.Any,
        batch: typing.Any,
        advisor: typing.Any,
        standard_packet: str,
        ingredient_packet: str,
    ) -> typing.Any:
        request_json = self._json(request_record)
        farm_json = self._json(
            {
                "farm_id": farm.get("farm_id", ""),
                "name": farm.get("name", ""),
                "farm_type": farm.get("farm_type", ""),
                "location_context": farm.get("location_context", ""),
                "optimization_config": farm.get("optimization_config", {}),
            }
        )
        batch_json = self._json(
            {
                "batch_id": batch.get("batch_id", ""),
                "species": batch.get("species", ""),
                "breed_summary": batch.get("breed_summary", ""),
                "production_stage": batch.get("production_stage", ""),
                "production_goal": batch.get("production_goal", ""),
                "head_count": batch.get("head_count", ""),
                "weight_summary": batch.get("weight_summary", ""),
                "health_status_summary": batch.get("health_status_summary", ""),
                "feeding_constraints": batch.get("feeding_constraints", ""),
            }
        )
        advisor_json = self._json(
            {
                "advisor_id": advisor.get("advisor_id", ""),
                "name": advisor.get("name", ""),
                "credential_summary": advisor.get("credential_summary", ""),
                "scope_summary": advisor.get("scope_summary", ""),
            }
        )

        def evaluate_once() -> str:
            prompt = f"""
You are a decentralized livestock feed optimization reviewer for Nutrigen.

Your job is to determine whether the proposed or requested feed plan is
nutritionally adequate, safe, cost-aware, ingredient-aware, practical, and
aligned with the livestock production goal.

Important rules:
1. This is livestock feed guidance, not human nutrition.
2. Do not invent missing lab values, feed composition data, disease diagnosis,
   ingredient prices, or veterinary facts.
3. Treat active feed standards as authoritative.
4. Use the available feed ingredients and constraints. Do not recommend feeds
   that are not listed unless you clearly mark them as external suggestions.
5. If the ration may harm animals, choose REJECTED or NEEDS_REVIEW.
6. If the ration can be improved through rebalancing, choose NEEDS_REVISION.
7. If veterinary or nutritionist judgment is required, choose NEEDS_REVIEW.
8. Include a practical recommended ration summary and feeding instructions when
   enough information exists.
9. Return only JSON matching the schema.

Farm:
{farm_json}

Livestock batch:
{batch_json}

Advisor:
{advisor_json}

Active feed standards:
{standard_packet}

Available feed ingredients:
{ingredient_packet}

Optimization request:
{request_json}

Return this exact JSON object:
{{
  "verdict": "APPROVED | REJECTED | NEEDS_REVIEW | NEEDS_REVISION",
  "nutrient_adequacy_score": 0,
  "livestock_suitability_score": 0,
  "safety_score": 0,
  "cost_efficiency_score": 0,
  "availability_score": 0,
  "production_goal_alignment_score": 0,
  "explainability_score": 0,
  "practicality_score": 0,
  "risk_score": 0,
  "risk_band": "LOW | MEDIUM | HIGH | CRITICAL",
  "reviewer_required": false,
  "revision_required": false,
  "recommended_ration_summary": "recommended optimized feed plan using available ingredients",
  "ingredient_mix_summary": "ingredient mix, percentages, parts, or proportions if determinable from supplied data",
  "daily_feeding_summary": "how much and how often to feed, if determinable from supplied data",
  "transition_plan_summary": "safe transition notes from current feeding to new ration",
  "nutrient_gaps": ["specific nutrient gap"],
  "excess_risks": ["specific excess or imbalance risk"],
  "ingredient_risks": ["specific feed ingredient concern"],
  "health_warnings": ["specific livestock health warning"],
  "cost_findings": ["specific cost optimization finding"],
  "availability_findings": ["specific supply or availability finding"],
  "required_changes": ["specific correction needed before approval"],
  "strengths": ["specific positive finding"],
  "feeding_instructions": ["practical farmer-facing feeding instruction"],
  "monitoring_notes": ["what the farmer should monitor after feeding"],
  "rationale": "clear explanation for the verdict",
  "audit_summary": "short audit-ready summary",
  "confidence": 0
}}
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            normalised = self._normalise_ai_review(raw)
            return json.dumps(normalised, sort_keys=True)

        consensus_json = gl.eq_principle.prompt_comparative(
            evaluate_once,
            principle="""
The final livestock feed optimization decision must be equivalent.

Strict requirements:
- verdict must match exactly.
- risk_band must match exactly.
- reviewer_required and revision_required must match exactly.
- APPROVED cannot be equivalent to REJECTED, NEEDS_REVIEW, or NEEDS_REVISION.
- REJECTED cannot be equivalent to APPROVED, NEEDS_REVIEW, or NEEDS_REVISION.
- Nutrient adequacy, livestock suitability, safety, cost efficiency,
  availability, production goal alignment, explainability, practicality,
  confidence, and risk scores may differ by at most 10 points.
- Health warning categories must materially match.
- Ingredient risk categories must materially match.
- Required changes may use different wording but must require materially
  equivalent ration changes.
- Recommended ration summaries may use different wording, but the core feed
  mix direction and safety conditions must be materially equivalent.
- Rationale wording may differ if the verdict and core reasons are the same.
""",
        )

        return self._normalise_ai_review(consensus_json)

    def _adjudicate_feed_request(self, request_id: str, adjudicated_at: str) -> str:
        self._require_not_paused()

        raw_request = self.optimization_requests.get(request_id, "")
        if raw_request == "":
            raise gl.vm.UserError("Feed optimization request not found")

        request_record = self._load(raw_request)
        if request_record.get("status", "") not in ["PENDING", "RETRY_PENDING"]:
            raise gl.vm.UserError("Feed optimization request is not pending adjudication")

        farm_id = request_record.get("farm_id", "")
        batch_id = request_record.get("batch_id", "")
        advisor_id = request_record.get("advisor_id", "")

        farm = self._require_farm_exists(farm_id)
        batch = self._require_batch_exists(batch_id)
        advisor = self._require_advisor_exists(advisor_id)
        standard_packet = self._collect_standard_packet(farm_id, request_record.get("standard_ids_csv", ""))
        ingredient_packet = self._collect_ingredient_packet(farm_id, request_record.get("ingredient_ids_csv", ""))

        review = self._run_consensus_feed_review(
            request_record,
            farm,
            batch,
            advisor,
            standard_packet,
            ingredient_packet,
        )
        review = self._apply_feed_thresholds(review, farm)

        decision_id = self._next_id("DEC", "decision")
        verdict = review["verdict"]

        request_status = "NEEDS_REVIEW"
        if verdict == "APPROVED":
            request_status = "APPROVED"
            self.approved_ration_hashes[request_record.get("ration_hash", "")] = request_id
        elif verdict == "REJECTED":
            request_status = "REJECTED"
            self.blocked_ration_hashes[request_record.get("ration_hash", "")] = request_id
        elif verdict == "NEEDS_REVISION":
            request_status = "NEEDS_REVISION"
        elif verdict == "NEEDS_REVIEW":
            request_status = "NEEDS_REVIEW"

        decision_record = {
            "decision_id": decision_id,
            "request_id": request_id,
            "farm_id": farm_id,
            "batch_id": batch_id,
            "advisor_id": advisor_id,
            "verdict": verdict,
            "request_status": request_status,
            "feed_optimization_review": review,
            "adjudicated_by": "GENLAYER_CONSENSUS",
            "adjudicated_at": adjudicated_at,
        }

        self.decisions[decision_id] = self._json(decision_record)
        self.request_decisions[request_id] = decision_id

        request_record["status"] = request_status
        request_record["last_decision_id"] = decision_id
        request_record["adjudicated_at"] = adjudicated_at
        self.optimization_requests[request_id] = self._json(request_record)

        if request_status == "NEEDS_REVIEW":
            escalation_id = self._next_id("ESC", "escalation")
            escalation_record = {
                "escalation_id": escalation_id,
                "request_id": request_id,
                "farm_id": farm_id,
                "batch_id": batch_id,
                "advisor_id": advisor_id,
                "decision_id": decision_id,
                "status": "OPEN",
                "reason": review.get("rationale", ""),
                "opened_at": adjudicated_at,
                "opened_by": "GENLAYER_CONSENSUS",
            }
            self.escalations[request_id] = self._json(escalation_record)

        self._record_audit(
            farm_id,
            request_id,
            "GENLAYER_FEED_OPTIMIZATION_DECISION",
            "GENLAYER_CONSENSUS",
            "Consensus livestock feed verdict: " + verdict,
            decision_id,
            adjudicated_at,
        )

        return self._json(decision_record)

    def _update_reviewer_reputation(
        self,
        reviewer: str,
        farm_id: str,
        accepted: bool,
        reviewed_at: str,
    ) -> None:
        key = self._key2(farm_id, reviewer.lower())
        raw = self.reviewer_reputation.get(key, "")
        if raw == "":
            record = {
                "farm_id": farm_id,
                "reviewer": reviewer.lower(),
                "reviews": 0,
                "accepted_reviews": 0,
                "rejected_reviews": 0,
                "last_reviewed_at": "",
            }
        else:
            record = self._load(raw)

        record["reviews"] = self._to_int(record.get("reviews", 0), 0) + 1
        if accepted:
            record["accepted_reviews"] = self._to_int(record.get("accepted_reviews", 0), 0) + 1
        else:
            record["rejected_reviews"] = self._to_int(record.get("rejected_reviews", 0), 0) + 1
        record["last_reviewed_at"] = reviewed_at
        self.reviewer_reputation[key] = self._json(record)

    # ------------------------------------------------------------------
    # Owner and contract status
    # ------------------------------------------------------------------

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.view
    def get_contract_summary(self) -> str:
        return self._json(
            {
                "owner": self.owner,
                "paused": self.paused,
                "farm_counter": str(self.farm_counter),
                "advisor_counter": str(self.advisor_counter),
                "batch_counter": str(self.batch_counter),
                "ingredient_counter": str(self.ingredient_counter),
                "standard_counter": str(self.standard_counter),
                "request_counter": str(self.request_counter),
                "decision_counter": str(self.decision_counter),
                "audit_counter": str(self.audit_counter),
            }
        )

    @gl.public.write
    def transfer_ownership(self, new_owner: str, updated_at: str) -> None:
        self._require_owner()
        self._require_non_empty(new_owner, "new_owner")
        previous = self.owner
        self.owner = new_owner
        self._record_audit(
            "",
            "",
            "OWNERSHIP_TRANSFERRED",
            previous,
            "Contract ownership transferred",
            new_owner,
            updated_at,
        )

    @gl.public.write
    def pause(self) -> None:
        self._require_owner()
        self.paused = True

    @gl.public.write
    def unpause(self) -> None:
        self._require_owner()
        self.paused = False

    # ------------------------------------------------------------------
    # Farm management
    # ------------------------------------------------------------------

    @gl.public.write
    def create_farm(
        self,
        farm_id: str,
        name: str,
        farm_type: str,
        location_context: str,
        metadata_hash: str,
        created_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(name, "name")

        final_farm_id = farm_id
        if final_farm_id.strip() == "":
            final_farm_id = self._next_id("FARM", "farm")
        if self.farms.get(final_farm_id, "") != "":
            raise gl.vm.UserError("Farm already exists")

        record = {
            "farm_id": final_farm_id,
            "name": self._limit(name, 180),
            "farm_type": self._limit(farm_type, 140),
            "location_context": self._limit(location_context, 800),
            "metadata_hash": metadata_hash,
            "status": "ACTIVE",
            "created_by": self._sender(),
            "created_at": created_at,
            "optimization_config": {
                "min_approve_nutrient_adequacy": "78",
                "min_approve_suitability": "78",
                "min_approve_safety": "84",
                "min_approve_availability": "65",
                "min_approve_practicality": "65",
                "max_approve_risk": "35",
                "auto_review_risk": "60",
                "auto_reject_risk": "88",
            },
        }

        self.farms[final_farm_id] = self._json(record)
        self.farm_roles[self._key2(final_farm_id, self._sender())] = "OWNER"
        self.farm_index["all"] = self._append_unique(
            self.farm_index.get("all", ""),
            final_farm_id,
        )

        self._record_audit(
            final_farm_id,
            "",
            "FARM_CREATED",
            self._sender(),
            "Farm created for livestock feed optimization",
            metadata_hash,
            created_at,
        )

        return final_farm_id

    @gl.public.write
    def add_farm_role(
        self,
        farm_id: str,
        wallet: str,
        role: str,
        added_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_farm_exists(farm_id)
        self._require_farm_owner_or_admin(farm_id)
        self._require_non_empty(wallet, "wallet")

        final_role = self._normalise_status(role, "ADMIN|NUTRITIONIST|VET|REVIEWER", "role")
        self.farm_roles[self._key2(farm_id, wallet.lower())] = final_role

        self._record_audit(
            farm_id,
            "",
            "FARM_ROLE_ADDED",
            self._sender(),
            "Added " + final_role + " role for " + wallet.lower(),
            wallet.lower(),
            added_at,
        )

    @gl.public.write
    def remove_farm_role(
        self,
        farm_id: str,
        wallet: str,
        removed_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_farm_exists(farm_id)
        self._require_farm_owner_or_admin(farm_id)

        key = self._key2(farm_id, wallet.lower())
        role = self.farm_roles.get(key, "")
        if role == "OWNER":
            raise gl.vm.UserError("Cannot remove farm owner")

        self.farm_roles[key] = "REMOVED"

        self._record_audit(
            farm_id,
            "",
            "FARM_ROLE_REMOVED",
            self._sender(),
            "Removed farm role for " + wallet.lower(),
            wallet.lower(),
            removed_at,
        )

    @gl.public.write
    def set_farm_status(
        self,
        farm_id: str,
        status: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_farm_owner_or_admin(farm_id)

        record = self._require_farm_exists(farm_id)
        final_status = self._normalise_status(status, "ACTIVE|SUSPENDED|ARCHIVED", "farm status")
        record["status"] = final_status
        record["updated_at"] = updated_at
        self.farms[farm_id] = self._json(record)

        self._record_audit(
            farm_id,
            "",
            "FARM_STATUS_UPDATED",
            self._sender(),
            "Farm status set to " + final_status,
            final_status,
            updated_at,
        )

    @gl.public.write
    def set_farm_optimization_config(
        self,
        farm_id: str,
        min_approve_nutrient_adequacy: u256,
        min_approve_suitability: u256,
        min_approve_safety: u256,
        min_approve_availability: u256,
        min_approve_practicality: u256,
        max_approve_risk: u256,
        auto_review_risk: u256,
        auto_reject_risk: u256,
        updated_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_farm_owner_or_admin(farm_id)

        values = [
            min_approve_nutrient_adequacy,
            min_approve_suitability,
            min_approve_safety,
            min_approve_availability,
            min_approve_practicality,
            max_approve_risk,
            auto_review_risk,
            auto_reject_risk,
        ]
        for value in values:
            if value > u256(100):
                raise gl.vm.UserError("Optimization config values must be 0 to 100")

        farm = self._require_farm_exists(farm_id)
        farm["optimization_config"] = {
            "min_approve_nutrient_adequacy": str(min_approve_nutrient_adequacy),
            "min_approve_suitability": str(min_approve_suitability),
            "min_approve_safety": str(min_approve_safety),
            "min_approve_availability": str(min_approve_availability),
            "min_approve_practicality": str(min_approve_practicality),
            "max_approve_risk": str(max_approve_risk),
            "auto_review_risk": str(auto_review_risk),
            "auto_reject_risk": str(auto_reject_risk),
        }
        farm["updated_at"] = updated_at
        self.farms[farm_id] = self._json(farm)

        self._record_audit(
            farm_id,
            "",
            "FARM_OPTIMIZATION_CONFIG_UPDATED",
            self._sender(),
            "Feed optimization thresholds updated",
            self._json(farm["optimization_config"]),
            updated_at,
        )

    # ------------------------------------------------------------------
    # Advisor management
    # ------------------------------------------------------------------

    @gl.public.write
    def register_feed_advisor(
        self,
        advisor_id: str,
        farm_id: str,
        name: str,
        credential_summary: str,
        scope_summary: str,
        wallet: str,
        metadata_hash: str,
        registered_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_farm_owner_or_admin(farm_id)
        self._require_non_empty(name, "name")

        farm = self._require_farm_exists(farm_id)
        if farm.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Farm is not active")

        final_advisor_id = advisor_id
        if final_advisor_id.strip() == "":
            final_advisor_id = self._next_id("ADV", "advisor")
        if self.advisors.get(final_advisor_id, "") != "":
            raise gl.vm.UserError("Feed advisor already exists")

        final_wallet = wallet
        if final_wallet.strip() == "":
            final_wallet = self._sender()

        record = {
            "advisor_id": final_advisor_id,
            "farm_id": farm_id,
            "name": self._limit(name, 180),
            "credential_summary": self._limit(credential_summary, 1000),
            "scope_summary": self._limit(scope_summary, 1000),
            "wallet": final_wallet.lower(),
            "metadata_hash": metadata_hash,
            "status": "ACTIVE",
            "registered_by": self._sender(),
            "registered_at": registered_at,
        }

        self.advisors[final_advisor_id] = self._json(record)
        self.farm_advisor_index[farm_id] = self._append_unique(
            self.farm_advisor_index.get(farm_id, ""),
            final_advisor_id,
        )

        self._record_audit(
            farm_id,
            "",
            "FEED_ADVISOR_REGISTERED",
            self._sender(),
            "Feed advisor registered: " + final_advisor_id,
            metadata_hash,
            registered_at,
        )

        return final_advisor_id

    @gl.public.write
    def set_feed_advisor_status(
        self,
        advisor_id: str,
        status: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()

        advisor = self._require_advisor_exists(advisor_id)
        farm_id = advisor.get("farm_id", "")
        self._require_farm_owner_or_admin(farm_id)

        final_status = self._normalise_status(status, "ACTIVE|SUSPENDED|REVOKED|ARCHIVED", "advisor status")
        advisor["status"] = final_status
        advisor["updated_at"] = updated_at
        self.advisors[advisor_id] = self._json(advisor)

        self._record_audit(
            farm_id,
            "",
            "FEED_ADVISOR_STATUS_UPDATED",
            self._sender(),
            "Feed advisor " + advisor_id + " status set to " + final_status,
            final_status,
            updated_at,
        )

    # ------------------------------------------------------------------
    # Livestock batch management
    # ------------------------------------------------------------------

    @gl.public.write
    def register_livestock_batch(
        self,
        batch_id: str,
        farm_id: str,
        species: str,
        breed_summary: str,
        production_stage: str,
        production_goal: str,
        head_count: str,
        weight_summary: str,
        health_status_summary: str,
        feeding_constraints: str,
        metadata_hash: str,
        registered_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_farm_reviewer_or_admin(farm_id)
        self._require_non_empty(species, "species")
        self._require_non_empty(production_stage, "production_stage")
        self._require_non_empty(production_goal, "production_goal")

        farm = self._require_farm_exists(farm_id)
        if farm.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Farm is not active")

        final_batch_id = batch_id
        if final_batch_id.strip() == "":
            final_batch_id = self._next_id("BATCH", "batch")
        if self.livestock_batches.get(final_batch_id, "") != "":
            raise gl.vm.UserError("Livestock batch already exists")

        record = {
            "batch_id": final_batch_id,
            "farm_id": farm_id,
            "species": self._limit(species, 100),
            "breed_summary": self._limit(breed_summary, 700),
            "production_stage": self._limit(production_stage, 180),
            "production_goal": self._limit(production_goal, 1000),
            "head_count": self._limit(head_count, 120),
            "weight_summary": self._limit(weight_summary, 800),
            "health_status_summary": self._limit(health_status_summary, 1200),
            "feeding_constraints": self._limit(feeding_constraints, 1200),
            "metadata_hash": metadata_hash,
            "status": "ACTIVE",
            "registered_by": self._sender(),
            "registered_at": registered_at,
        }

        self.livestock_batches[final_batch_id] = self._json(record)
        self.farm_batch_index[farm_id] = self._append_unique(
            self.farm_batch_index.get(farm_id, ""),
            final_batch_id,
        )

        self._record_audit(
            farm_id,
            "",
            "LIVESTOCK_BATCH_REGISTERED",
            self._sender(),
            "Livestock batch registered",
            metadata_hash,
            registered_at,
        )

        return final_batch_id

    @gl.public.write
    def update_livestock_batch_summary(
        self,
        batch_id: str,
        production_goal: str,
        head_count: str,
        weight_summary: str,
        health_status_summary: str,
        feeding_constraints: str,
        metadata_hash: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()

        batch = self._require_batch_exists(batch_id)
        farm_id = batch.get("farm_id", "")
        self._require_farm_reviewer_or_admin(farm_id)

        batch["production_goal"] = self._limit(production_goal, 1000)
        batch["head_count"] = self._limit(head_count, 120)
        batch["weight_summary"] = self._limit(weight_summary, 800)
        batch["health_status_summary"] = self._limit(health_status_summary, 1200)
        batch["feeding_constraints"] = self._limit(feeding_constraints, 1200)
        batch["metadata_hash"] = metadata_hash
        batch["updated_at"] = updated_at
        self.livestock_batches[batch_id] = self._json(batch)

        self._record_audit(
            farm_id,
            "",
            "LIVESTOCK_BATCH_UPDATED",
            self._sender(),
            "Livestock batch context updated",
            metadata_hash,
            updated_at,
        )

    @gl.public.write
    def set_livestock_batch_status(
        self,
        batch_id: str,
        status: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()

        batch = self._require_batch_exists(batch_id)
        farm_id = batch.get("farm_id", "")
        self._require_farm_reviewer_or_admin(farm_id)

        final_status = self._normalise_status(status, "ACTIVE|SUSPENDED|ARCHIVED", "livestock batch status")
        batch["status"] = final_status
        batch["updated_at"] = updated_at
        self.livestock_batches[batch_id] = self._json(batch)

        self._record_audit(
            farm_id,
            "",
            "LIVESTOCK_BATCH_STATUS_UPDATED",
            self._sender(),
            "Livestock batch status set to " + final_status,
            final_status,
            updated_at,
        )

    # ------------------------------------------------------------------
    # Feed ingredient management
    # ------------------------------------------------------------------

    @gl.public.write
    def register_feed_ingredient(
        self,
        ingredient_id: str,
        farm_id: str,
        name: str,
        category: str,
        nutrient_profile_summary: str,
        safety_summary: str,
        availability_summary: str,
        cost_summary: str,
        metadata_hash: str,
        registered_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_farm_reviewer_or_admin(farm_id)
        self._require_non_empty(name, "name")
        self._require_non_empty(nutrient_profile_summary, "nutrient_profile_summary")

        farm = self._require_farm_exists(farm_id)
        if farm.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Farm is not active")

        final_ingredient_id = ingredient_id
        if final_ingredient_id.strip() == "":
            final_ingredient_id = self._next_id("ING", "ingredient")
        if self.feed_ingredients.get(final_ingredient_id, "") != "":
            raise gl.vm.UserError("Feed ingredient already exists")

        record = {
            "ingredient_id": final_ingredient_id,
            "farm_id": farm_id,
            "name": self._limit(name, 180),
            "category": self._limit(category, 120),
            "nutrient_profile_summary": self._limit(nutrient_profile_summary, 1800),
            "safety_summary": self._limit(safety_summary, 1000),
            "availability_summary": self._limit(availability_summary, 1000),
            "cost_summary": self._limit(cost_summary, 800),
            "metadata_hash": metadata_hash,
            "status": "ACTIVE",
            "registered_by": self._sender(),
            "registered_at": registered_at,
        }

        self.feed_ingredients[final_ingredient_id] = self._json(record)
        self.farm_ingredient_index[farm_id] = self._append_unique(
            self.farm_ingredient_index.get(farm_id, ""),
            final_ingredient_id,
        )

        self._record_audit(
            farm_id,
            "",
            "FEED_INGREDIENT_REGISTERED",
            self._sender(),
            "Feed ingredient registered: " + name,
            metadata_hash,
            registered_at,
        )

        return final_ingredient_id

    @gl.public.write
    def update_feed_ingredient(
        self,
        ingredient_id: str,
        nutrient_profile_summary: str,
        safety_summary: str,
        availability_summary: str,
        cost_summary: str,
        metadata_hash: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()

        ingredient = self._require_ingredient_exists(ingredient_id)
        farm_id = ingredient.get("farm_id", "")
        self._require_farm_reviewer_or_admin(farm_id)

        ingredient["nutrient_profile_summary"] = self._limit(nutrient_profile_summary, 1800)
        ingredient["safety_summary"] = self._limit(safety_summary, 1000)
        ingredient["availability_summary"] = self._limit(availability_summary, 1000)
        ingredient["cost_summary"] = self._limit(cost_summary, 800)
        ingredient["metadata_hash"] = metadata_hash
        ingredient["updated_at"] = updated_at
        self.feed_ingredients[ingredient_id] = self._json(ingredient)

        self._record_audit(
            farm_id,
            "",
            "FEED_INGREDIENT_UPDATED",
            self._sender(),
            "Feed ingredient details updated",
            metadata_hash,
            updated_at,
        )

    @gl.public.write
    def set_feed_ingredient_status(
        self,
        ingredient_id: str,
        status: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()

        ingredient = self._require_ingredient_exists(ingredient_id)
        farm_id = ingredient.get("farm_id", "")
        self._require_farm_reviewer_or_admin(farm_id)

        final_status = self._normalise_status(status, "ACTIVE|UNAVAILABLE|SUSPENDED|ARCHIVED", "feed ingredient status")
        ingredient["status"] = final_status
        ingredient["updated_at"] = updated_at
        self.feed_ingredients[ingredient_id] = self._json(ingredient)

        self._record_audit(
            farm_id,
            "",
            "FEED_INGREDIENT_STATUS_UPDATED",
            self._sender(),
            "Feed ingredient status set to " + final_status,
            final_status,
            updated_at,
        )

    # ------------------------------------------------------------------
    # Feed standard management and versioning
    # ------------------------------------------------------------------

    @gl.public.write
    def publish_feed_standard_version(
        self,
        farm_id: str,
        standard_id: str,
        version: str,
        title: str,
        species_scope: str,
        production_stage_scope: str,
        severity: str,
        nutrient_target_rules: str,
        ingredient_limit_rules: str,
        toxin_and_anti_nutrient_rules: str,
        health_escalation_rules: str,
        cost_and_availability_rules: str,
        standard_hash: str,
        metadata_hash: str,
        published_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_farm_owner_or_admin(farm_id)
        self._require_non_empty(standard_id, "standard_id")
        self._require_non_empty(version, "version")
        self._require_non_empty(title, "title")
        self._require_non_empty(nutrient_target_rules, "nutrient_target_rules")
        self._require_non_empty(standard_hash, "standard_hash")

        farm = self._require_farm_exists(farm_id)
        if farm.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Farm is not active")

        standard_key = self._key3(farm_id, standard_id, version)
        if self.feed_standards.get(standard_key, "") != "":
            raise gl.vm.UserError("Feed standard version already exists")

        self.standard_counter = self.standard_counter + u256(1)

        record = {
            "farm_id": farm_id,
            "standard_id": standard_id,
            "version": version,
            "title": self._limit(title, 220),
            "species_scope": self._limit(species_scope, 180),
            "production_stage_scope": self._limit(production_stage_scope, 180),
            "severity": self._normalise_status(severity, "LOW|MEDIUM|HIGH|CRITICAL", "severity"),
            "nutrient_target_rules": self._limit(nutrient_target_rules, 4000),
            "ingredient_limit_rules": self._limit(ingredient_limit_rules, 3000),
            "toxin_and_anti_nutrient_rules": self._limit(toxin_and_anti_nutrient_rules, 3000),
            "health_escalation_rules": self._limit(health_escalation_rules, 2600),
            "cost_and_availability_rules": self._limit(cost_and_availability_rules, 2200),
            "standard_hash": standard_hash,
            "metadata_hash": metadata_hash,
            "status": "ACTIVE",
            "published_by": self._sender(),
            "published_at": published_at,
        }

        self.feed_standards[standard_key] = self._json(record)
        self.current_standard_versions[self._key2(farm_id, standard_id)] = version
        self.farm_standard_index[farm_id] = self._append_unique(
            self.farm_standard_index.get(farm_id, ""),
            standard_id,
        )
        self.standard_version_index[self._key2(farm_id, standard_id)] = self._append_unique(
            self.standard_version_index.get(self._key2(farm_id, standard_id), ""),
            version,
        )

        self._record_audit(
            farm_id,
            "",
            "FEED_STANDARD_VERSION_PUBLISHED",
            self._sender(),
            "Feed standard " + standard_id + " version " + version + " published",
            standard_hash,
            published_at,
        )

        return standard_key

    @gl.public.write
    def set_current_feed_standard_version(
        self,
        farm_id: str,
        standard_id: str,
        version: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_farm_owner_or_admin(farm_id)

        standard = self._require_standard_version_exists(farm_id, standard_id, version)
        if standard.get("status", "") != "ACTIVE":
            raise gl.vm.UserError("Cannot set inactive standard as current")

        self.current_standard_versions[self._key2(farm_id, standard_id)] = version

        self._record_audit(
            farm_id,
            "",
            "CURRENT_FEED_STANDARD_UPDATED",
            self._sender(),
            "Current feed standard " + standard_id + " set to version " + version,
            self._key3(farm_id, standard_id, version),
            updated_at,
        )

    @gl.public.write
    def set_feed_standard_version_status(
        self,
        farm_id: str,
        standard_id: str,
        version: str,
        status: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_farm_owner_or_admin(farm_id)

        standard = self._require_standard_version_exists(farm_id, standard_id, version)
        final_status = self._normalise_status(status, "ACTIVE|DEPRECATED|ARCHIVED", "feed standard status")
        standard["status"] = final_status
        standard["updated_at"] = updated_at
        self.feed_standards[self._key3(farm_id, standard_id, version)] = self._json(standard)

        self._record_audit(
            farm_id,
            "",
            "FEED_STANDARD_VERSION_STATUS_UPDATED",
            self._sender(),
            "Feed standard " + standard_id + " version " + version + " status set to " + final_status,
            final_status,
            updated_at,
        )

    # ------------------------------------------------------------------
    # Feed optimization submission and GenLayer consensus
    # ------------------------------------------------------------------

    @gl.public.write
    def submit_feed_optimization_request(
        self,
        request_id: str,
        farm_id: str,
        batch_id: str,
        advisor_id: str,
        standard_ids_csv: str,
        ingredient_ids_csv: str,
        objective_summary: str,
        current_feeding_summary: str,
        available_feed_summary: str,
        candidate_ration_summary: str,
        nutrient_analysis_summary: str,
        cost_constraint_summary: str,
        supply_constraint_summary: str,
        health_context_summary: str,
        environment_context_summary: str,
        evidence_manifest_hash: str,
        ration_hash: str,
        submitted_at: str,
        expires_at: str,
    ) -> str:
        return self._create_optimization_request(
            request_id,
            farm_id,
            batch_id,
            advisor_id,
            standard_ids_csv,
            ingredient_ids_csv,
            objective_summary,
            current_feeding_summary,
            available_feed_summary,
            candidate_ration_summary,
            nutrient_analysis_summary,
            cost_constraint_summary,
            supply_constraint_summary,
            health_context_summary,
            environment_context_summary,
            evidence_manifest_hash,
            ration_hash,
            submitted_at,
            expires_at,
        )

    @gl.public.write
    def adjudicate_feed_optimization(
        self,
        request_id: str,
        adjudicated_at: str,
    ) -> str:
        return self._adjudicate_feed_request(request_id, adjudicated_at)

    @gl.public.write
    def submit_and_optimize_feed(
        self,
        request_id: str,
        farm_id: str,
        batch_id: str,
        advisor_id: str,
        standard_ids_csv: str,
        ingredient_ids_csv: str,
        objective_summary: str,
        current_feeding_summary: str,
        available_feed_summary: str,
        candidate_ration_summary: str,
        nutrient_analysis_summary: str,
        cost_constraint_summary: str,
        supply_constraint_summary: str,
        health_context_summary: str,
        environment_context_summary: str,
        evidence_manifest_hash: str,
        ration_hash: str,
        submitted_at: str,
        expires_at: str,
        adjudicated_at: str,
    ) -> str:
        final_request_id = self._create_optimization_request(
            request_id,
            farm_id,
            batch_id,
            advisor_id,
            standard_ids_csv,
            ingredient_ids_csv,
            objective_summary,
            current_feeding_summary,
            available_feed_summary,
            candidate_ration_summary,
            nutrient_analysis_summary,
            cost_constraint_summary,
            supply_constraint_summary,
            health_context_summary,
            environment_context_summary,
            evidence_manifest_hash,
            ration_hash,
            submitted_at,
            expires_at,
        )
        return self._adjudicate_feed_request(final_request_id, adjudicated_at)

    # ------------------------------------------------------------------
    # Human review and feed-plan activation
    # ------------------------------------------------------------------

    @gl.public.write
    def human_feed_review_decision(
        self,
        request_id: str,
        final_verdict: str,
        review_reason: str,
        review_evidence_hash: str,
        reviewer_notes: str,
        decided_at: str,
    ) -> str:
        self._require_not_paused()

        raw_request = self.optimization_requests.get(request_id, "")
        if raw_request == "":
            raise gl.vm.UserError("Feed optimization request not found")

        request_record = self._load(raw_request)
        farm_id = request_record.get("farm_id", "")
        self._require_farm_reviewer_or_admin(farm_id)

        if request_record.get("status", "") not in ["NEEDS_REVIEW", "NEEDS_REVISION"]:
            raise gl.vm.UserError("Feed request is not eligible for human review")

        verdict = self._normalise_verdict(final_verdict)
        if verdict == "NEEDS_REVIEW":
            raise gl.vm.UserError("Human review must resolve to APPROVED, REJECTED, or NEEDS_REVISION")

        human_review_id = self._next_id("HREV", "human_review")

        request_status = "HUMAN_APPROVED"
        accepted = True
        if verdict == "REJECTED":
            request_status = "HUMAN_REJECTED"
            accepted = False
            self.blocked_ration_hashes[request_record.get("ration_hash", "")] = request_id
        elif verdict == "NEEDS_REVISION":
            request_status = "NEEDS_REVISION"
            accepted = False
        else:
            self.approved_ration_hashes[request_record.get("ration_hash", "")] = request_id

        review_record = {
            "human_review_id": human_review_id,
            "request_id": request_id,
            "farm_id": farm_id,
            "reviewer": self._sender(),
            "final_verdict": verdict,
            "request_status": request_status,
            "review_reason": self._limit(review_reason, 1400),
            "review_evidence_hash": review_evidence_hash,
            "reviewer_notes": self._limit(reviewer_notes, 1200),
            "decided_at": decided_at,
        }

        self.human_reviews[request_id] = self._json(review_record)

        request_record["status"] = request_status
        request_record["human_review_id"] = human_review_id
        request_record["human_decided_at"] = decided_at
        self.optimization_requests[request_id] = self._json(request_record)

        escalation = self._load(self.escalations.get(request_id, "{}"))
        if escalation != {}:
            escalation["status"] = "CLOSED"
            escalation["closed_by"] = self._sender()
            escalation["closed_at"] = decided_at
            escalation["close_reason"] = "Human feed review: " + verdict
            self.escalations[request_id] = self._json(escalation)

        self._update_reviewer_reputation(self._sender(), farm_id, accepted, decided_at)
        self.reviewer_decision_index[self._key2(farm_id, self._sender())] = self._append(
            self.reviewer_decision_index.get(self._key2(farm_id, self._sender()), ""),
            request_id,
        )

        self._record_audit(
            farm_id,
            request_id,
            "HUMAN_FEED_REVIEW_DECISION",
            self._sender(),
            "Human livestock feed review decision: " + verdict,
            review_evidence_hash,
            decided_at,
        )

        return self._json(review_record)

    @gl.public.write
    def mark_feed_plan_activated(
        self,
        request_id: str,
        activation_hash: str,
        activation_summary: str,
        activated_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(activation_hash, "activation_hash")

        raw_request = self.optimization_requests.get(request_id, "")
        if raw_request == "":
            raise gl.vm.UserError("Feed optimization request not found")

        request_record = self._load(raw_request)
        farm_id = request_record.get("farm_id", "")
        advisor = self._require_advisor_exists(request_record.get("advisor_id", ""))

        sender = self._sender()
        if not self._is_farm_owner_or_admin(farm_id, sender) and sender != str(advisor.get("wallet", "")).lower():
            raise gl.vm.UserError("Only farm admin or assigned advisor can activate feed plan")

        if request_record.get("status", "") not in ["APPROVED", "HUMAN_APPROVED"]:
            raise gl.vm.UserError("Feed plan is not approved for activation")

        activation_id = self._next_id("ACT", "activation")
        activation_record = {
            "activation_id": activation_id,
            "request_id": request_id,
            "farm_id": farm_id,
            "batch_id": request_record.get("batch_id", ""),
            "advisor_id": request_record.get("advisor_id", ""),
            "activation_hash": activation_hash,
            "activation_summary": self._limit(activation_summary, 1400),
            "activated_by": sender,
            "activated_at": activated_at,
        }

        self.activated_feed_plans[request_id] = self._json(activation_record)

        request_record["status"] = "ACTIVATED"
        request_record["activation_id"] = activation_id
        request_record["activated_at"] = activated_at
        self.optimization_requests[request_id] = self._json(request_record)

        self._record_audit(
            farm_id,
            request_id,
            "FEED_PLAN_ACTIVATED",
            sender,
            "Approved livestock feed plan activated",
            activation_hash,
            activated_at,
        )

        return self._json(activation_record)

    @gl.public.write
    def mark_feed_plan_blocked(
        self,
        request_id: str,
        block_reason: str,
        blocked_at: str,
    ) -> None:
        self._require_not_paused()

        raw_request = self.optimization_requests.get(request_id, "")
        if raw_request == "":
            raise gl.vm.UserError("Feed optimization request not found")

        request_record = self._load(raw_request)
        farm_id = request_record.get("farm_id", "")
        self._require_farm_reviewer_or_admin(farm_id)

        request_record["status"] = "BLOCKED"
        request_record["blocked_reason"] = self._limit(block_reason, 1200)
        request_record["blocked_at"] = blocked_at
        self.optimization_requests[request_id] = self._json(request_record)
        self.blocked_ration_hashes[request_record.get("ration_hash", "")] = request_id

        self._record_audit(
            farm_id,
            request_id,
            "FEED_PLAN_BLOCKED",
            self._sender(),
            "Livestock feed plan manually blocked",
            block_reason,
            blocked_at,
        )

    # ------------------------------------------------------------------
    # Read methods for frontend, dashboard, indexer, review file, audit
    # ------------------------------------------------------------------

    @gl.public.view
    def get_farm(self, farm_id: str) -> str:
        return self.farms.get(farm_id, "")

    @gl.public.view
    def get_farm_role(self, farm_id: str, wallet: str) -> str:
        return self.farm_roles.get(self._key2(farm_id, wallet.lower()), "")

    @gl.public.view
    def get_farm_index(self) -> str:
        return self.farm_index.get("all", "")

    @gl.public.view
    def get_feed_advisor(self, advisor_id: str) -> str:
        return self.advisors.get(advisor_id, "")

    @gl.public.view
    def get_farm_advisor_index(self, farm_id: str) -> str:
        return self.farm_advisor_index.get(farm_id, "")

    @gl.public.view
    def get_livestock_batch(self, batch_id: str) -> str:
        return self.livestock_batches.get(batch_id, "")

    @gl.public.view
    def get_farm_batch_index(self, farm_id: str) -> str:
        return self.farm_batch_index.get(farm_id, "")

    @gl.public.view
    def get_feed_ingredient(self, ingredient_id: str) -> str:
        return self.feed_ingredients.get(ingredient_id, "")

    @gl.public.view
    def get_farm_ingredient_index(self, farm_id: str) -> str:
        return self.farm_ingredient_index.get(farm_id, "")

    @gl.public.view
    def get_feed_standard_version(self, farm_id: str, standard_id: str, version: str) -> str:
        return self.feed_standards.get(self._key3(farm_id, standard_id, version), "")

    @gl.public.view
    def get_current_feed_standard_version(self, farm_id: str, standard_id: str) -> str:
        return self.current_standard_versions.get(self._key2(farm_id, standard_id), "")

    @gl.public.view
    def get_farm_feed_standard_index(self, farm_id: str) -> str:
        return self.farm_standard_index.get(farm_id, "")

    @gl.public.view
    def get_feed_standard_version_index(self, farm_id: str, standard_id: str) -> str:
        return self.standard_version_index.get(self._key2(farm_id, standard_id), "")

    @gl.public.view
    def get_feed_optimization_request(self, request_id: str) -> str:
        return self.optimization_requests.get(request_id, "")

    @gl.public.view
    def get_request_decision_id(self, request_id: str) -> str:
        return self.request_decisions.get(request_id, "")

    @gl.public.view
    def get_decision(self, decision_id: str) -> str:
        return self.decisions.get(decision_id, "")

    @gl.public.view
    def get_latest_decision_for_request(self, request_id: str) -> str:
        decision_id = self.request_decisions.get(request_id, "")
        if decision_id == "":
            return ""
        return self.decisions.get(decision_id, "")

    @gl.public.view
    def get_escalation(self, request_id: str) -> str:
        return self.escalations.get(request_id, "")

    @gl.public.view
    def get_human_review(self, request_id: str) -> str:
        return self.human_reviews.get(request_id, "")

    @gl.public.view
    def get_activated_feed_plan(self, request_id: str) -> str:
        return self.activated_feed_plans.get(request_id, "")

    @gl.public.view
    def get_farm_request_index(self, farm_id: str) -> str:
        return self.farm_request_index.get(farm_id, "")

    @gl.public.view
    def get_batch_request_index(self, batch_id: str) -> str:
        return self.batch_request_index.get(batch_id, "")

    @gl.public.view
    def get_advisor_request_index(self, advisor_id: str) -> str:
        return self.advisor_request_index.get(advisor_id, "")

    @gl.public.view
    def get_audit_log(self, audit_id: str) -> str:
        return self.audit_logs.get(audit_id, "")

    @gl.public.view
    def get_request_audit_index(self, request_id: str) -> str:
        return self.request_audit_index.get(request_id, "")

    @gl.public.view
    def get_reviewer_reputation(self, farm_id: str, reviewer_wallet: str) -> str:
        return self.reviewer_reputation.get(self._key2(farm_id, reviewer_wallet.lower()), "")

    @gl.public.view
    def is_ration_hash_approved(self, ration_hash: str) -> str:
        return self.approved_ration_hashes.get(ration_hash, "")

    @gl.public.view
    def is_ration_hash_blocked(self, ration_hash: str) -> str:
        return self.blocked_ration_hashes.get(ration_hash, "")
