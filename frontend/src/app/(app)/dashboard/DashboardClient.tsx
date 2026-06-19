'use client';

import Link from 'next/link';
import { FlaskConical, ShieldCheck, AlertTriangle, ArrowRight, Tractor, Beef, Package, BookOpen, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Spinner, StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Stats {
  farms: number;
  batches: number;
  ingredients: number;
  requests: number;
  approved: number;
  pending_review: number;
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardClient() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [
        { count: farms },
        { count: batches },
        { count: ingredients },
        { count: requests },
        { count: approved },
        { count: pending_review },
        { data: recentData },
      ] = await Promise.all([
        supabase.from('farms').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('livestock_batches').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('feed_ingredients').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('optimization_requests').select('*', { count: 'exact', head: true }),
        supabase.from('optimization_requests').select('*', { count: 'exact', head: true }).in('status', ['APPROVED', 'HUMAN_APPROVED', 'ACTIVATED']),
        supabase.from('optimization_requests').select('*', { count: 'exact', head: true }).eq('status', 'NEEDS_REVIEW'),
        supabase.from('optimization_requests').select('id, status, submitted_at, farm_id, batch_id').order('submitted_at', { ascending: false }).limit(6),
      ]);
      setStats({
        farms: farms ?? 0, batches: batches ?? 0, ingredients: ingredients ?? 0,
        requests: requests ?? 0, approved: approved ?? 0, pending_review: pending_review ?? 0,
      });
      setRecent(recentData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Hello, {firstName}</h2>
          <p className="text-sm text-muted-foreground">Livestock feed optimization — powered by GenLayer consensus.</p>
        </div>
        <Link href="/optimizer">
          <Button leftIcon={<FlaskConical className="h-4 w-4" />}>New Optimization</Button>
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Card key={i} padding="md" className="h-24 animate-pulse bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Active Farms" value={stats?.farms ?? 0} sub="Registered farms" icon={Tractor} color="bg-brand-600" />
          <StatCard label="Livestock Batches" value={stats?.batches ?? 0} sub="Active batches" icon={Beef} color="bg-green-600" />
          <StatCard label="Feed Ingredients" value={stats?.ingredients ?? 0} sub="Active ingredients" icon={Package} color="bg-orange-500" />
          <StatCard label="Total Requests" value={stats?.requests ?? 0} sub="All time" icon={FlaskConical} color="bg-blue-600" />
          <StatCard label="Approved Plans" value={stats?.approved ?? 0} sub="Consensus approved" icon={CheckCircle2} color="bg-emerald-600" />
          <StatCard label="Pending Review" value={stats?.pending_review ?? 0} sub="Needs human review" icon={AlertTriangle} color="bg-amber-500" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Farms', href: '/farms', icon: Tractor, color: 'text-brand-600' },
          { label: 'Feed Standards', href: '/feed-standards', icon: BookOpen, color: 'text-green-600' },
          { label: 'Escalations', href: '/escalations', icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'Audit Trail', href: '/audit', icon: ShieldCheck, color: 'text-blue-600' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card padding="md" className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col items-center gap-2 text-center">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent optimization requests */}
      <Card padding="none">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Optimization Requests</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Spinner /></div>
          ) : !recent.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FlaskConical className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No optimization requests yet.</p>
              <Link href="/optimizer" className="mt-3">
                <Button size="sm">Run your first optimization</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((req) => (
                <li key={req.id}>
                  <Link href={`/results/${req.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xs font-bold">
                        {req.id.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{req.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.submitted_at
                            ? formatDistanceToNow(new Date(req.submitted_at), { addSuffix: true })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={req.status.toLowerCase()} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
