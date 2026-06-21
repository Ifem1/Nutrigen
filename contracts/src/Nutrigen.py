# Nutrigen GenLayer Intelligent Contract v0.3.0
# Livestock Feed Optimization Platform
# Network: StudioNet | Chain ID: 61999

import json
import hashlib
from datetime import datetime, timezone
import gl

# ---------------------------------------------------------------------------
# Type aliases for clarity
# ---------------------------------------------------------------------------
FarmId = str
BatchId = str
AdvisorId = str
IngredientId = str
StandardId = str
RequestId = str
DecisionId = str
AuditId = str
EscalationId = str
WalletAddress = str


# ---------------------------------------------------------------------------
# Data classes (stored as JSON strings in contract state)
# ---------------------------------------------------------------------------

class Farm:
    def __init__(self, farm_id, name, farm_type, location_context, owner, metadata_hash, status, created_at):
        self.farm_id = farm_id
        self.name = name
        self.farm_type = farm_type
        self.location_context = location_context
        self.owner = owner
        self.metadata_hash = metadata_hash
        self.status = status          # ACTIVE | INACTIVE | SUSPENDED
        self.created_at = created_at
        self.updated_at = created_at
        self.optimization_config = {}

    def to_dict(self):
        return self.__dict__


class FeedAdvisor:
    def __init__(self, advisor_id, farm_id, name, credential_summary, scope_summary, wallet, metadata_hash, status, registered_at):
        self.advisor_id = advisor_id
        self.farm_id = farm_id
        self.name = name
        self.credential_summary = credential_summary
        self.scope_summary = scope_summary
        self.wallet = wallet
        self.metadata_hash = metadata_hash
        self.status = status          # ACTIVE | INACTIVE | SUSPENDED
        self.registered_at = registered_at
        self.updated_at = registered_at

    def to_dict(self):
        return self.__dict__


class LivestockBatch:
    def __init__(self, batch_id, farm_id, species, breed_summary, production_stage,
                 production_goal, head_count, weight_summary, health_status_summary,
                 feeding_constraints, metadata_hash, status, registered_at):
        self.batch_id = batch_id
        self.farm_id = farm_id
        self.species = species
        self.breed_summary = breed_summary
        self.production_stage = production_stage
        self.production_goal = production_goal
        self.head_count = head_count
        self.weight_summary = weight_summary
        self.health_status_summary = health_status_summary
        self.feeding_constraints = feeding_constraints
        self.metadata_hash = metadata_hash
        self.status = status          # ACTIVE | INACTIVE | CULLED
        self.registered_at = registered_at
        self.updated_at = registered_at

    def to_dict(self):
        return self.__dict__


class FeedIngredient:
    def __init__(self, ingredient_id, farm_id, name, category, nutrient_profile_summary,
                 safety_summary, availability_summary, cost_summary, metadata_hash, status, registered_at):
        self.ingredient_id = ingredient_id
        self.farm_id = farm_id
        self.name = name
        self.category = category
        self.nutrient_profile_summary = nutrient_profile_summary
        self.safety_summary = safety_summary
        self.availability_summary = availability_summary
        self.cost_summary = cost_summary
        self.metadata_hash = metadata_hash
        self.status = status          # ACTIVE | INACTIVE | RECALLED
        self.registered_at = registered_at
        self.updated_at = registered_at

    def to_dict(self):
        return self.__dict__


class FeedStandardVersion:
    def __init__(self, farm_id, standard_id, version, title, species_scope, production_stage_scope,
                 severity, nutrient_target_rules, ingredient_limit_rules, toxin_and_anti_nutrient_rules,
                 health_escalation_rules, cost_and_availability_rules, standard_hash, metadata_hash,
                 status, published_at):
        self.farm_id = farm_id
        self.standard_id = standard_id
        self.version = version
        self.title = title
        self.species_scope = species_scope
        self.production_stage_scope = production_stage_scope
        self.severity = severity
        self.nutrient_target_rules = nutrient_target_rules
        self.ingredient_limit_rules = ingredient_limit_rules
        self.toxin_and_anti_nutrient_rules = toxin_and_anti_nutrient_rules
        self.health_escalation_rules = health_escalation_rules
        self.cost_and_availability_rules = cost_and_availability_rules
        self.standard_hash = standard_hash
        self.metadata_hash = metadata_hash
        self.status = status          # DRAFT | ACTIVE | DEPRECATED | REVOKED
        self.is_current = False
        self.published_at = published_at
        self.updated_at = published_at

    def to_dict(self):
        return self.__dict__


class OptimizationRequest:
    def __init__(self, request_id, farm_id, batch_id, advisor_id, standard_ids_csv,
                 ingredient_ids_csv, objective_summary, current_feeding_summary,
                 available_feed_summary, candidate_ration_summary, nutrient_analysis_summary,
                 cost_constraint_summary, supply_constraint_summary, health_context_summary,
                 environment_context_summary, evidence_manifest_hash, ration_hash,
                 submitted_at, expires_at):
        self.request_id = request_id
        self.farm_id = farm_id
        self.batch_id = batch_id
        self.advisor_id = advisor_id
        self.standard_ids_csv = standard_ids_csv
        self.ingredient_ids_csv = ingredient_ids_csv
        self.objective_summary = objective_summary
        self.current_feeding_summary = current_feeding_summary
        self.available_feed_summary = available_feed_summary
        self.candidate_ration_summary = candidate_ration_summary
        self.nutrient_analysis_summary = nutrient_analysis_summary
        self.cost_constraint_summary = cost_constraint_summary
        self.supply_constraint_summary = supply_constraint_summary
        self.health_context_summary = health_context_summary
        self.environment_context_summary = environment_context_summary
        self.evidence_manifest_hash = evidence_manifest_hash
        self.ration_hash = ration_hash
        self.submitted_at = submitted_at
        self.expires_at = expires_at
        self.status = "PENDING"
        self.last_decision_id = ""
        self.human_decided_at = ""
        self.activated_at = ""
        self.blocked_at = ""

    def to_dict(self):
        return self.__dict__


class FeedDecision:
    def __init__(self, decision_id, request_id, verdict, nutrient_adequacy_score,
                 livestock_suitability_score, safety_score, cost_efficiency_score,
                 availability_score, production_goal_alignment_score, explainability_score,
                 practicality_score, risk_score, risk_band, reviewer_required,
                 revision_required, recommended_ration_summary, ingredient_mix_summary,
                 daily_feeding_summary, transition_plan_summary, nutrient_gaps,
                 excess_risks, ingredient_risks, health_warnings, cost_findings,
                 availability_findings, required_changes, strengths, feeding_instructions,
                 monitoring_notes, rationale, audit_summary, confidence, adjudicated_at):
        self.decision_id = decision_id
        self.request_id = request_id
        self.verdict = verdict
        self.nutrient_adequacy_score = nutrient_adequacy_score
        self.livestock_suitability_score = livestock_suitability_score
        self.safety_score = safety_score
        self.cost_efficiency_score = cost_efficiency_score
        self.availability_score = availability_score
        self.production_goal_alignment_score = production_goal_alignment_score
        self.explainability_score = explainability_score
        self.practicality_score = practicality_score
        self.risk_score = risk_score
        self.risk_band = risk_band
        self.reviewer_required = reviewer_required
        self.revision_required = revision_required
        self.recommended_ration_summary = recommended_ration_summary
        self.ingredient_mix_summary = ingredient_mix_summary
        self.daily_feeding_summary = daily_feeding_summary
        self.transition_plan_summary = transition_plan_summary
        self.nutrient_gaps = nutrient_gaps
        self.excess_risks = excess_risks
        self.ingredient_risks = ingredient_risks
        self.health_warnings = health_warnings
        self.cost_findings = cost_findings
        self.availability_findings = availability_findings
        self.required_changes = required_changes
        self.strengths = strengths
        self.feeding_instructions = feeding_instructions
        self.monitoring_notes = monitoring_notes
        self.rationale = rationale
        self.audit_summary = audit_summary
        self.confidence = confidence
        self.adjudicated_at = adjudicated_at

    def to_dict(self):
        return self.__dict__


class HumanFeedReview:
    def __init__(self, request_id, reviewer_wallet, final_verdict, review_reason,
                 review_evidence_hash, reviewer_notes, decided_at):
        self.request_id = request_id
        self.reviewer_wallet = reviewer_wallet
        self.final_verdict = final_verdict
        self.review_reason = review_reason
        self.review_evidence_hash = review_evidence_hash
        self.reviewer_notes = reviewer_notes
        self.decided_at = decided_at

    def to_dict(self):
        return self.__dict__


class ActivatedFeedPlan:
    def __init__(self, request_id, activated_by, activation_hash, activation_summary, activated_at):
        self.request_id = request_id
        self.activated_by = activated_by
        self.activation_hash = activation_hash
        self.activation_summary = activation_summary
        self.activated_at = activated_at

    def to_dict(self):
        return self.__dict__


class AuditLog:
    def __init__(self, audit_id, farm_id, request_id, event_type, actor, summary, data_hash, logged_at):
        self.audit_id = audit_id
        self.farm_id = farm_id
        self.request_id = request_id
        self.event_type = event_type
        self.actor = actor
        self.summary = summary
        self.data_hash = data_hash
        self.logged_at = logged_at

    def to_dict(self):
        return self.__dict__


# ---------------------------------------------------------------------------
# Main contract class
# ---------------------------------------------------------------------------

class NutrigenContract(gl.Contract):
    """
    Nutrigen Intelligent Contract — Livestock Feed Optimization
    GenLayer consensus determines whether a proposed feed ration meets
    nutritional, safety, cost, and production-goal requirements for
    a given livestock batch.
    """

    def __init__(self):
        # Owner / admin
        self._owner: str = gl.message.sender_address

        # Pause flag
        self._paused: bool = False

        # Entity stores (keyed by id)
        self._farms: dict = {}
        self._farm_roles: dict = {}              # key: "farm_id:wallet"
        self._feed_advisors: dict = {}
        self._livestock_batches: dict = {}
        self._feed_ingredients: dict = {}
        self._feed_standard_versions: dict = {}  # key: "farm_id:standard_id:version"
        self._current_feed_standard: dict = {}   # key: "farm_id:standard_id" -> version

        # Optimization
        self._optimization_requests: dict = {}
        self._feed_decisions: dict = {}
        self._request_decision_map: dict = {}    # request_id -> decision_id
        self._human_feed_reviews: dict = {}
        self._activated_feed_plans: dict = {}

        # Ration hash registry
        self._approved_ration_hashes: dict = {}
        self._blocked_ration_hashes: dict = {}

        # Audit
        self._audit_logs: dict = {}
        self._audit_counter: int = 0

        # Indexes
        self._farm_index: list = []
        self._farm_advisor_index: dict = {}      # farm_id -> [advisor_id]
        self._farm_batch_index: dict = {}        # farm_id -> [batch_id]
        self._farm_ingredient_index: dict = {}   # farm_id -> [ingredient_id]
        self._farm_feed_standard_index: dict = {}  # farm_id -> [standard_id]
        self._feed_standard_version_index: dict = {}  # "farm_id:standard_id" -> [version]
        self._farm_request_index: dict = {}      # farm_id -> [request_id]
        self._batch_request_index: dict = {}     # batch_id -> [request_id]
        self._advisor_request_index: dict = {}   # advisor_id -> [request_id]
        self._request_audit_index: dict = {}     # request_id -> [audit_id]
        self._reviewer_reputation: dict = {}     # "farm_id:wallet" -> rep dict

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _sender(self) -> str:
        return gl.message.sender_address

    def _require_owner(self):
        assert self._sender() == self._owner, "Only owner"

    def _require_not_paused(self):
        assert not self._paused, "Contract is paused"

    def _require_non_empty(self, value: str, field: str):
        assert value and value.strip(), f"{field} must not be empty"

    def _key(self, *parts) -> str:
        return ":".join(str(p) for p in parts)

    def _append_to(self, index: dict, key: str, value: str):
        if key not in index:
            index[key] = []
        if value not in index[key]:
            index[key].append(value)

    def _next_audit_id(self) -> str:
        self._audit_counter += 1
        return f"aud_{self._audit_counter:06d}"

    def _record_audit(self, farm_id: str, request_id: str, event_type: str,
                      actor: str, summary: str, data_hash: str = ""):
        audit_id = self._next_audit_id()
        log = AuditLog(
            audit_id=audit_id,
            farm_id=farm_id,
            request_id=request_id,
            event_type=event_type,
            actor=actor,
            summary=summary,
            data_hash=data_hash,
            logged_at=datetime.now(timezone.utc).isoformat(),
        )
        self._audit_logs[audit_id] = json.dumps(log.to_dict())
        self._append_to(self._request_audit_index, request_id, audit_id)
        return audit_id

    def _require_farm(self, farm_id: str):
        assert farm_id in self._farms, f"Farm not found: {farm_id}"

    def _require_advisor(self, advisor_id: str):
        assert advisor_id in self._feed_advisors, f"Advisor not found: {advisor_id}"

    def _require_batch(self, batch_id: str):
        assert batch_id in self._livestock_batches, f"Batch not found: {batch_id}"

    def _require_ingredient(self, ingredient_id: str):
        assert ingredient_id in self._feed_ingredients, f"Ingredient not found: {ingredient_id}"

    def _is_farm_owner_or_admin(self, farm_id: str, wallet: str) -> bool:
        role_key = self._key(farm_id, wallet)
        if role_key in self._farm_roles:
            return self._farm_roles[role_key] in ("owner", "admin")
        farm = json.loads(self._farms[farm_id])
        return farm["owner"] == wallet

    def _bounded_score(self, v) -> int:
        try:
            return max(0, min(100, int(v)))
        except Exception:
            return 0

    def _safe_str(self, v, default="") -> str:
        return str(v) if v is not None else default

    # ------------------------------------------------------------------
    # GenLayer AI consensus — core of the product
    # ------------------------------------------------------------------

    def _run_consensus_feed_review(self, request: OptimizationRequest) -> dict:
        """
        Submit the feed optimization request to GenLayer validators.
        Validators run an AI model to evaluate the ration against standards.
        """
        farm = json.loads(self._farms[request.farm_id]) if request.farm_id in self._farms else {}
        batch = json.loads(self._livestock_batches[request.batch_id]) if request.batch_id in self._livestock_batches else {}

        # Collect standards
        standard_summaries = []
        for sid in (request.standard_ids_csv or "").split(","):
            sid = sid.strip()
            cur_ver = self._current_feed_standard.get(self._key(request.farm_id, sid), "")
            if cur_ver:
                vk = self._key(request.farm_id, sid, cur_ver)
                if vk in self._feed_standard_versions:
                    sv = json.loads(self._feed_standard_versions[vk])
                    standard_summaries.append(
                        f"Standard {sid} v{cur_ver}: nutrient targets={sv.get('nutrient_target_rules','')}, "
                        f"ingredient limits={sv.get('ingredient_limit_rules','')}, "
                        f"toxin rules={sv.get('toxin_and_anti_nutrient_rules','')}"
                    )

        # Collect ingredients
        ingredient_summaries = []
        for iid in (request.ingredient_ids_csv or "").split(","):
            iid = iid.strip()
            if iid in self._feed_ingredients:
                ing = json.loads(self._feed_ingredients[iid])
                ingredient_summaries.append(
                    f"{ing.get('name', iid)}: nutrients={ing.get('nutrient_profile_summary','')}, "
                    f"safety={ing.get('safety_summary','')}, cost={ing.get('cost_summary','')}, "
                    f"availability={ing.get('availability_summary','')}"
                )

        prompt = f"""You are an expert livestock nutritionist and feed optimization specialist.

Evaluate the following feed optimization request and provide a detailed verdict.

FARM: {farm.get('name', request.farm_id)} ({farm.get('farm_type', '')}, {farm.get('location_context', '')})

LIVESTOCK BATCH:
- Species: {batch.get('species', '')}
- Breed: {batch.get('breed_summary', '')}
- Production Stage: {batch.get('production_stage', '')}
- Production Goal: {batch.get('production_goal', '')}
- Head Count: {batch.get('head_count', '')}
- Weight: {batch.get('weight_summary', '')}
- Health Status: {batch.get('health_status_summary', '')}
- Feeding Constraints: {batch.get('feeding_constraints', '')}

OPTIMIZATION OBJECTIVE: {request.objective_summary}
CURRENT FEEDING PATTERN: {request.current_feeding_summary}
AVAILABLE FEED MATERIALS: {request.available_feed_summary}
CANDIDATE RATION: {request.candidate_ration_summary}
NUTRIENT ANALYSIS: {request.nutrient_analysis_summary}
COST CONSTRAINTS: {request.cost_constraint_summary}
SUPPLY CONSTRAINTS: {request.supply_constraint_summary}
HEALTH CONTEXT: {request.health_context_summary}
ENVIRONMENT CONTEXT: {request.environment_context_summary}

FEED STANDARDS APPLICABLE:
{chr(10).join(standard_summaries) if standard_summaries else 'No standards specified — use best practice.'}

AVAILABLE INGREDIENTS:
{chr(10).join(ingredient_summaries) if ingredient_summaries else 'No ingredients specified — optimize from objective.'}

EVALUATION TASK:
1. Assess nutritional adequacy for the species/stage/goal
2. Check ingredient safety and anti-nutrient risks
3. Evaluate cost efficiency against constraints
4. Assess ingredient availability and supply feasibility
5. Review alignment with production goals
6. Generate a recommended ration with mixing instructions
7. Identify nutrient gaps, excess risks, and health warnings
8. Provide practical daily feeding instructions
9. Create a transition plan if the diet change is significant
10. Rate confidence and assign a risk band

RESPONSE FORMAT (JSON only, no extra text):
{{
  "verdict": "APPROVED|REJECTED|NEEDS_REVIEW|NEEDS_REVISION",
  "nutrient_adequacy_score": 0-100,
  "livestock_suitability_score": 0-100,
  "safety_score": 0-100,
  "cost_efficiency_score": 0-100,
  "availability_score": 0-100,
  "production_goal_alignment_score": 0-100,
  "explainability_score": 0-100,
  "practicality_score": 0-100,
  "risk_score": 0-100,
  "risk_band": "LOW|MEDIUM|HIGH|CRITICAL",
  "reviewer_required": true|false,
  "revision_required": true|false,
  "recommended_ration_summary": "...",
  "ingredient_mix_summary": "...",
  "daily_feeding_summary": "...",
  "transition_plan_summary": "...",
  "nutrient_gaps": ["..."],
  "excess_risks": ["..."],
  "ingredient_risks": ["..."],
  "health_warnings": ["..."],
  "cost_findings": ["..."],
  "availability_findings": ["..."],
  "required_changes": ["..."],
  "strengths": ["..."],
  "feeding_instructions": "...",
  "monitoring_notes": "...",
  "rationale": "...",
  "audit_summary": "...",
  "confidence": 0-100
}}"""

        result = gl.exec_prompt(prompt)
        # Parse JSON response
        try:
            text = str(result).strip()
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except Exception:
            pass
        # Fallback
        return {
            "verdict": "NEEDS_REVIEW",
            "nutrient_adequacy_score": 0,
            "livestock_suitability_score": 0,
            "safety_score": 0,
            "cost_efficiency_score": 0,
            "availability_score": 0,
            "production_goal_alignment_score": 0,
            "explainability_score": 0,
            "practicality_score": 0,
            "risk_score": 50,
            "risk_band": "MEDIUM",
            "reviewer_required": True,
            "revision_required": False,
            "recommended_ration_summary": "AI consensus inconclusive — manual review required.",
            "ingredient_mix_summary": "",
            "daily_feeding_summary": "",
            "transition_plan_summary": "",
            "nutrient_gaps": [],
            "excess_risks": [],
            "ingredient_risks": [],
            "health_warnings": ["Unable to complete AI evaluation — manual review required."],
            "cost_findings": [],
            "availability_findings": [],
            "required_changes": [],
            "strengths": [],
            "feeding_instructions": "",
            "monitoring_notes": "",
            "rationale": "AI consensus could not parse result.",
            "audit_summary": "Fallback verdict due to AI parse error.",
            "confidence": 0,
        }

    def _adjudicate(self, request_id: str, adjudicated_at: str) -> dict:
        req_data = json.loads(self._optimization_requests[request_id])
        request = OptimizationRequest(**{k: req_data[k] for k in OptimizationRequest.__init__.__code__.co_varnames[1:] if k in req_data})

        ai = self._run_consensus_feed_review(request)

        verdict = str(ai.get("verdict", "NEEDS_REVIEW")).upper()
        if verdict not in ("APPROVED", "REJECTED", "NEEDS_REVIEW", "NEEDS_REVISION"):
            verdict = "NEEDS_REVIEW"

        decision_id = f"dec_{request_id}"
        decision = FeedDecision(
            decision_id=decision_id,
            request_id=request_id,
            verdict=verdict,
            nutrient_adequacy_score=self._bounded_score(ai.get("nutrient_adequacy_score", 0)),
            livestock_suitability_score=self._bounded_score(ai.get("livestock_suitability_score", 0)),
            safety_score=self._bounded_score(ai.get("safety_score", 0)),
            cost_efficiency_score=self._bounded_score(ai.get("cost_efficiency_score", 0)),
            availability_score=self._bounded_score(ai.get("availability_score", 0)),
            production_goal_alignment_score=self._bounded_score(ai.get("production_goal_alignment_score", 0)),
            explainability_score=self._bounded_score(ai.get("explainability_score", 0)),
            practicality_score=self._bounded_score(ai.get("practicality_score", 0)),
            risk_score=self._bounded_score(ai.get("risk_score", 50)),
            risk_band=str(ai.get("risk_band", "MEDIUM")).upper(),
            reviewer_required=bool(ai.get("reviewer_required", False)),
            revision_required=bool(ai.get("revision_required", False)),
            recommended_ration_summary=self._safe_str(ai.get("recommended_ration_summary")),
            ingredient_mix_summary=self._safe_str(ai.get("ingredient_mix_summary")),
            daily_feeding_summary=self._safe_str(ai.get("daily_feeding_summary")),
            transition_plan_summary=self._safe_str(ai.get("transition_plan_summary")),
            nutrient_gaps=ai.get("nutrient_gaps", []),
            excess_risks=ai.get("excess_risks", []),
            ingredient_risks=ai.get("ingredient_risks", []),
            health_warnings=ai.get("health_warnings", []),
            cost_findings=ai.get("cost_findings", []),
            availability_findings=ai.get("availability_findings", []),
            required_changes=ai.get("required_changes", []),
            strengths=ai.get("strengths", []),
            feeding_instructions=self._safe_str(ai.get("feeding_instructions")),
            monitoring_notes=self._safe_str(ai.get("monitoring_notes")),
            rationale=self._safe_str(ai.get("rationale")),
            audit_summary=self._safe_str(ai.get("audit_summary")),
            confidence=self._bounded_score(ai.get("confidence", 0)),
            adjudicated_at=adjudicated_at,
        )

        self._feed_decisions[decision_id] = json.dumps(decision.to_dict())
        self._request_decision_map[request_id] = decision_id

        # Update request status
        req_data["last_decision_id"] = decision_id
        if verdict == "APPROVED":
            req_data["status"] = "APPROVED"
            self._approved_ration_hashes[req_data.get("ration_hash", "")] = request_id
        elif verdict == "REJECTED":
            req_data["status"] = "REJECTED"
            self._blocked_ration_hashes[req_data.get("ration_hash", "")] = request_id
        elif verdict == "NEEDS_REVIEW":
            req_data["status"] = "NEEDS_REVIEW"
        elif verdict == "NEEDS_REVISION":
            req_data["status"] = "NEEDS_REVISION"

        self._optimization_requests[request_id] = json.dumps(req_data)

        # Audit
        self._record_audit(
            farm_id=req_data["farm_id"],
            request_id=request_id,
            event_type="FEED_OPTIMIZATION_ADJUDICATED",
            actor="genlayer_consensus",
            summary=f"Verdict: {verdict} | Risk: {decision.risk_band} | Confidence: {decision.confidence}%",
            data_hash=decision_id,
        )

        return decision.to_dict()

    # ------------------------------------------------------------------
    # Admin
    # ------------------------------------------------------------------

    @gl.public.view
    def get_owner(self) -> str:
        return self._owner

    @gl.public.view
    def is_paused(self) -> bool:
        return self._paused

    @gl.public.view
    def get_contract_summary(self) -> str:
        return json.dumps({
            "owner": self._owner,
            "paused": self._paused,
            "total_farms": len(self._farm_index),
            "total_advisors": len(self._feed_advisors),
            "total_batches": len(self._livestock_batches),
            "total_ingredients": len(self._feed_ingredients),
            "total_requests": len(self._optimization_requests),
            "total_decisions": len(self._feed_decisions),
            "total_activated_plans": len(self._activated_feed_plans),
            "total_human_reviews": len(self._human_feed_reviews),
            "version": "0.3.0",
        })

    @gl.public.write
    def pause(self):
        self._require_owner()
        self._paused = True

    @gl.public.write
    def unpause(self):
        self._require_owner()
        self._paused = False

    @gl.public.write
    def transfer_ownership(self, new_owner: str, updated_at: str):
        self._require_owner()
        self._require_non_empty(new_owner, "new_owner")
        old = self._owner
        self._owner = new_owner
        self._record_audit("", "", "OWNERSHIP_TRANSFERRED", old, f"New owner: {new_owner}")

    # ------------------------------------------------------------------
    # Farm
    # ------------------------------------------------------------------

    @gl.public.write
    def create_farm(self, farm_id: str, name: str, farm_type: str, location_context: str,
                    metadata_hash: str, created_at: str):
        self._require_not_paused()
        self._require_non_empty(farm_id, "farm_id")
        self._require_non_empty(name, "name")
        assert farm_id not in self._farms, f"Farm already exists: {farm_id}"

        farm = Farm(
            farm_id=farm_id, name=name, farm_type=farm_type,
            location_context=location_context, owner=self._sender(),
            metadata_hash=metadata_hash, status="ACTIVE", created_at=created_at,
        )
        self._farms[farm_id] = json.dumps(farm.to_dict())
        if farm_id not in self._farm_index:
            self._farm_index.append(farm_id)
        self._record_audit(farm_id, "", "FARM_CREATED", self._sender(), f"Farm created: {name}")

    @gl.public.write
    def add_farm_role(self, farm_id: str, wallet: str, role: str, added_at: str):
        self._require_not_paused()
        self._require_farm(farm_id)
        assert role in ("owner", "admin", "manager", "reviewer", "viewer"), f"Invalid role: {role}"
        key = self._key(farm_id, wallet)
        self._farm_roles[key] = role
        self._record_audit(farm_id, "", "FARM_ROLE_ADDED", self._sender(), f"{wallet} -> {role}")

    @gl.public.write
    def remove_farm_role(self, farm_id: str, wallet: str, removed_at: str):
        self._require_not_paused()
        self._require_farm(farm_id)
        key = self._key(farm_id, wallet)
        if key in self._farm_roles:
            del self._farm_roles[key]
        self._record_audit(farm_id, "", "FARM_ROLE_REMOVED", self._sender(), f"Role removed: {wallet}")

    @gl.public.write
    def set_farm_status(self, farm_id: str, status: str, updated_at: str):
        self._require_not_paused()
        self._require_farm(farm_id)
        assert status in ("ACTIVE", "INACTIVE", "SUSPENDED"), f"Invalid status: {status}"
        farm = json.loads(self._farms[farm_id])
        farm["status"] = status
        farm["updated_at"] = updated_at
        self._farms[farm_id] = json.dumps(farm)

    @gl.public.write
    def set_farm_optimization_config(self, farm_id: str, config_json: str, updated_at: str):
        self._require_not_paused()
        self._require_farm(farm_id)
        farm = json.loads(self._farms[farm_id])
        farm["optimization_config"] = json.loads(config_json) if config_json else {}
        farm["updated_at"] = updated_at
        self._farms[farm_id] = json.dumps(farm)

    @gl.public.view
    def get_farm(self, farm_id: str) -> str:
        self._require_farm(farm_id)
        return self._farms[farm_id]

    @gl.public.view
    def get_farm_role(self, farm_id: str, wallet: str) -> str:
        key = self._key(farm_id, wallet)
        return self._farm_roles.get(key, "none")

    @gl.public.view
    def get_farm_index(self) -> str:
        return "|".join(self._farm_index)

    # ------------------------------------------------------------------
    # Feed Advisor
    # ------------------------------------------------------------------

    @gl.public.write
    def register_feed_advisor(self, advisor_id: str, farm_id: str, name: str,
                               credential_summary: str, scope_summary: str, wallet: str,
                               metadata_hash: str, registered_at: str):
        self._require_not_paused()
        self._require_non_empty(advisor_id, "advisor_id")
        self._require_farm(farm_id)
        assert advisor_id not in self._feed_advisors, f"Advisor already exists: {advisor_id}"

        advisor = FeedAdvisor(
            advisor_id=advisor_id, farm_id=farm_id, name=name,
            credential_summary=credential_summary, scope_summary=scope_summary,
            wallet=wallet, metadata_hash=metadata_hash, status="ACTIVE",
            registered_at=registered_at,
        )
        self._feed_advisors[advisor_id] = json.dumps(advisor.to_dict())
        self._append_to(self._farm_advisor_index, farm_id, advisor_id)
        self._record_audit(farm_id, "", "ADVISOR_REGISTERED", self._sender(), f"Advisor: {name}")

    @gl.public.write
    def set_feed_advisor_status(self, advisor_id: str, status: str, updated_at: str):
        self._require_not_paused()
        self._require_advisor(advisor_id)
        assert status in ("ACTIVE", "INACTIVE", "SUSPENDED"), f"Invalid status: {status}"
        advisor = json.loads(self._feed_advisors[advisor_id])
        advisor["status"] = status
        advisor["updated_at"] = updated_at
        self._feed_advisors[advisor_id] = json.dumps(advisor)

    @gl.public.view
    def get_feed_advisor(self, advisor_id: str) -> str:
        self._require_advisor(advisor_id)
        return self._feed_advisors[advisor_id]

    @gl.public.view
    def get_farm_advisor_index(self, farm_id: str) -> str:
        return "|".join(self._farm_advisor_index.get(farm_id, []))

    # ------------------------------------------------------------------
    # Livestock Batch
    # ------------------------------------------------------------------

    @gl.public.write
    def register_livestock_batch(self, batch_id: str, farm_id: str, species: str,
                                  breed_summary: str, production_stage: str, production_goal: str,
                                  head_count: int, weight_summary: str, health_status_summary: str,
                                  feeding_constraints: str, metadata_hash: str, registered_at: str):
        self._require_not_paused()
        self._require_non_empty(batch_id, "batch_id")
        self._require_farm(farm_id)
        assert batch_id not in self._livestock_batches, f"Batch already exists: {batch_id}"

        batch = LivestockBatch(
            batch_id=batch_id, farm_id=farm_id, species=species,
            breed_summary=breed_summary, production_stage=production_stage,
            production_goal=production_goal, head_count=head_count,
            weight_summary=weight_summary, health_status_summary=health_status_summary,
            feeding_constraints=feeding_constraints, metadata_hash=metadata_hash,
            status="ACTIVE", registered_at=registered_at,
        )
        self._livestock_batches[batch_id] = json.dumps(batch.to_dict())
        self._append_to(self._farm_batch_index, farm_id, batch_id)
        self._record_audit(farm_id, "", "BATCH_REGISTERED", self._sender(), f"Batch: {species} ({production_stage})")

    @gl.public.write
    def update_livestock_batch_summary(self, batch_id: str, production_goal: str,
                                        weight_summary: str, health_status_summary: str,
                                        feeding_constraints: str, updated_at: str):
        self._require_not_paused()
        self._require_batch(batch_id)
        batch = json.loads(self._livestock_batches[batch_id])
        batch["production_goal"] = production_goal
        batch["weight_summary"] = weight_summary
        batch["health_status_summary"] = health_status_summary
        batch["feeding_constraints"] = feeding_constraints
        batch["updated_at"] = updated_at
        self._livestock_batches[batch_id] = json.dumps(batch)

    @gl.public.write
    def set_livestock_batch_status(self, batch_id: str, status: str, updated_at: str):
        self._require_not_paused()
        self._require_batch(batch_id)
        assert status in ("ACTIVE", "INACTIVE", "CULLED"), f"Invalid status: {status}"
        batch = json.loads(self._livestock_batches[batch_id])
        batch["status"] = status
        batch["updated_at"] = updated_at
        self._livestock_batches[batch_id] = json.dumps(batch)

    @gl.public.view
    def get_livestock_batch(self, batch_id: str) -> str:
        self._require_batch(batch_id)
        return self._livestock_batches[batch_id]

    @gl.public.view
    def get_farm_batch_index(self, farm_id: str) -> str:
        return "|".join(self._farm_batch_index.get(farm_id, []))

    # ------------------------------------------------------------------
    # Feed Ingredient
    # ------------------------------------------------------------------

    @gl.public.write
    def register_feed_ingredient(self, ingredient_id: str, farm_id: str, name: str,
                                  category: str, nutrient_profile_summary: str,
                                  safety_summary: str, availability_summary: str,
                                  cost_summary: str, metadata_hash: str, registered_at: str):
        self._require_not_paused()
        self._require_non_empty(ingredient_id, "ingredient_id")
        self._require_farm(farm_id)
        assert ingredient_id not in self._feed_ingredients, f"Ingredient already exists: {ingredient_id}"

        ing = FeedIngredient(
            ingredient_id=ingredient_id, farm_id=farm_id, name=name, category=category,
            nutrient_profile_summary=nutrient_profile_summary, safety_summary=safety_summary,
            availability_summary=availability_summary, cost_summary=cost_summary,
            metadata_hash=metadata_hash, status="ACTIVE", registered_at=registered_at,
        )
        self._feed_ingredients[ingredient_id] = json.dumps(ing.to_dict())
        self._append_to(self._farm_ingredient_index, farm_id, ingredient_id)
        self._record_audit(farm_id, "", "INGREDIENT_REGISTERED", self._sender(), f"Ingredient: {name}")

    @gl.public.write
    def update_feed_ingredient(self, ingredient_id: str, nutrient_profile_summary: str,
                                safety_summary: str, availability_summary: str,
                                cost_summary: str, updated_at: str):
        self._require_not_paused()
        self._require_ingredient(ingredient_id)
        ing = json.loads(self._feed_ingredients[ingredient_id])
        ing["nutrient_profile_summary"] = nutrient_profile_summary
        ing["safety_summary"] = safety_summary
        ing["availability_summary"] = availability_summary
        ing["cost_summary"] = cost_summary
        ing["updated_at"] = updated_at
        self._feed_ingredients[ingredient_id] = json.dumps(ing)

    @gl.public.write
    def set_feed_ingredient_status(self, ingredient_id: str, status: str, updated_at: str):
        self._require_not_paused()
        self._require_ingredient(ingredient_id)
        assert status in ("ACTIVE", "INACTIVE", "RECALLED"), f"Invalid status: {status}"
        ing = json.loads(self._feed_ingredients[ingredient_id])
        ing["status"] = status
        ing["updated_at"] = updated_at
        self._feed_ingredients[ingredient_id] = json.dumps(ing)

    @gl.public.view
    def get_feed_ingredient(self, ingredient_id: str) -> str:
        self._require_ingredient(ingredient_id)
        return self._feed_ingredients[ingredient_id]

    @gl.public.view
    def get_farm_ingredient_index(self, farm_id: str) -> str:
        return "|".join(self._farm_ingredient_index.get(farm_id, []))

    # ------------------------------------------------------------------
    # Feed Standard
    # ------------------------------------------------------------------

    @gl.public.write
    def publish_feed_standard_version(self, farm_id: str, standard_id: str, version: str,
                                       title: str, species_scope: str, production_stage_scope: str,
                                       severity: str, nutrient_target_rules: str,
                                       ingredient_limit_rules: str, toxin_and_anti_nutrient_rules: str,
                                       health_escalation_rules: str, cost_and_availability_rules: str,
                                       standard_hash: str, metadata_hash: str, published_at: str):
        self._require_not_paused()
        self._require_farm(farm_id)
        vk = self._key(farm_id, standard_id, version)
        assert vk not in self._feed_standard_versions, "Standard version already exists"

        sv = FeedStandardVersion(
            farm_id=farm_id, standard_id=standard_id, version=version, title=title,
            species_scope=species_scope, production_stage_scope=production_stage_scope,
            severity=severity, nutrient_target_rules=nutrient_target_rules,
            ingredient_limit_rules=ingredient_limit_rules,
            toxin_and_anti_nutrient_rules=toxin_and_anti_nutrient_rules,
            health_escalation_rules=health_escalation_rules,
            cost_and_availability_rules=cost_and_availability_rules,
            standard_hash=standard_hash, metadata_hash=metadata_hash,
            status="DRAFT", published_at=published_at,
        )
        self._feed_standard_versions[vk] = json.dumps(sv.to_dict())
        self._append_to(self._farm_feed_standard_index, farm_id, standard_id)
        vi_key = self._key(farm_id, standard_id)
        self._append_to(self._feed_standard_version_index, vi_key, version)
        self._record_audit(farm_id, "", "FEED_STANDARD_PUBLISHED", self._sender(),
                           f"Standard {standard_id} v{version}: {title}")

    @gl.public.write
    def set_current_feed_standard_version(self, farm_id: str, standard_id: str,
                                           version: str, updated_at: str):
        self._require_not_paused()
        self._require_farm(farm_id)
        vk = self._key(farm_id, standard_id, version)
        assert vk in self._feed_standard_versions, "Standard version not found"
        cur_key = self._key(farm_id, standard_id)
        # Unmark old current
        old_ver = self._current_feed_standard.get(cur_key)
        if old_ver:
            old_vk = self._key(farm_id, standard_id, old_ver)
            if old_vk in self._feed_standard_versions:
                sv = json.loads(self._feed_standard_versions[old_vk])
                sv["is_current"] = False
                self._feed_standard_versions[old_vk] = json.dumps(sv)
        # Mark new current
        self._current_feed_standard[cur_key] = version
        sv = json.loads(self._feed_standard_versions[vk])
        sv["is_current"] = True
        sv["status"] = "ACTIVE"
        sv["updated_at"] = updated_at
        self._feed_standard_versions[vk] = json.dumps(sv)

    @gl.public.write
    def set_feed_standard_version_status(self, farm_id: str, standard_id: str,
                                          version: str, status: str, updated_at: str):
        self._require_not_paused()
        vk = self._key(farm_id, standard_id, version)
        assert vk in self._feed_standard_versions, "Standard version not found"
        assert status in ("DRAFT", "ACTIVE", "DEPRECATED", "REVOKED"), f"Invalid status: {status}"
        sv = json.loads(self._feed_standard_versions[vk])
        sv["status"] = status
        sv["updated_at"] = updated_at
        self._feed_standard_versions[vk] = json.dumps(sv)

    @gl.public.view
    def get_feed_standard_version(self, farm_id: str, standard_id: str, version: str) -> str:
        vk = self._key(farm_id, standard_id, version)
        assert vk in self._feed_standard_versions, "Standard version not found"
        return self._feed_standard_versions[vk]

    @gl.public.view
    def get_current_feed_standard_version(self, farm_id: str, standard_id: str) -> str:
        return self._current_feed_standard.get(self._key(farm_id, standard_id), "")

    @gl.public.view
    def get_farm_feed_standard_index(self, farm_id: str) -> str:
        return "|".join(self._farm_feed_standard_index.get(farm_id, []))

    @gl.public.view
    def get_feed_standard_version_index(self, farm_id: str, standard_id: str) -> str:
        return "|".join(self._feed_standard_version_index.get(self._key(farm_id, standard_id), []))

    # ------------------------------------------------------------------
    # Optimization
    # ------------------------------------------------------------------

    @gl.public.write
    def submit_feed_optimization_request(self, request_id: str, farm_id: str, batch_id: str,
                                          advisor_id: str, standard_ids_csv: str,
                                          ingredient_ids_csv: str, objective_summary: str,
                                          current_feeding_summary: str, available_feed_summary: str,
                                          candidate_ration_summary: str, nutrient_analysis_summary: str,
                                          cost_constraint_summary: str, supply_constraint_summary: str,
                                          health_context_summary: str, environment_context_summary: str,
                                          evidence_manifest_hash: str, ration_hash: str,
                                          submitted_at: str, expires_at: str):
        self._require_not_paused()
        self._require_non_empty(request_id, "request_id")
        self._require_farm(farm_id)
        self._require_batch(batch_id)
        assert request_id not in self._optimization_requests, f"Request exists: {request_id}"

        req = OptimizationRequest(
            request_id=request_id, farm_id=farm_id, batch_id=batch_id,
            advisor_id=advisor_id, standard_ids_csv=standard_ids_csv,
            ingredient_ids_csv=ingredient_ids_csv, objective_summary=objective_summary,
            current_feeding_summary=current_feeding_summary,
            available_feed_summary=available_feed_summary,
            candidate_ration_summary=candidate_ration_summary,
            nutrient_analysis_summary=nutrient_analysis_summary,
            cost_constraint_summary=cost_constraint_summary,
            supply_constraint_summary=supply_constraint_summary,
            health_context_summary=health_context_summary,
            environment_context_summary=environment_context_summary,
            evidence_manifest_hash=evidence_manifest_hash,
            ration_hash=ration_hash, submitted_at=submitted_at, expires_at=expires_at,
        )
        self._optimization_requests[request_id] = json.dumps(req.to_dict())
        self._append_to(self._farm_request_index, farm_id, request_id)
        self._append_to(self._batch_request_index, batch_id, request_id)
        if advisor_id:
            self._append_to(self._advisor_request_index, advisor_id, request_id)
        self._record_audit(farm_id, request_id, "OPTIMIZATION_REQUEST_SUBMITTED",
                           self._sender(), f"Request {request_id} submitted")

    @gl.public.write
    def adjudicate_feed_optimization(self, request_id: str, adjudicated_at: str) -> dict:
        self._require_not_paused()
        assert request_id in self._optimization_requests, f"Request not found: {request_id}"
        req = json.loads(self._optimization_requests[request_id])
        assert req["status"] == "PENDING", f"Request not pending: {req['status']}"
        return self._adjudicate(request_id, adjudicated_at)

    @gl.public.write
    def submit_and_optimize_feed(self, request_id: str, farm_id: str, batch_id: str,
                                  advisor_id: str, standard_ids_csv: str,
                                  ingredient_ids_csv: str, objective_summary: str,
                                  current_feeding_summary: str, available_feed_summary: str,
                                  candidate_ration_summary: str, nutrient_analysis_summary: str,
                                  cost_constraint_summary: str, supply_constraint_summary: str,
                                  health_context_summary: str, environment_context_summary: str,
                                  evidence_manifest_hash: str, ration_hash: str,
                                  submitted_at: str, expires_at: str,
                                  adjudicated_at: str) -> dict:
        self._require_not_paused()
        self._require_non_empty(request_id, "request_id")
        self._require_farm(farm_id)
        self._require_batch(batch_id)
        assert request_id not in self._optimization_requests, f"Request exists: {request_id}"

        req = OptimizationRequest(
            request_id=request_id, farm_id=farm_id, batch_id=batch_id,
            advisor_id=advisor_id, standard_ids_csv=standard_ids_csv,
            ingredient_ids_csv=ingredient_ids_csv, objective_summary=objective_summary,
            current_feeding_summary=current_feeding_summary,
            available_feed_summary=available_feed_summary,
            candidate_ration_summary=candidate_ration_summary,
            nutrient_analysis_summary=nutrient_analysis_summary,
            cost_constraint_summary=cost_constraint_summary,
            supply_constraint_summary=supply_constraint_summary,
            health_context_summary=health_context_summary,
            environment_context_summary=environment_context_summary,
            evidence_manifest_hash=evidence_manifest_hash,
            ration_hash=ration_hash, submitted_at=submitted_at, expires_at=expires_at,
        )
        self._optimization_requests[request_id] = json.dumps(req.to_dict())
        self._append_to(self._farm_request_index, farm_id, request_id)
        self._append_to(self._batch_request_index, batch_id, request_id)
        if advisor_id:
            self._append_to(self._advisor_request_index, advisor_id, request_id)
        self._record_audit(farm_id, request_id, "OPTIMIZATION_REQUEST_SUBMITTED",
                           self._sender(), f"Request {request_id} submitted for consensus")

        return self._adjudicate(request_id, adjudicated_at)

    @gl.public.view
    def get_feed_optimization_request(self, request_id: str) -> str:
        assert request_id in self._optimization_requests, f"Request not found: {request_id}"
        return self._optimization_requests[request_id]

    @gl.public.view
    def get_request_decision_id(self, request_id: str) -> str:
        return self._request_decision_map.get(request_id, "")

    @gl.public.view
    def get_decision(self, decision_id: str) -> str:
        assert decision_id in self._feed_decisions, f"Decision not found: {decision_id}"
        return self._feed_decisions[decision_id]

    @gl.public.view
    def get_latest_decision_for_request(self, request_id: str) -> str:
        dec_id = self._request_decision_map.get(request_id, "")
        if not dec_id:
            return json.dumps({})
        return self._feed_decisions.get(dec_id, json.dumps({}))

    # ------------------------------------------------------------------
    # Human review & activation
    # ------------------------------------------------------------------

    @gl.public.write
    def human_feed_review_decision(self, request_id: str, final_verdict: str,
                                    review_reason: str, review_evidence_hash: str,
                                    reviewer_notes: str, decided_at: str):
        self._require_not_paused()
        assert request_id in self._optimization_requests, "Request not found"
        assert final_verdict in ("APPROVED", "REJECTED", "NEEDS_REVISION"), f"Invalid verdict: {final_verdict}"

        review = HumanFeedReview(
            request_id=request_id, reviewer_wallet=self._sender(),
            final_verdict=final_verdict, review_reason=review_reason,
            review_evidence_hash=review_evidence_hash, reviewer_notes=reviewer_notes,
            decided_at=decided_at,
        )
        self._human_feed_reviews[request_id] = json.dumps(review.to_dict())

        req = json.loads(self._optimization_requests[request_id])
        if final_verdict == "APPROVED":
            req["status"] = "HUMAN_APPROVED"
        elif final_verdict == "REJECTED":
            req["status"] = "HUMAN_REJECTED"
        elif final_verdict == "NEEDS_REVISION":
            req["status"] = "NEEDS_REVISION"
        req["human_decided_at"] = decided_at
        self._optimization_requests[request_id] = json.dumps(req)

        self._record_audit(
            req["farm_id"], request_id, "HUMAN_REVIEW_SUBMITTED",
            self._sender(), f"Human verdict: {final_verdict}",
        )

    @gl.public.write
    def mark_feed_plan_activated(self, request_id: str, activation_hash: str,
                                  activation_summary: str, activated_at: str):
        self._require_not_paused()
        assert request_id in self._optimization_requests, "Request not found"
        req = json.loads(self._optimization_requests[request_id])
        assert req["status"] in ("APPROVED", "HUMAN_APPROVED"), "Feed plan not approved"

        plan = ActivatedFeedPlan(
            request_id=request_id, activated_by=self._sender(),
            activation_hash=activation_hash, activation_summary=activation_summary,
            activated_at=activated_at,
        )
        self._activated_feed_plans[request_id] = json.dumps(plan.to_dict())
        req["status"] = "ACTIVATED"
        req["activated_at"] = activated_at
        self._optimization_requests[request_id] = json.dumps(req)
        self._record_audit(req["farm_id"], request_id, "FEED_PLAN_ACTIVATED",
                           self._sender(), f"Feed plan activated: {activation_summary[:80]}")

    @gl.public.write
    def mark_feed_plan_blocked(self, request_id: str, block_reason: str, blocked_at: str):
        self._require_not_paused()
        assert request_id in self._optimization_requests, "Request not found"
        req = json.loads(self._optimization_requests[request_id])
        req["status"] = "BLOCKED"
        req["blocked_at"] = blocked_at
        self._optimization_requests[request_id] = json.dumps(req)
        self._record_audit(req["farm_id"], request_id, "FEED_PLAN_BLOCKED",
                           self._sender(), f"Blocked: {block_reason}")

    @gl.public.view
    def get_human_review(self, request_id: str) -> str:
        return self._human_feed_reviews.get(request_id, json.dumps({}))

    @gl.public.view
    def get_activated_feed_plan(self, request_id: str) -> str:
        return self._activated_feed_plans.get(request_id, json.dumps({}))

    @gl.public.view
    def get_escalation(self, request_id: str) -> str:
        req = self._optimization_requests.get(request_id, "")
        if not req:
            return json.dumps({})
        r = json.loads(req)
        if r.get("status") in ("NEEDS_REVIEW", "NEEDS_REVISION"):
            dec_id = self._request_decision_map.get(request_id, "")
            return json.dumps({
                "request_id": request_id,
                "status": r["status"],
                "decision_id": dec_id,
                "farm_id": r.get("farm_id", ""),
            })
        return json.dumps({})

    # ------------------------------------------------------------------
    # Audit
    # ------------------------------------------------------------------

    @gl.public.view
    def get_audit_log(self, audit_id: str) -> str:
        return self._audit_logs.get(audit_id, json.dumps({}))

    @gl.public.view
    def get_request_audit_index(self, request_id: str) -> str:
        return "|".join(self._request_audit_index.get(request_id, []))

    @gl.public.view
    def get_farm_request_index(self, farm_id: str) -> str:
        return "|".join(self._farm_request_index.get(farm_id, []))

    @gl.public.view
    def get_batch_request_index(self, batch_id: str) -> str:
        return "|".join(self._batch_request_index.get(batch_id, []))

    @gl.public.view
    def get_advisor_request_index(self, advisor_id: str) -> str:
        return "|".join(self._advisor_request_index.get(advisor_id, []))

    @gl.public.view
    def get_reviewer_reputation(self, farm_id: str, reviewer_wallet: str) -> str:
        key = self._key(farm_id, reviewer_wallet)
        return json.dumps(self._reviewer_reputation.get(key, {
            "farm_id": farm_id,
            "reviewer_wallet": reviewer_wallet,
            "total_reviews": 0,
            "approved_count": 0,
            "rejected_count": 0,
            "revision_count": 0,
            "reputation_score": 100,
        }))

    @gl.public.view
    def is_ration_hash_approved(self, ration_hash: str) -> str:
        return self._approved_ration_hashes.get(ration_hash, "")

    @gl.public.view
    def is_ration_hash_blocked(self, ration_hash: str) -> str:
        return self._blocked_ration_hashes.get(ration_hash, "")
