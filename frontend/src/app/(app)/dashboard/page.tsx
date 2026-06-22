'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  HUMAN_APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-700',
  NEEDS_REVISION: 'bg-orange-100 text-orange-700',
  PENDING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
};

interface Stats {
  farms: number;
  batches: number;
  ingredients: number;
  requests: number;
  approved: number;
  pending_reviews: number;
}

interface RecentRequest {
  id: string;
  status: string;
  created_at: string;
  farms?: { name: string };
  livestock_batches?: { species: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ farms: 0, batches: 0, ingredients: 0, requests: 0, approved: 0, pending_reviews: 0 });
  const [recent, setRecent] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [
        { count: farms },
        { count: batches },
        { count: ingredients },
        { count: requests },
        { count: approved },
        { count: pending_reviews },
        { data: recentData },
      ] = await Promise.all([
        supabase.from('farms').select('*', { count: 'exact', head: true }),
        supabase.from('livestock_batches').select('*', { count: 'exact', head: true }),
        supabase.from('feed_ingredients').select('*', { count: 'exact', head: true }),
        supabase.from('feed_optimization_requests').select('*', { count: 'exact', head: true }),
        supabase.from('activated_feed_plans').select('*', { count: 'exact', head: true }),
        supabase.from('human_feed_reviews').select('*', { count: 'exact', head: true }),
        supabase.from('feed_optimization_requests').select('id, status, created_at, farms(name), livestock_batches(species)').order('created_at', { ascending: false }).limit(10),
      ]);
      setStats({ farms: farms ?? 0, batches: batches ?? 0, ingredients: ingredients ?? 0, requests: requests ?? 0, approved: approved ?? 0, pending_reviews: pending_reviews ?? 0 });
      setRecent((recentData ?? []) as unknown as RecentRequest[]);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Farms', value: stats.farms, icon: '🏡', color: 'bg-green-50 border-green-200' },
    { label: 'Livestock Batches', value: stats.batches, icon: '🐄', color: 'bg-emerald-50 border-emerald-200' },
    { label: 'Feed Ingredients', value: stats.ingredients, icon: '🌾', color: 'bg-amber-50 border-amber-200' },
    { label: 'Optimization Requests', value: stats.requests, icon: '🎯', color: 'bg-blue-50 border-blue-200' },
    { label: 'Approved Plans', value: stats.approved, icon: '✅', color: 'bg-teal-50 border-teal-200' },
    { label: 'Pending Reviews', value: stats.pending_reviews, icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your livestock feed optimization operations</p>
        </div>
        <div className="flex gap-3">
          <Link href="/farms/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ New Farm</Link>
          <Link href="/batches/new" className="border border-green-600 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Register Batch</Link>
          <Link href="/optimizer" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">🎯 Optimize Feed</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value}</div>
            <div className="text-xs text-gray-600 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Optimization Requests</h2>
          <Link href="/history" className="text-sm text-green-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No requests yet. <Link href="/optimizer" className="text-green-600 hover:underline">Optimize your first ration</Link></div>
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
                {recent.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{r.id?.slice(0, 16)}...</td>
                    <td className="px-5 py-3 text-gray-900">{(r.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{(r.livestock_batches as any)?.species ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Link href={`/results/${r.id}`} className="text-green-600 hover:underline text-xs">View</Link>
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
