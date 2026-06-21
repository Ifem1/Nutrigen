'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Advisor {
  id: string;
  advisor_id: string;
  name: string;
  credential_summary: string;
  scope_summary: string;
  wallet_address: string;
  status: string;
  created_at: string;
  farms?: { name: string };
}

export default function AdvisorsPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('feed_advisors').select('*, farms(name)').order('created_at', { ascending: false });
      setAdvisors((data ?? []) as Advisor[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed Advisors</h1>
          <p className="text-gray-500 text-sm mt-1">Registered nutritionists and veterinary advisors for human escalation reviews</p>
        </div>
        <Link href="/advisors/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Register Advisor</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading advisors...</div>
        ) : advisors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👨‍🔬</div>
            <p className="text-gray-500 text-sm mb-4">No advisors registered yet</p>
            <Link href="/advisors/new" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Register an advisor</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Farm</th>
                  <th className="px-5 py-3 text-left">Credentials</th>
                  <th className="px-5 py-3 text-left">Scope</th>
                  <th className="px-5 py-3 text-left">Wallet</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {advisors.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-5 py-3 text-gray-500">{(a.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{a.credential_summary || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{a.scope_summary || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{a.wallet_address ? `${a.wallet_address.slice(0,8)}...` : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
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
