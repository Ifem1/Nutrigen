'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Standard {
  id: string;
  standard_id: string;
  title: string;
  species_scope: string;
  version: string;
  status: string;
  is_current: boolean;
  created_at: string;
}

export default function FeedStandardsPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('feed_standard_versions').select('*').order('created_at', { ascending: false });
      setStandards(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed Standards</h1>
          <p className="text-gray-500 text-sm mt-1">Nutritional standards and safety rules used during AI feed optimization</p>
        </div>
        <Link href="/feed-standards/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Publish Standard</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading standards...</div>
        ) : standards.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 text-sm mb-4">No feed standards published yet</p>
            <Link href="/feed-standards/new" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Publish your first standard</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Species Scope</th>
                  <th className="px-5 py-3 text-left">Version</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Current</th>
                  <th className="px-5 py-3 text-left">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standards.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-5 py-3 text-gray-600">{s.species_scope}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">v{s.version}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      {s.is_current ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Current</span> : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
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
