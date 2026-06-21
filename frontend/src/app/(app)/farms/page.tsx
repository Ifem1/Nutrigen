'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

interface Farm {
  id: string;
  farm_id: string;
  name: string;
  farm_type: string;
  location_context: string;
  status: string;
  created_at: string;
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      let q = supabase.from('farms').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'ALL') q = q.eq('status', statusFilter);
      const { data } = await q;
      setFarms(data ?? []);
      setLoading(false);
    }
    load();
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farms</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your registered livestock farming operations</p>
        </div>
        <Link href="/farms/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Register Farm</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Filter by status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading farms...</div>
        ) : farms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏡</div>
            <p className="text-gray-500 text-sm mb-4">No farms registered yet</p>
            <Link href="/farms/new" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Register your first farm</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Farm Name</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Location / Context</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {farms.map(farm => (
                  <tr key={farm.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{farm.name}</td>
                    <td className="px-5 py-3 text-gray-600">{farm.farm_type}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{farm.location_context || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[farm.status] ?? 'bg-gray-100 text-gray-600'}`}>{farm.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(farm.created_at).toLocaleDateString()}</td>
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
