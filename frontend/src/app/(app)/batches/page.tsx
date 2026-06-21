'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

interface Batch {
  id: string;
  batch_id: string;
  species: string;
  breed_summary: string;
  production_stage: string;
  head_count: number;
  status: string;
  created_at: string;
  farms?: { name: string };
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('livestock_batches').select('*, farms(name)').order('created_at', { ascending: false });
      setBatches((data ?? []) as Batch[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livestock Batches</h1>
          <p className="text-gray-500 text-sm mt-1">Track your animal groups by species, stage, and production goal</p>
        </div>
        <Link href="/batches/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Register Batch</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🐄</div>
            <p className="text-gray-500 text-sm mb-4">No livestock batches registered yet</p>
            <Link href="/batches/new" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Register your first batch</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Farm</th>
                  <th className="px-5 py-3 text-left">Species</th>
                  <th className="px-5 py-3 text-left">Breed Summary</th>
                  <th className="px-5 py-3 text-left">Production Stage</th>
                  <th className="px-5 py-3 text-left">Head Count</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{(b.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{b.species}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{b.breed_summary || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{b.production_stage}</td>
                    <td className="px-5 py-3 text-gray-700">{b.head_count?.toLocaleString() ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
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
