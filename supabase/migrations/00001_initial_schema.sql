-- ============================================================
-- NUTRIGEN: Feed Optimization & Growth Projection
-- Complete Database Schema
-- ============================================================

-- ======================== EXTENSIONS ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================== ENUMS ========================

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'viewer');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE optimization_status AS ENUM ('pending', 'proposing', 'committing', 'revealing', 'accepted', 'rejected', 'undetermined', 'escalated', 'finalized');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE escalation_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'resubmitted');
CREATE TYPE policy_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE livestock_type AS ENUM ('cattle_beef', 'cattle_dairy', 'poultry_broiler', 'poultry_layer', 'swine', 'sheep', 'goat', 'fish_tilapia', 'fish_catfish', 'other');
CREATE TYPE audit_action AS ENUM (
  'optimization_submitted', 'optimization_completed', 'optimization_failed',
  'policy_created', 'policy_updated', 'policy_archived',
  'agent_registered', 'agent_updated', 'agent_suspended',
  'escalation_created', 'escalation_resolved',
  'user_joined', 'user_role_changed',
  'wallet_created', 'wallet_exported',
  'consensus_accepted', 'consensus_rejected', 'consensus_undetermined'
);

-- ======================== ORGANIZATIONS ========================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  max_agents INTEGER DEFAULT 10,
  max_optimizations_per_day INTEGER DEFAULT 100,
  compliance_threshold NUMERIC(5,2) DEFAULT 80.00,
  risk_alert_threshold risk_level DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ======================== USERS ========================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role user_role DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ======================== USER WALLETS ========================

CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  key_derivation_iterations INTEGER DEFAULT 100000,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address)
);

CREATE INDEX idx_wallets_user ON user_wallets(user_id);
CREATE INDEX idx_wallets_address ON user_wallets(address);

-- ======================== AGENTS ========================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'feed_optimizer',
  status agent_status DEFAULT 'pending',
  api_key_hash TEXT,
  capabilities JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  registered_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(status);

-- ======================== POLICIES ========================

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  livestock_type livestock_type NOT NULL,
  status policy_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policies_org ON policies(organization_id);
CREATE INDEX idx_policies_livestock ON policies(livestock_type);
CREATE INDEX idx_policies_status ON policies(status);

-- ======================== POLICY VERSIONS ========================

CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(policy_id, version)
);

CREATE INDEX idx_policy_versions_policy ON policy_versions(policy_id);

-- ======================== POLICY RULES ========================

CREATE TABLE policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_category TEXT NOT NULL, -- 'nutritional', 'cost', 'welfare', 'growth', 'environmental'
  parameter TEXT NOT NULL,     -- 'crude_protein', 'metabolizable_energy', 'cost_per_kg', etc.
  min_value NUMERIC(12,4),
  max_value NUMERIC(12,4),
  unit TEXT,                   -- '%', 'kcal/kg', '$/kg', 'score', 'kg/day'
  tolerance_percent NUMERIC(5,2) DEFAULT 5.00,
  is_mandatory BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policy_rules_policy ON policy_rules(policy_id);
CREATE INDEX idx_policy_rules_category ON policy_rules(rule_category);

-- ======================== OPTIMIZATION REQUESTS ========================

CREATE TABLE optimization_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  policy_id UUID REFERENCES policies(id),
  requested_by UUID NOT NULL REFERENCES users(id),
  status optimization_status DEFAULT 'pending',

  -- Input parameters
  livestock_type livestock_type NOT NULL,
  breed TEXT NOT NULL,
  herd_size INTEGER NOT NULL,
  avg_weight_kg NUMERIC(8,2),
  target_weight_kg NUMERIC(8,2),
  growth_stage TEXT, -- 'starter', 'grower', 'finisher', 'maintenance', 'lactation'

  -- Environmental context
  location_country TEXT,
  location_region TEXT,
  temperature_celsius NUMERIC(5,2),
  humidity_percent NUMERIC(5,2),
  season TEXT,
  weather_conditions TEXT,

  -- Forage context
  available_forages JSONB DEFAULT '[]',
  forage_quality_score NUMERIC(3,1),

  -- Budget context
  budget_per_head_per_day NUMERIC(10,4),
  currency TEXT DEFAULT 'USD',
  max_feed_cost_per_kg NUMERIC(10,4),

  -- GenLayer
  tx_hash TEXT,
  contract_request_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opt_requests_org ON optimization_requests(organization_id);
CREATE INDEX idx_opt_requests_status ON optimization_requests(status);
CREATE INDEX idx_opt_requests_user ON optimization_requests(requested_by);
CREATE INDEX idx_opt_requests_created ON optimization_requests(created_at DESC);
CREATE INDEX idx_opt_requests_tx ON optimization_requests(tx_hash);

-- ======================== OPTIMIZATION RESULTS ========================

CREATE TABLE optimization_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES optimization_requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Feed recommendation
  feed_ratios JSONB NOT NULL DEFAULT '{}',
  -- Example: { "corn": 45, "soybean_meal": 25, "wheat_bran": 10, "mineral_premix": 3, "forage": 17 }

  -- Nutritional profile
  crude_protein_percent NUMERIC(5,2),
  metabolizable_energy_kcal NUMERIC(8,2),
  crude_fiber_percent NUMERIC(5,2),
  calcium_percent NUMERIC(5,3),
  phosphorus_percent NUMERIC(5,3),
  lysine_percent NUMERIC(5,3),
  methionine_percent NUMERIC(5,3),
  fat_percent NUMERIC(5,2),

  -- Projections
  projected_daily_gain_kg NUMERIC(6,3),
  projected_feed_conversion_ratio NUMERIC(6,3),
  projected_days_to_target NUMERIC(6,1),
  estimated_cost_per_kg_gain NUMERIC(10,4),
  total_daily_cost_per_head NUMERIC(10,4),

  -- Welfare
  welfare_score NUMERIC(4,2), -- 0-10 scale
  welfare_notes TEXT,

  -- Consensus metadata
  consensus_status TEXT, -- 'ACCEPTED', 'REJECTED', 'UNDETERMINED'
  consensus_tx_hash TEXT,
  validator_count INTEGER,
  agreement_percentage NUMERIC(5,2),
  leader_address TEXT,
  consensus_duration_ms INTEGER,

  -- Justification
  justification TEXT,
  data_sources JSONB DEFAULT '[]',
  -- Example: ["openweathermap.org", "indexmundi.com/commodities", "nrc.gov"]

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opt_results_request ON optimization_results(request_id);
CREATE INDEX idx_opt_results_org ON optimization_results(organization_id);
CREATE INDEX idx_opt_results_consensus ON optimization_results(consensus_status);

-- ======================== VALIDATIONS ========================

CREATE TABLE validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES optimization_requests(id) ON DELETE CASCADE,
  result_id UUID REFERENCES optimization_results(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Policy compliance
  policy_id UUID REFERENCES policies(id),
  compliance_score NUMERIC(5,2), -- 0-100
  rules_total INTEGER DEFAULT 0,
  rules_passed INTEGER DEFAULT 0,
  rules_failed INTEGER DEFAULT 0,
  rule_violations JSONB DEFAULT '[]',
  -- Example: [{"rule_id": "...", "parameter": "crude_protein", "expected_min": 18, "actual": 15.5}]

  -- Intent alignment
  intent_alignment_score NUMERIC(5,2), -- 0-100
  intent_notes TEXT,

  -- Safety
  safety_score NUMERIC(5,2), -- 0-100
  safety_flags JSONB DEFAULT '[]',

  -- Overall
  overall_pass BOOLEAN DEFAULT FALSE,
  validation_type TEXT DEFAULT 'automated', -- 'automated', 'human', 'hybrid'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validations_request ON validations(request_id);
CREATE INDEX idx_validations_org ON validations(organization_id);
CREATE INDEX idx_validations_pass ON validations(overall_pass);

-- ======================== VALIDATOR VOTES ========================

CREATE TABLE validator_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  validation_id UUID NOT NULL REFERENCES validations(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES optimization_requests(id) ON DELETE CASCADE,
  validator_address TEXT NOT NULL,
  vote_result BOOLEAN NOT NULL, -- true = agree, false = disagree
  reasoning TEXT,
  data_fetched JSONB DEFAULT '{}',
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_validation ON validator_votes(validation_id);
CREATE INDEX idx_votes_validator ON validator_votes(validator_address);

-- ======================== RISK SCORES ========================

CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES optimization_requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  overall_score NUMERIC(5,2) NOT NULL, -- 0-100
  risk_level risk_level NOT NULL,

  -- Component scores
  nutritional_risk NUMERIC(5,2) DEFAULT 0,
  cost_risk NUMERIC(5,2) DEFAULT 0,
  welfare_risk NUMERIC(5,2) DEFAULT 0,
  consensus_risk NUMERIC(5,2) DEFAULT 0,
  market_risk NUMERIC(5,2) DEFAULT 0,

  factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_org ON risk_scores(organization_id);
CREATE INDEX idx_risk_level ON risk_scores(risk_level);
CREATE INDEX idx_risk_created ON risk_scores(created_at DESC);

-- ======================== AUDIT LOGS ========================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action audit_action NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  tx_hash TEXT, -- GenLayer transaction hash if applicable
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);

-- ======================== ESCALATIONS ========================

CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES optimization_requests(id) ON DELETE CASCADE,
  result_id UUID REFERENCES optimization_results(id),
  validation_id UUID REFERENCES validations(id),

  status escalation_status DEFAULT 'pending',
  reason TEXT NOT NULL,
  priority risk_level DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),

  triggered_by TEXT NOT NULL, -- 'compliance_failure', 'risk_threshold', 'undetermined_consensus', 'manual'
  trigger_details JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_escalations_org ON escalations(organization_id);
CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_escalations_assigned ON escalations(assigned_to);

-- ======================== ESCALATION RESPONSES ========================

CREATE TABLE escalation_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escalation_id UUID NOT NULL REFERENCES escalations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL, -- 'approve', 'reject', 'modify', 're_evaluate'
  notes TEXT,
  modified_parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_esc_responses_escalation ON escalation_responses(escalation_id);

-- ======================== COMPLIANCE METRICS ========================

CREATE TABLE compliance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  compliant_requests INTEGER DEFAULT 0,
  compliance_rate NUMERIC(5,2) DEFAULT 0,
  avg_risk_score NUMERIC(5,2) DEFAULT 0,
  total_escalations INTEGER DEFAULT 0,
  resolved_escalations INTEGER DEFAULT 0,
  avg_consensus_agreement NUMERIC(5,2) DEFAULT 0,
  cost_savings_estimate NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, period_start, period_end)
);

CREATE INDEX idx_compliance_org ON compliance_metrics(organization_id);

-- ======================== VALIDATOR REPUTATION ========================

CREATE TABLE validator_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  validator_address TEXT NOT NULL UNIQUE,
  total_validations INTEGER DEFAULT 0,
  agreements INTEGER DEFAULT 0,
  disagreements INTEGER DEFAULT 0,
  agreement_rate NUMERIC(5,2) DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,
  reputation_score NUMERIC(5,2) DEFAULT 50.00, -- 0-100
  last_validation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validator_address ON validator_reputation(validator_address);
CREATE INDEX idx_validator_score ON validator_reputation(reputation_score DESC);

-- ======================== NOTIFICATIONS ========================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'optimization_complete', 'escalation', 'risk_alert', 'system'
  resource_type TEXT,
  resource_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ======================== FUNCTIONS ========================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policies_updated BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policy_rules_updated BEFORE UPDATE ON policy_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_opt_requests_updated BEFORE UPDATE ON optimization_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_escalations_updated BEFORE UPDATE ON escalations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_validator_reputation_updated BEFORE UPDATE ON validator_reputation FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Compute daily compliance metrics
CREATE OR REPLACE FUNCTION compute_daily_compliance(org_id UUID, target_date DATE)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_compliant INTEGER;
  v_avg_risk NUMERIC;
  v_total_esc INTEGER;
  v_resolved_esc INTEGER;
  v_avg_consensus NUMERIC;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('accepted', 'finalized')),
    COALESCE(AVG(rs.overall_score), 0)
  INTO v_total, v_compliant, v_avg_risk
  FROM optimization_requests oq
  LEFT JOIN risk_scores rs ON rs.request_id = oq.id
  WHERE oq.organization_id = org_id
    AND oq.created_at::date = target_date;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('approved', 'rejected'))
  INTO v_total_esc, v_resolved_esc
  FROM escalations
  WHERE organization_id = org_id
    AND created_at::date = target_date;

  SELECT COALESCE(AVG(agreement_percentage), 0)
  INTO v_avg_consensus
  FROM optimization_results
  WHERE organization_id = org_id
    AND created_at::date = target_date;

  INSERT INTO compliance_metrics (
    organization_id, period_start, period_end,
    total_requests, compliant_requests, compliance_rate,
    avg_risk_score, total_escalations, resolved_escalations,
    avg_consensus_agreement
  ) VALUES (
    org_id, target_date, target_date,
    v_total, v_compliant,
    CASE WHEN v_total > 0 THEN (v_compliant::NUMERIC / v_total) * 100 ELSE 0 END,
    v_avg_risk, v_total_esc, v_resolved_esc,
    v_avg_consensus
  )
  ON CONFLICT (organization_id, period_start, period_end)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    compliant_requests = EXCLUDED.compliant_requests,
    compliance_rate = EXCLUDED.compliance_rate,
    avg_risk_score = EXCLUDED.avg_risk_score,
    total_escalations = EXCLUDED.total_escalations,
    resolved_escalations = EXCLUDED.resolved_escalations,
    avg_consensus_agreement = EXCLUDED.avg_consensus_agreement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================== ROW LEVEL SECURITY ========================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can read their own org
CREATE POLICY "Users read own org" ON organizations FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "Admins update own org" ON organizations FOR UPDATE USING (id = get_user_org_id() AND get_user_role() IN ('owner', 'admin'));

-- Users: can read org members, update own profile
CREATE POLICY "Users read org members" ON users FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "New users insert own record" ON users FOR INSERT WITH CHECK (id = auth.uid());

-- Wallets: users can only access own wallets
CREATE POLICY "Users read own wallets" ON user_wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own wallets" ON user_wallets FOR INSERT WITH CHECK (user_id = auth.uid());

-- Agents: org-scoped
CREATE POLICY "Users read org agents" ON agents FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Managers manage agents" ON agents FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));
CREATE POLICY "Managers update agents" ON agents FOR UPDATE USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));
CREATE POLICY "Admins delete agents" ON agents FOR DELETE USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin'));

-- Policies: org-scoped
CREATE POLICY "Users read org policies" ON policies FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Managers manage policies" ON policies FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));
CREATE POLICY "Managers update policies" ON policies FOR UPDATE USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Policy Versions: via policy org
CREATE POLICY "Users read policy versions" ON policy_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM policies p WHERE p.id = policy_id AND p.organization_id = get_user_org_id()));
CREATE POLICY "Managers insert policy versions" ON policy_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM policies p WHERE p.id = policy_id AND p.organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager')));

-- Policy Rules: via policy org
CREATE POLICY "Users read policy rules" ON policy_rules FOR SELECT
  USING (EXISTS (SELECT 1 FROM policies p WHERE p.id = policy_id AND p.organization_id = get_user_org_id()));
CREATE POLICY "Managers manage policy rules" ON policy_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM policies p WHERE p.id = policy_id AND p.organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager')));

-- Optimization Requests: org-scoped
CREATE POLICY "Users read org requests" ON optimization_requests FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users create requests" ON optimization_requests FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND requested_by = auth.uid());
CREATE POLICY "System update requests" ON optimization_requests FOR UPDATE USING (organization_id = get_user_org_id());

-- Optimization Results: org-scoped
CREATE POLICY "Users read org results" ON optimization_results FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "System insert results" ON optimization_results FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- Validations: org-scoped
CREATE POLICY "Users read org validations" ON validations FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "System insert validations" ON validations FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- Validator Votes: via validation
CREATE POLICY "Users read votes" ON validator_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM validations v WHERE v.id = validation_id AND v.organization_id = get_user_org_id()));
CREATE POLICY "System insert votes" ON validator_votes FOR INSERT WITH CHECK (TRUE);

-- Risk Scores: org-scoped
CREATE POLICY "Users read org risk" ON risk_scores FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "System insert risk" ON risk_scores FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- Audit Logs: org-scoped, read-only for users
CREATE POLICY "Users read org audit" ON audit_logs FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "System insert audit" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- Escalations: org-scoped
CREATE POLICY "Users read org escalations" ON escalations FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "System create escalations" ON escalations FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Admins update escalations" ON escalations FOR UPDATE USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Escalation Responses
CREATE POLICY "Users read org esc responses" ON escalation_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM escalations e WHERE e.id = escalation_id AND e.organization_id = get_user_org_id()));
CREATE POLICY "Admins insert esc responses" ON escalation_responses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM escalations e WHERE e.id = escalation_id AND e.organization_id = get_user_org_id()) AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Compliance Metrics: org-scoped
CREATE POLICY "Users read org compliance" ON compliance_metrics FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "System insert compliance" ON compliance_metrics FOR INSERT WITH CHECK (TRUE);

-- Validator Reputation: public read
CREATE POLICY "Anyone read validator rep" ON validator_reputation FOR SELECT USING (TRUE);
CREATE POLICY "System manage validator rep" ON validator_reputation FOR ALL USING (TRUE);

-- Notifications: user-scoped
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON notifications FOR INSERT WITH CHECK (TRUE);

-- ======================== REALTIME SUBSCRIPTIONS ========================

ALTER PUBLICATION supabase_realtime ADD TABLE optimization_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE optimization_results;
ALTER PUBLICATION supabase_realtime ADD TABLE escalations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ======================== SEED DATA: DEFAULT POLICIES ========================

-- These will be inserted per-organization during onboarding
-- Stored here as reference templates

COMMENT ON TABLE policy_rules IS 'Common parameters:
  Nutritional: crude_protein (%), metabolizable_energy (kcal/kg), crude_fiber (%), calcium (%), phosphorus (%), lysine (%), methionine (%), fat (%)
  Cost: cost_per_kg ($/kg), daily_cost_per_head ($/day), cost_per_kg_gain ($/kg)
  Welfare: welfare_score (0-10), heat_stress_index (0-100)
  Growth: daily_weight_gain (kg/day), feed_conversion_ratio (ratio), days_to_market (days)
  Environmental: water_usage_liters (L/day), carbon_footprint_kg (kg CO2/day)';
