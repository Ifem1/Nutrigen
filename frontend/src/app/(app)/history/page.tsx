'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  HUMAN_APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-700',
  NEEDS_REVISION: 'bg-orange-100 text-orange-700',
  PENDING: 'bg-blue-100 text-blue-700',
};

interface Request {
  id: string;
  status: string;
  created_at: string;
  farms?: { name: string };
  livestock_batches?: { species: string };
}

export default function HistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('feed_optimization_requests').select('*, farms(name), livestock_batches(species)').order('created_at', { ascending: false });
      setRequests((data ?? []) as Request[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request History</h1>
          <p className="text-gray-500 text-sm mt-1">All feed optimization requests submitted to GenLayer</p>
        </div>
        <Link href="/optimizer" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ New Request</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading history...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🕐</div>
            <p className="text-gray-500 text-sm mb-4">No optimization requests yet</p>
            <Link href="/optimizer" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Submit your first ration</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Request ID</th>
                  <th className="px-5 py-3 text-left">Farm</th>
                  <th className="px-5 py-3 text-left">Species</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                  <th className="px-5 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(r => (
                  <tr key={r.id} onClick={() => router.push(`/results/${r.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.id?.slice(0, 18)}...</td>
                    <td className="px-5 py-3 text-gray-900 font-medium">{(r.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{(r.livestock_batches as any)?.species ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Link href={`/results/${r.id}`} onClick={e => e.stopPropagation()} className="text-green-600 hover:underline text-xs">View Results</Link>
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
