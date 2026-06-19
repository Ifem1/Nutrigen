-- Migration 00002: Livestock feed optimization schema
-- Mirrors NutrigenContract v0.2.18 on-chain data for fast UI queries

-- ── Farms ────────────────────────────────────────────────

create table if not exists farms (
  id                 text primary key,          -- contract farm_id
  name               text not null,
  farm_type          text,
  location_context   text,
  metadata_hash      text,
  status             text not null default 'ACTIVE',
  created_by_wallet  text,
  created_at         timestamptz,
  updated_at         timestamptz default now(),
  supabase_user_id   uuid references auth.users(id) on delete set null,
  raw_json           jsonb
);

-- ── Farm roles ───────────────────────────────────────────

create table if not exists farm_roles (
  farm_id  text not null references farms(id) on delete cascade,
  wallet   text not null,
  role     text not null,
  added_at timestamptz,
  primary key (farm_id, wallet)
);

-- ── Feed advisors ────────────────────────────────────────

create table if not exists feed_advisors (
  id                 text primary key,          -- contract advisor_id
  farm_id            text not null references farms(id) on delete cascade,
  name               text not null,
  credential_summary text,
  scope_summary      text,
  wallet             text,
  metadata_hash      text,
  status             text not null default 'ACTIVE',
  registered_by      text,
  registered_at      timestamptz,
  updated_at         timestamptz default now(),
  raw_json           jsonb
);

-- ── Livestock batches ────────────────────────────────────

create table if not exists livestock_batches (
  id                    text primary key,        -- contract batch_id
  farm_id               text not null references farms(id) on delete cascade,
  species               text not null,
  breed_summary         text,
  production_stage      text,
  production_goal       text,
  head_count            text,
  weight_summary        text,
  health_status_summary text,
  feeding_constraints   text,
  metadata_hash         text,
  status                text not null default 'ACTIVE',
  registered_by         text,
  registered_at         timestamptz,
  updated_at            timestamptz default now(),
  raw_json              jsonb
);

-- ── Feed ingredients ─────────────────────────────────────

create table if not exists feed_ingredients (
  id                       text primary key,     -- contract ingredient_id
  farm_id                  text not null references farms(id) on delete cascade,
  name                     text not null,
  category                 text,
  nutrient_profile_summary text,
  safety_summary           text,
  availability_summary     text,
  cost_summary             text,
  metadata_hash            text,
  status                   text not null default 'ACTIVE',
  registered_by            text,
  registered_at            timestamptz,
  updated_at               timestamptz default now(),
  raw_json                 jsonb
);

-- ── Feed standard versions ───────────────────────────────

create table if not exists feed_standard_versions (
  farm_id                      text not null references farms(id) on delete cascade,
  standard_id                  text not null,
  version                      text not null,
  title                        text,
  species_scope                text,
  production_stage_scope       text,
  severity                     text,
  nutrient_target_rules        text,
  ingredient_limit_rules       text,
  toxin_and_anti_nutrient_rules text,
  health_escalation_rules      text,
  cost_and_availability_rules  text,
  standard_hash                text,
  metadata_hash                text,
  status                       text not null default 'ACTIVE',
  is_current                   boolean default false,
  published_by                 text,
  published_at                 timestamptz,
  updated_at                   timestamptz default now(),
  raw_json                     jsonb,
  primary key (farm_id, standard_id, version)
);

-- ── Optimization requests ────────────────────────────────

create table if not exists optimization_requests (
  id                        text primary key,    -- contract request_id
  farm_id                   text not null references farms(id) on delete cascade,
  batch_id                  text not null references livestock_batches(id) on delete cascade,
  advisor_id                text not null references feed_advisors(id) on delete cascade,
  standard_ids_csv          text,
  ingredient_ids_csv        text,
  objective_summary         text,
  current_feeding_summary   text,
  available_feed_summary    text,
  candidate_ration_summary  text,
  nutrient_analysis_summary text,
  cost_constraint_summary   text,
  supply_constraint_summary text,
  health_context_summary    text,
  environment_context_summary text,
  evidence_manifest_hash    text,
  ration_hash               text,
  submitted_by              text,
  submitted_at              timestamptz,
  expires_at                timestamptz,
  status                    text not null default 'PENDING',
  last_decision_id          text,
  adjudicated_at            timestamptz,
  human_decided_at          timestamptz,
  activated_at              timestamptz,
  blocked_at                timestamptz,
  tx_hash                   text,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),
  raw_json                  jsonb
);

-- ── Feed decisions (GenLayer consensus results) ──────────

create table if not exists feed_decisions (
  id                     text primary key,       -- contract decision_id
  request_id             text not null references optimization_requests(id) on delete cascade,
  farm_id                text not null,
  batch_id               text not null,
  advisor_id             text not null,
  verdict                text not null,
  request_status         text not null,
  nutrient_adequacy_score     int,
  livestock_suitability_score int,
  safety_score                int,
  cost_efficiency_score       int,
  availability_score          int,
  production_goal_alignment_score int,
  explainability_score        int,
  practicality_score          int,
  risk_score                  int,
  risk_band              text,
  reviewer_required      boolean default false,
  revision_required      boolean default false,
  recommended_ration_summary text,
  ingredient_mix_summary     text,
  daily_feeding_summary      text,
  transition_plan_summary    text,
  rationale              text,
  audit_summary          text,
  confidence             int,
  adjudicated_by         text,
  adjudicated_at         timestamptz,
  created_at             timestamptz default now(),
  raw_json               jsonb
);

-- ── Escalations ──────────────────────────────────────────

create table if not exists escalations (
  request_id   text primary key references optimization_requests(id) on delete cascade,
  farm_id      text not null,
  escalation_id text,
  decision_id  text,
  status       text not null default 'OPEN',
  reason       text,
  opened_at    timestamptz,
  opened_by    text,
  closed_by    text,
  closed_at    timestamptz,
  close_reason text,
  raw_json     jsonb
);

-- ── Human feed reviews ───────────────────────────────────

create table if not exists human_feed_reviews (
  request_id           text primary key references optimization_requests(id) on delete cascade,
  human_review_id      text,
  farm_id              text not null,
  reviewer             text,
  final_verdict        text not null,
  request_status       text not null,
  review_reason        text,
  review_evidence_hash text,
  reviewer_notes       text,
  decided_at           timestamptz,
  raw_json             jsonb
);

-- ── Activated feed plans ─────────────────────────────────

create table if not exists activated_feed_plans (
  request_id        text primary key references optimization_requests(id) on delete cascade,
  activation_id     text,
  farm_id           text not null,
  batch_id          text not null,
  advisor_id        text not null,
  activation_hash   text,
  activation_summary text,
  activated_by      text,
  activated_at      timestamptz,
  raw_json          jsonb
);

-- ── Audit events ─────────────────────────────────────────

create table if not exists audit_events (
  id          text primary key,              -- contract audit_id
  farm_id     text,
  request_id  text,
  event_type  text not null,
  actor       text,
  summary     text,
  data_hash   text,
  created_at  timestamptz,
  synced_at   timestamptz default now(),
  raw_json    jsonb
);

-- ── Indexes ──────────────────────────────────────────────

create index if not exists idx_farms_status on farms(status);
create index if not exists idx_farms_supabase_user on farms(supabase_user_id);
create index if not exists idx_advisors_farm on feed_advisors(farm_id);
create index if not exists idx_batches_farm on livestock_batches(farm_id);
create index if not exists idx_ingredients_farm on feed_ingredients(farm_id);
create index if not exists idx_standards_farm on feed_standard_versions(farm_id);
create index if not exists idx_requests_farm on optimization_requests(farm_id);
create index if not exists idx_requests_batch on optimization_requests(batch_id);
create index if not exists idx_requests_status on optimization_requests(status);
create index if not exists idx_requests_submitted on optimization_requests(submitted_at desc);
create index if not exists idx_decisions_request on feed_decisions(request_id);
create index if not exists idx_decisions_verdict on feed_decisions(verdict);
create index if not exists idx_audit_farm on audit_events(farm_id);
create index if not exists idx_audit_request on audit_events(request_id);
create index if not exists idx_audit_event_type on audit_events(event_type);

-- ── Row Level Security ────────────────────────────────────

alter table farms enable row level security;
alter table farm_roles enable row level security;
alter table feed_advisors enable row level security;
alter table livestock_batches enable row level security;
alter table feed_ingredients enable row level security;
alter table feed_standard_versions enable row level security;
alter table optimization_requests enable row level security;
alter table feed_decisions enable row level security;
alter table escalations enable row level security;
alter table human_feed_reviews enable row level security;
alter table activated_feed_plans enable row level security;
alter table audit_events enable row level security;

-- Allow authenticated users to read and write their own farm data
create policy "auth_read_farms" on farms
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_farms" on farms
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_farms" on farms
  for update using (auth.role() = 'authenticated');

create policy "auth_read_advisors" on feed_advisors
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_advisors" on feed_advisors
  for insert with check (auth.role() = 'authenticated');

create policy "auth_read_batches" on livestock_batches
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_batches" on livestock_batches
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_batches" on livestock_batches
  for update using (auth.role() = 'authenticated');

create policy "auth_read_ingredients" on feed_ingredients
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_ingredients" on feed_ingredients
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_ingredients" on feed_ingredients
  for update using (auth.role() = 'authenticated');

create policy "auth_read_standards" on feed_standard_versions
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_standards" on feed_standard_versions
  for insert with check (auth.role() = 'authenticated');

create policy "auth_read_requests" on optimization_requests
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_requests" on optimization_requests
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_requests" on optimization_requests
  for update using (auth.role() = 'authenticated');

create policy "auth_read_decisions" on feed_decisions
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_decisions" on feed_decisions
  for insert with check (auth.role() = 'authenticated');

create policy "auth_read_escalations" on escalations
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_escalations" on escalations
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_escalations" on escalations
  for update using (auth.role() = 'authenticated');

create policy "auth_read_reviews" on human_feed_reviews
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_reviews" on human_feed_reviews
  for insert with check (auth.role() = 'authenticated');

create policy "auth_read_plans" on activated_feed_plans
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_plans" on activated_feed_plans
  for insert with check (auth.role() = 'authenticated');

create policy "auth_read_audit" on audit_events
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_audit" on audit_events
  for insert with check (auth.role() = 'authenticated');

create policy "auth_read_farm_roles" on farm_roles
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_farm_roles" on farm_roles
  for insert with check (auth.role() = 'authenticated');
