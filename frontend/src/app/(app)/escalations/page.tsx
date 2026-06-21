'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STATUS_BADGE: Record<string, string> = {
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-700',
  NEEDS_REVISION: 'bg-orange-100 text-orange-700',
};

interface Request {
  id: string;
  request_id: string;
  status: string;
  created_at: string;
  farms?: { name: string };
  livestock_batches?: { species: string };
}

export default function EscalationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('feed_optimization_requests')
        .select('*, farms(name), livestock_batches(species)')
        .in('status', ['NEEDS_REVIEW', 'NEEDS_REVISION'])
        .order('created_at', { ascending: false });
      setRequests((data ?? []) as Request[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Reviews</h1>
        <p className="text-gray-500 text-sm mt-1">Optimization requests flagged by AI that require human expert review</p>
      </div>

      {requests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-5 text-sm text-yellow-800">
          <strong>{requests.length}</strong> request(s) awaiting human review. These have been flagged by the GenLayer AI consensus as needing expert evaluation.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading escalations...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500 text-sm">No pending escalations. All optimization requests have been resolved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Request ID</th>
                  <th className="px-5 py-3 text-left">Farm</th>
                  <th className="px-5 py-3 text-left">Species</th>
                  <th className="px-5 py-3 text-left">AI Verdict</th>
                  <th className="px-5 py-3 text-left">Opened</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.request_id?.slice(0, 18)}...</td>
                    <td className="px-5 py-3 text-gray-900 font-medium">{(r.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{(r.livestock_batches as any)?.species ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Link href={`/escalations/${r.request_id}`} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
