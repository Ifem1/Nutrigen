import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// ── env vars ──────────────────────────────────────────────────────────────────
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

// ── fetch mock (fire-and-forget edge function call) ───────────────────────────
global.fetch = vi.fn().mockResolvedValue({ ok: true });

import { POST } from './route';

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/optimizer/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const validBody = {
  org_id: 'org-1',
  policy_id: 'policy-1',
  livestock_type: 'cattle_beef',
  breed: 'Angus',
  herd_size: 100,
  avg_weight_kg: 350,
  target_weight_kg: 500,
  growth_stage: 'growing',
  location_country: 'NG',
  location_region: 'Lagos',
  temperature_celsius: 28,
  humidity_percent: 70,
  season: 'dry',
  weather_conditions: 'sunny',
  available_forages: ['grass'],
  forage_quality_score: 7,
  budget_per_head_per_day: 1.5,
  currency: 'USD',
  max_feed_cost_per_kg: 0.5,
};

describe('POST /api/optimizer/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when Supabase insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }) });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('DB error');
  });

  it('returns 200 with request_id on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.request_id).toBeTruthy();
    expect(typeof body.data.request_id).toBe('string');
  });

  it('fires edge function in background and does not await it', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);

    // fetch is called fire-and-forget — allow microtasks to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/run-feed-optimizer'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
