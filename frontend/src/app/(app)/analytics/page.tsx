'use client';

import { Card, CardHeader, CardTitle, Spinner, RiskBadge } from '@/components/ui';
import { useComplianceMetrics, useRiskBreakdown, useValidatorReputation } from '@/hooks/useAnalytics';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, Cell
} from 'recharts';
import { format } from 'date-fns';

const RISK_COLORS: Record<string, string> = { low: '#22c55e', medium: '#f97316', high: '#ef4444', critical: '#7f1d1d' };

export default function AnalyticsPage() {
  const { data: metrics, isLoading: metricsLoading } = useComplianceMetrics(30);
  const { data: risk, isLoading: riskLoading } = useRiskBreakdown();
  const { data: validators, isLoading: validatorsLoading } = useValidatorReputation();

  const radarData = risk ? [
    { dimension: 'Nutritional', score: risk.averages.nutritional },
    { dimension: 'Cost', score: risk.averages.cost },
    { dimension: 'Welfare', score: risk.averages.welfare },
    { dimension: 'Consensus', score: risk.averages.consensus },
    { dimension: 'Market', score: risk.averages.market },
  ] : [];

  const distData = risk ? Object.entries(risk.distribution).map(([level, count]) => ({ level, count })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Risk Analytics</h2>
        <p className="text-sm text-muted-foreground">Compliance trends, risk breakdowns, and validator performance.</p>
      </div>

      {/* Compliance trend */}
      <Card padding="md">
        <CardHeader><CardTitle>Compliance Rate — Last 30 Days</CardTitle></CardHeader>
        {metricsLoading ? <div className="flex justify-center py-10"><Spinner /></div> :
          !metrics?.length ? <p className="text-center py-8 text-sm text-muted-foreground">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metrics.map((m: any) => ({ date: format(new Date(m.period_start), 'MMM d'), rate: Number(m.compliance_rate).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk radar */}
        <Card padding="md">
          <CardHeader><CardTitle>Average Risk Dimensions</CardTitle></CardHeader>
          {riskLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}`} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Risk distribution */}
        <Card padding="md">
          <CardHeader><CardTitle>Risk Level Distribution</CardTitle></CardHeader>
          {riskLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distData.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level] ?? '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Validator reputation */}
      <Card padding="none">
        <CardHeader className="border-b border-border px-5 py-4"><CardTitle>Validator Reputation</CardTitle></CardHeader>
        {validatorsLoading ? <div className="flex justify-center py-8"><Spinner /></div> :
          !validators?.length ? <p className="px-5 py-6 text-sm text-muted-foreground">No validators recorded yet.</p> : (
            <div className="divide-y divide-border">
              {validators.map((v: any) => (
                <div key={v.validator_address} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-mono text-xs text-foreground">{`${v.validator_address.slice(0, 10)}…${v.validator_address.slice(-6)}`}</p>
                    <p className="text-xs text-muted-foreground">{v.total_validations} validations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{Number(v.reputation_score).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">reputation</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </Card>
    </div>
  );
}
