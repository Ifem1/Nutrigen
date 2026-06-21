-- Nutrigen Supabase Schema
-- Mirror of NutrigenContract state for fast UI queries
-- Supabase never overrides contract decisions — contract is source of truth

-- =========================================================
-- Auth profiles
-- =========================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  wallet_address text,
  encrypted_private_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles_self" on profiles for all using (auth.uid() = id);

-- =========================================================
-- Farms
-- =========================================================
create table if not exists farms (
  id text primary key,                    -- matches contract farm_id
  name text not null,
  farm_type text,
  location_context text,
  owner_wallet text,
  metadata_hash text,
  status text default 'ACTIVE',
  optimization_config jsonb default '{}',
  -- on-chain tracking
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  -- supabase user link
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table farms enable row level security;
create policy "farms_all" on farms for all using (true);

-- =========================================================
-- Farm roles
-- =========================================================
create table if not exists farm_roles (
  id uuid primary key default gen_random_uuid(),
  farm_id text references farms(id) on delete cascade,
  wallet text not null,
  role text not null,
  tx_hash text,
  created_at timestamptz default now(),
  unique(farm_id, wallet)
);
alter table farm_roles enable row level security;
create policy "farm_roles_all" on farm_roles for all using (true);

-- =========================================================
-- Feed advisors
-- =========================================================
create table if not exists feed_advisors (
  id text primary key,                    -- matches contract advisor_id
  farm_id text references farms(id),
  name text not null,
  credential_summary text,
  scope_summary text,
  wallet text,
  metadata_hash text,
  status text default 'ACTIVE',
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table feed_advisors enable row level security;
create policy "feed_advisors_all" on feed_advisors for all using (true);

-- =========================================================
-- Livestock batches
-- =========================================================
create table if not exists livestock_batches (
  id text primary key,                    -- matches contract batch_id
  farm_id text references farms(id),
  species text not null,
  breed_summary text,
  production_stage text,
  production_goal text,
  head_count int,
  weight_summary text,
  health_status_summary text,
  feeding_constraints text,
  metadata_hash text,
  status text default 'ACTIVE',
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table livestock_batches enable row level security;
create policy "livestock_batches_all" on livestock_batches for all using (true);

-- =========================================================
-- Feed ingredients
-- =========================================================
create table if not exists feed_ingredients (
  id text primary key,                    -- matches contract ingredient_id
  farm_id text references farms(id),
  name text not null,
  category text,
  nutrient_profile_summary text,
  safety_summary text,
  availability_summary text,
  cost_summary text,
  metadata_hash text,
  status text default 'ACTIVE',
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table feed_ingredients enable row level security;
create policy "feed_ingredients_all" on feed_ingredients for all using (true);

-- =========================================================
-- Feed standard versions
-- =========================================================
create table if not exists feed_standard_versions (
  id uuid primary key default gen_random_uuid(),
  farm_id text references farms(id),
  standard_id text not null,
  version text not null,
  title text,
  species_scope text,
  production_stage_scope text,
  severity text,
  nutrient_target_rules text,
  ingredient_limit_rules text,
  toxin_and_anti_nutrient_rules text,
  health_escalation_rules text,
  cost_and_availability_rules text,
  standard_hash text,
  metadata_hash text,
  status text default 'DRAFT',
  is_current boolean default false,
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  created_by uuid references profiles(id),
  published_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(farm_id, standard_id, version)
);
alter table feed_standard_versions enable row level security;
create policy "feed_standard_versions_all" on feed_standard_versions for all using (true);

-- =========================================================
-- Feed optimization requests
-- =========================================================
create table if not exists feed_optimization_requests (
  id text primary key,                    -- matches contract request_id
  farm_id text references farms(id),
  batch_id text references livestock_batches(id),
  advisor_id text references feed_advisors(id),
  standard_ids_csv text,
  ingredient_ids_csv text,
  objective_summary text,
  current_feeding_summary text,
  available_feed_summary text,
  candidate_ration_summary text,
  nutrient_analysis_summary text,
  cost_constraint_summary text,
  supply_constraint_summary text,
  health_context_summary text,
  environment_context_summary text,
  evidence_manifest_hash text,
  ration_hash text,
  status text default 'PENDING',
  last_decision_id text,
  human_decided_at timestamptz,
  activated_at timestamptz,
  blocked_at timestamptz,
  submitted_at timestamptz default now(),
  expires_at timestamptz,
  -- on-chain tracking
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table feed_optimization_requests enable row level security;
create policy "feed_optimization_requests_all" on feed_optimization_requests for all using (true);

-- =========================================================
-- Feed decisions (GenLayer consensus verdicts)
-- =========================================================
create table if not exists feed_decisions (
  id text primary key,                    -- matches contract decision_id
  request_id text references feed_optimization_requests(id),
  verdict text,
  nutrient_adequacy_score int,
  livestock_suitability_score int,
  safety_score int,
  cost_efficiency_score int,
  availability_score int,
  production_goal_alignment_score int,
  explainability_score int,
  practicality_score int,
  risk_score int,
  risk_band text,
  reviewer_required boolean,
  revision_required boolean,
  recommended_ration_summary text,
  ingredient_mix_summary text,
  daily_feeding_summary text,
  transition_plan_summary text,
  nutrient_gaps jsonb,
  excess_risks jsonb,
  ingredient_risks jsonb,
  health_warnings jsonb,
  cost_findings jsonb,
  availability_findings jsonb,
  required_changes jsonb,
  strengths jsonb,
  feeding_instructions text,
  monitoring_notes text,
  rationale text,
  audit_summary text,
  confidence int,
  adjudicated_at timestamptz,
  -- on-chain tracking
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  sync_status text default 'synced',
  raw_contract_json jsonb,
  created_at timestamptz default now()
);
alter table feed_decisions enable row level security;
create policy "feed_decisions_all" on feed_decisions for all using (true);

-- =========================================================
-- Human feed reviews
-- =========================================================
create table if not exists human_feed_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id text references feed_optimization_requests(id),
  reviewer_wallet text,
  final_verdict text,
  review_reason text,
  review_evidence_hash text,
  reviewer_notes text,
  decided_at timestamptz,
  tx_hash text,
  explorer_url text,
  created_at timestamptz default now()
);
alter table human_feed_reviews enable row level security;
create policy "human_feed_reviews_all" on human_feed_reviews for all using (true);

-- =========================================================
-- Activated feed plans
-- =========================================================
create table if not exists activated_feed_plans (
  id uuid primary key default gen_random_uuid(),
  request_id text references feed_optimization_requests(id) unique,
  activated_by text,
  activation_hash text,
  activation_summary text,
  activated_at timestamptz,
  tx_hash text,
  explorer_url text,
  created_at timestamptz default now()
);
alter table activated_feed_plans enable row level security;
create policy "activated_feed_plans_all" on activated_feed_plans for all using (true);

-- =========================================================
-- Audit events
-- =========================================================
create table if not exists audit_events (
  id text primary key,                    -- matches contract audit_id
  farm_id text,
  request_id text,
  event_type text,
  actor text,
  summary text,
  data_hash text,
  logged_at timestamptz,
  -- on-chain tracking
  contract_address text,
  chain_id int default 61999,
  tx_hash text,
  explorer_url text,
  created_at timestamptz default now()
);
alter table audit_events enable row level security;
create policy "audit_events_all" on audit_events for all using (true);

-- =========================================================
-- Contract transactions log
-- =========================================================
create table if not exists contract_transactions (
  id uuid primary key default gen_random_uuid(),
  method text not null,
  args jsonb,
  tx_hash text,
  status text,
  result jsonb,
  error text,
  explorer_url text,
  chain_id int default 61999,
  wallet_address text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table contract_transactions enable row level security;
create policy "contract_transactions_all" on contract_transactions for all using (true);

-- =========================================================
-- Evidence manifests
-- =========================================================
create table if not exists evidence_manifests (
  id uuid primary key default gen_random_uuid(),
  request_id text references feed_optimization_requests(id),
  manifest_hash text,
  file_urls jsonb default '[]',
  description text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table evidence_manifests enable row level security;
create policy "evidence_manifests_all" on evidence_manifests for all using (true);
