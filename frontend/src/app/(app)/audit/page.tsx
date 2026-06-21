'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuditEvent {
  id: string;
  event_type: string;
  request_id: string;
  actor: string;
  summary: string;
  logged_at: string;
  farms?: { name: string };
}

interface Farm { id: string; name: string; }

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('farms').select('id, name').then(({ data }) => setFarms(data ?? []));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      let q = supabase.from('audit_events').select('*, farms(name)').order('logged_at', { ascending: false }).limit(200);
      if (farmFilter !== 'ALL') q = q.eq('farm_id', farmFilter);
      const { data } = await q;
      setEvents((data ?? []) as AuditEvent[]);
      setLoading(false);
    }
    load();
  }, [farmFilter]);

  const EVENT_COLORS: Record<string, string> = {
    FARM_CREATED: 'bg-green-100 text-green-700',
    BATCH_REGISTERED: 'bg-emerald-100 text-emerald-700',
    INGREDIENT_ADDED: 'bg-teal-100 text-teal-700',
    STANDARD_PUBLISHED: 'bg-blue-100 text-blue-700',
    OPTIMIZATION_SUBMITTED: 'bg-violet-100 text-violet-700',
    PLAN_ACTIVATED: 'bg-green-100 text-green-700',
    HUMAN_REVIEW: 'bg-amber-100 text-amber-700',
    PLAN_REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 text-sm mt-1">Complete log of all actions and blockchain events across your operation</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Filter by farm:</span>
          <select value={farmFilter} onChange={e => setFarmFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="ALL">All Farms</option>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading audit events...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-sm">No audit events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Event Type</th>
                  <th className="px-5 py-3 text-left">Farm</th>
                  <th className="px-5 py-3 text-left">Request ID</th>
                  <th className="px-5 py-3 text-left">Actor</th>
                  <th className="px-5 py-3 text-left">Summary</th>
                  <th className="px-5 py-3 text-left">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${EVENT_COLORS[ev.event_type] ?? 'bg-gray-100 text-gray-600'}`}>{ev.event_type}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{(ev.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{ev.request_id ? `${ev.request_id.slice(0, 12)}...` : '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{ev.actor ? `${ev.actor.slice(0, 10)}...` : '—'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{ev.summary}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{ev.logged_at ? new Date(ev.logged_at).toLocaleString() : '—'}</td>
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
