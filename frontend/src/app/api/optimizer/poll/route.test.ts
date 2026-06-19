import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockEqResult = vi.fn();
const mockEqRequest = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

import { GET } from './route';

function makeRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/optimizer/poll');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/optimizer/poll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when requestId is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/requestId/i);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    // from() needs to return something but we won't get there
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    });

    const res = await GET(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(401);
  });

  it('returns polling data when authenticated and request found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    const mockRequestRow = { status: 'processing', tx_hash: '0xabc' };
    const mockResultRow = {
      consensus_status: 'ACCEPTED',
      compliance_score: 88,
      risk_score: 15,
      risk_level: 'low',
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'optimization_requests') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRequestRow, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockResultRow, error: null }),
      };
    });

    const res = await GET(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('processing');
    expect(body.data.consensus_status).toBe('ACCEPTED');
    expect(body.data.compliance_score).toBe(88);
  });
});
