'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { getLatestDecisionForRequest, getFeedOptimizationRequest } from '@/lib/genlayer/client';
import type { FeedDecision, OptimizationRequest, FeedOptimizationReview } from '@/lib/genlayer/types';
import { formatDistanceToNow } from 'date-fns';

function ScoreBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const color = invert
    ? value <= 30 ? 'bg-green-500' : value <= 60 ? 'bg-orange-500' : 'bg-red-500'
    : value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-brand-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function VerdictIcon({ verdict }: { verdict: string }) {
  if (verdict === 'APPROVED') return <CheckCircle2 className="h-6 w-6 text-green-500" />;
  if (verdict === 'REJECTED') return <XCircle className="h-6 w-6 text-red-500" />;
  return <AlertTriangle className="h-6 w-6 text-orange-500" />;
}

function verdictColor(verdict: string) {
  if (verdict === 'APPROVED') return 'bg-green-50 border-green-200 text-green-800';
  if (verdict === 'REJECTED') return 'bg-red-50 border-red-200 text-red-800';
  return 'bg-orange-50 border-orange-200 text-orange-800';
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<OptimizationRequest | null>(null);
  const [decision, setDecision] = useState<FeedDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  async function load() {
    const [req, dec] = await Promise.all([
      getFeedOptimizationRequest(id),
      getLatestDecisionForRequest(id),
    ]);
    setRequest(req);
    setDecision(dec);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function refresh() {
    setPolling(true);
    await load();
    setPolling(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!request) return <p className="py-20 text-center text-muted-foreground">Request not found.</p>;

  const rev: FeedOptimizationReview | null = decision?.feed_optimization_review ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => router.push('/history')}>Back to History</Button>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={refresh} loading={polling}>Refresh</Button>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground font-mono">{request.request_id}</h2>
            <p className="text-sm text-muted-foreground">
              Submitted {request.submitted_at ? formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true }) : ''}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            request.status === 'ACTIVATED' || request.status === 'APPROVED' || request.status === 'HUMAN_APPROVED'
              ? 'border-green-200 bg-green-50 text-green-700'
              : request.status === 'REJECTED' || request.status === 'HUMAN_REJECTED' || request.status === 'BLOCKED'
              ? 'border-red-200 bg-red-50 text-red-700'
              : request.status === 'NEEDS_REVIEW'
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}>{request.status}</span>
        </div>
      </div>

      {/* No decision yet */}
      {!decision && (
        <Card padding="lg" className="text-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Awaiting GenLayer consensus… Click refresh to check.</p>
        </Card>
      )}

      {decision && rev && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Verdict */}
          <Card padding="md" className={`border lg:col-span-2 ${verdictColor(rev.verdict)}`}>
            <div className="flex items-center gap-3">
              <VerdictIcon verdict={rev.verdict} />
              <div>
                <p className="font-bold">{rev.verdict}</p>
                <p className="text-sm opacity-80">{rev.rationale}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs opacity-70">Risk band</p>
                <p className="font-bold">{rev.risk_band}</p>
              </div>
            </div>
          </Card>

          {/* Scores */}
          <Card padding="md" className="space-y-3">
            <CardHeader><CardTitle>Optimization Scores</CardTitle></CardHeader>
            <ScoreBar label="Nutrient Adequacy" value={rev.nutrient_adequacy_score} />
            <ScoreBar label="Livestock Suitability" value={rev.livestock_suitability_score} />
            <ScoreBar label="Safety" value={rev.safety_score} />
            <ScoreBar label="Cost Efficiency" value={rev.cost_efficiency_score} />
            <ScoreBar label="Availability" value={rev.availability_score} />
            <ScoreBar label="Production Goal Alignment" value={rev.production_goal_alignment_score} />
            <ScoreBar label="Practicality" value={rev.practicality_score} />
            <ScoreBar label="Risk Score" value={rev.risk_score} invert />
          </Card>

          {/* Recommended ration */}
          <Card padding="md" className="space-y-3">
            <CardHeader><CardTitle>Recommended Ration</CardTitle></CardHeader>
            <p className="text-sm text-foreground">{rev.recommended_ration_summary}</p>
            {rev.ingredient_mix_summary && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Ingredient Mix</p>
                <p className="text-sm">{rev.ingredient_mix_summary}</p>
              </div>
            )}
            {rev.daily_feeding_summary && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Daily Feeding</p>
                <p className="text-sm">{rev.daily_feeding_summary}</p>
              </div>
            )}
            {rev.transition_plan_summary && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Transition Plan</p>
                <p className="text-sm">{rev.transition_plan_summary}</p>
              </div>
            )}
          </Card>

          {/* Strengths */}
          {rev.strengths.length > 0 && (
            <Card padding="md">
              <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
              <ul className="space-y-1">
                {rev.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Findings / Risks */}
          {(rev.nutrient_gaps.length > 0 || rev.ingredient_risks.length > 0 || rev.health_warnings.length > 0) && (
            <Card padding="md">
              <CardHeader><CardTitle>Findings &amp; Risks</CardTitle></CardHeader>
              {rev.nutrient_gaps.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Nutrient Gaps</p>
                  <ul className="space-y-1">
                    {rev.nutrient_gaps.map((g, i) => <li key={i} className="text-sm text-orange-700">• {g}</li>)}
                  </ul>
                </div>
              )}
              {rev.ingredient_risks.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Ingredient Risks</p>
                  <ul className="space-y-1">
                    {rev.ingredient_risks.map((r, i) => <li key={i} className="text-sm text-red-700">• {r}</li>)}
                  </ul>
                </div>
              )}
              {rev.health_warnings.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Health Warnings</p>
                  <ul className="space-y-1">
                    {rev.health_warnings.map((w, i) => <li key={i} className="text-sm text-red-700">• {w}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Required changes */}
          {rev.required_changes.length > 0 && (
            <Card padding="md" className="lg:col-span-2">
              <CardHeader><CardTitle>Required Changes Before Approval</CardTitle></CardHeader>
              <ul className="space-y-1">
                {rev.required_changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Feeding instructions */}
          {rev.feeding_instructions.length > 0 && (
            <Card padding="md">
              <CardHeader><CardTitle>Feeding Instructions</CardTitle></CardHeader>
              <ol className="space-y-1 list-decimal list-inside">
                {rev.feeding_instructions.map((inst, i) => <li key={i} className="text-sm">{inst}</li>)}
              </ol>
            </Card>
          )}

          {/* Monitoring notes */}
          {rev.monitoring_notes.length > 0 && (
            <Card padding="md">
              <CardHeader><CardTitle>Monitoring Notes</CardTitle></CardHeader>
              <ul className="space-y-1">
                {rev.monitoring_notes.map((n, i) => <li key={i} className="text-sm">• {n}</li>)}
              </ul>
            </Card>
          )}

          {/* Actions */}
          {(request.status === 'NEEDS_REVIEW') && (
            <Card padding="md" className="lg:col-span-2 bg-orange-50 border border-orange-200">
              <CardHeader><CardTitle>Human Review Required</CardTitle></CardHeader>
              <p className="text-sm text-orange-800 mb-3">
                This optimization requires review by a qualified nutritionist or vet before the feed plan can be approved.
              </p>
              <Button onClick={() => router.push(`/escalations/${request.request_id}`)}>
                Go to Review
              </Button>
            </Card>
          )}

          {(request.status === 'APPROVED' || request.status === 'HUMAN_APPROVED') && (
            <Card padding="md" className="lg:col-span-2 bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800">Feed plan approved — ready to activate</p>
                  <p className="text-sm text-green-700">Activate the feed plan to record it on-chain as implemented.</p>
                </div>
                <Button onClick={() => router.push(`/history/${request.request_id}/activate`)}>
                  Activate Plan
                </Button>
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card padding="md" className="lg:col-span-2">
            <CardHeader><CardTitle>Consensus Metadata</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-muted-foreground">Confidence</p>
                <p className="mt-1 font-bold">{rev.confidence}%</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-muted-foreground">Adjudicated by</p>
                <p className="mt-1 font-bold truncate">{decision.adjudicated_by}</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3 sm:col-span-2">
                <p className="text-muted-foreground">Ration hash</p>
                <p className="mt-1 font-mono break-all">{request.ration_hash}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
