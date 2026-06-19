export * from './database';

export interface OptimizationFormData {
  livestock_type: import('./database').LivestockType;
  breed: string;
  herd_size: number;
  avg_weight_kg: number;
  target_weight_kg: number;
  growth_stage: string;
  location_country: string;
  location_region: string;
  temperature_celsius: number;
  humidity_percent: number;
  season: string;
  weather_conditions: string;
  available_forages: string[];
  forage_quality_score: number;
  budget_per_head_per_day: number;
  currency: string;
  max_feed_cost_per_kg: number;
  policy_id: string;
  agent_id?: string;
}

export interface DashboardStats {
  total_optimizations: number;
  compliance_rate: number;
  avg_risk_score: number;
  active_agents: number;
  pending_escalations: number;
  cost_savings: number;
}

export interface ConsensusDetail {
  request_id: string;
  status: string;
  validator_count: number;
  agreement_percentage: number;
  leader_address: string;
  votes: {
    validator_address: string;
    vote_result: boolean;
    reasoning: string;
  }[];
  duration_ms: number;
}
