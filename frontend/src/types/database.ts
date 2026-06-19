export type UserRole = 'owner' | 'admin' | 'manager' | 'viewer';
export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type OptimizationStatus = 'pending' | 'proposing' | 'committing' | 'revealing' | 'accepted' | 'rejected' | 'undetermined' | 'escalated' | 'finalized';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EscalationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'resubmitted';
export type PolicyStatus = 'draft' | 'active' | 'archived';
export type LivestockType = 'cattle_beef' | 'cattle_dairy' | 'poultry_broiler' | 'poultry_layer' | 'swine' | 'sheep' | 'goat' | 'fish_tilapia' | 'fish_catfish' | 'other';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  max_agents: number;
  max_optimizations_per_day: number;
  compliance_threshold: number;
  risk_alert_threshold: RiskLevel;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  address: string;
  encrypted_private_key: string;
  encryption_salt: string;
  encryption_iv: string;
  key_derivation_iterations: number;
  is_primary: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  agent_type: string;
  status: AgentStatus;
  api_key_hash: string | null;
  capabilities: string[];
  config: Record<string, unknown>;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  last_active_at: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  livestock_type: LivestockType;
  status: PolicyStatus;
  version: number;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyRule {
  id: string;
  policy_id: string;
  rule_name: string;
  rule_category: string;
  parameter: string;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  tolerance_percent: number;
  is_mandatory: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OptimizationRequest {
  id: string;
  organization_id: string;
  agent_id: string | null;
  policy_id: string | null;
  requested_by: string;
  status: OptimizationStatus;
  livestock_type: LivestockType;
  breed: string;
  herd_size: number;
  avg_weight_kg: number | null;
  target_weight_kg: number | null;
  growth_stage: string | null;
  location_country: string | null;
  location_region: string | null;
  temperature_celsius: number | null;
  humidity_percent: number | null;
  season: string | null;
  weather_conditions: string | null;
  available_forages: string[];
  forage_quality_score: number | null;
  budget_per_head_per_day: number | null;
  currency: string;
  max_feed_cost_per_kg: number | null;
  tx_hash: string | null;
  contract_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedRatios {
  [ingredient: string]: number;
}

export interface OptimizationResult {
  id: string;
  request_id: string;
  organization_id: string;
  feed_ratios: FeedRatios;
  crude_protein_percent: number | null;
  metabolizable_energy_kcal: number | null;
  crude_fiber_percent: number | null;
  calcium_percent: number | null;
  phosphorus_percent: number | null;
  lysine_percent: number | null;
  methionine_percent: number | null;
  fat_percent: number | null;
  projected_daily_gain_kg: number | null;
  projected_feed_conversion_ratio: number | null;
  projected_days_to_target: number | null;
  estimated_cost_per_kg_gain: number | null;
  total_daily_cost_per_head: number | null;
  welfare_score: number | null;
  welfare_notes: string | null;
  consensus_status: string | null;
  consensus_tx_hash: string | null;
  validator_count: number | null;
  agreement_percentage: number | null;
  leader_address: string | null;
  consensus_duration_ms: number | null;
  justification: string | null;
  data_sources: string[];
  created_at: string;
}

export interface Validation {
  id: string;
  request_id: string;
  result_id: string | null;
  organization_id: string;
  policy_id: string | null;
  compliance_score: number | null;
  rules_total: number;
  rules_passed: number;
  rules_failed: number;
  rule_violations: RuleViolation[];
  intent_alignment_score: number | null;
  intent_notes: string | null;
  safety_score: number | null;
  safety_flags: string[];
  overall_pass: boolean;
  validation_type: string;
  created_at: string;
}

export interface RuleViolation {
  rule_id: string;
  parameter: string;
  expected_min: number | null;
  expected_max: number | null;
  actual: number;
}

export interface RiskScore {
  id: string;
  request_id: string;
  organization_id: string;
  overall_score: number;
  risk_level: RiskLevel;
  nutritional_risk: number;
  cost_risk: number;
  welfare_risk: number;
  consensus_risk: number;
  market_risk: number;
  factors: string[];
  recommendations: string[];
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  tx_hash: string | null;
  created_at: string;
}

export interface Escalation {
  id: string;
  organization_id: string;
  request_id: string;
  result_id: string | null;
  validation_id: string | null;
  status: EscalationStatus;
  reason: string;
  priority: RiskLevel;
  assigned_to: string | null;
  triggered_by: string;
  trigger_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ValidatorReputation {
  id: string;
  validator_address: string;
  total_validations: number;
  agreements: number;
  disagreements: number;
  agreement_rate: number;
  avg_execution_time_ms: number;
  reputation_score: number;
  last_validation_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  organization_id: string | null;
  title: string;
  message: string;
  type: string;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
}
