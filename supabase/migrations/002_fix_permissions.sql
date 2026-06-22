-- Fix permissions: grant anon and authenticated roles access to all Nutrigen tables

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Disable RLS on all tables (for development/testing - re-enable with proper policies for production)
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS farm_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feed_advisors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS livestock_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feed_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feed_standard_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feed_optimization_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feed_decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS human_feed_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activated_feed_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evidence_manifests DISABLE ROW LEVEL SECURITY;
