'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { getEscalation, getLatestDecisionForRequest, humanFeedReviewDecision, waitForTransaction } from '@/lib/genlayer/client';
import { buildMetadataHash } from '@/lib/nutrigen/feedPacket';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Escalation, FeedDecision } from '@/lib/genlayer/types';

export default function EscalationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { walletAddress } = useAuthStore();

  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [decision, setDecision] = useState<FeedDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState('APPROVED');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      getEscalation(id),
      getLatestDecisionForRequest(id),
    ]).then(([esc, dec]) => {
      setEscalation(esc);
      setDecision(dec);
      setLoading(false);
    });
  }, [id]);

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    const privateKey = sessionStorage.getItem('nutrigen_pk') ?? '';
    if (!privateKey || !walletAddress) { toast.error('Wallet not connected.'); return; }
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const review_evidence_hash = await buildMetadataHash({ request_id: id, verdict, reason, reviewer: walletAddress, decided_at: now });

      const txHash = await humanFeedReviewDecision({
        request_id: id, final_verdict: verdict,
        review_reason: reason, review_evidence_hash,
        reviewer_notes: notes, decided_at: now,
      }, privateKey);

      const receipt = await waitForTransaction(txHash);
      if (receipt.status !== 'ACCEPTED') throw new Error('Transaction not accepted');

      await createClient().from('human_feed_reviews').upsert({
        request_id: id, farm_id: escalation?.farm_id ?? '',
        reviewer: walletAddress, final_verdict: verdict,
        request_status: verdict === 'APPROVED' ? 'HUMAN_APPROVED' : verdict === 'REJECTED' ? 'HUMAN_REJECTED' : 'NEEDS_REVISION',
        review_reason: reason, review_evidence_hash, reviewer_notes: notes,
        decided_at: now,
        raw_json: { request_id: id, final_verdict: verdict, review_reason: reason, review_evidence_hash, reviewer_notes: notes, decided_at: now },
      });

      toast.success('Human review decision submitted.');
      router.push(`/results/${id}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!escalation) return <p className="py-20 text-center text-muted-foreground">Escalation not found for request {id}.</p>;

  const rev = decision?.feed_optimization_review;
  const isResolved = escalation.status === 'CLOSED';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => router.push('/escalations')}>Back</Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Human Feed Review</h2>
          <p className="font-mono text-sm text-muted-foreground">{id}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
          isResolved ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'
        }`}>{isResolved ? 'CLOSED' : 'OPEN'}</span>
      </div>

      {/* Escalation reason */}
      <Card padding="md">
        <CardHeader><CardTitle>Escalation Reason</CardTitle></CardHeader>
        <p className="text-sm">{escalation.reason}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Escalated by {escalation.opened_by} at {escalation.opened_at}
        </p>
      </Card>

      {/* AI decision summary */}
      {rev && (
        <Card padding="md" className="space-y-3">
          <CardHeader><CardTitle>AI Consensus Summary</CardTitle></CardHeader>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { label: 'Nutrient Adequacy', v: rev.nutrient_adequacy_score },
              { label: 'Safety', v: rev.safety_score },
              { label: 'Cost Efficiency', v: rev.cost_efficiency_score },
              { label: 'Risk', v: rev.risk_score },
            ].map(({ label, v }) => (
              <div key={label} className="rounded bg-secondary/60 p-2">
                <p className="font-bold">{v}</p>
                <p className="text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Recommended Ration</p>
            <p className="text-sm">{rev.recommended_ration_summary}</p>
          </div>
          {rev.health_warnings.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Health Warnings</p>
              {rev.health_warnings.map((w, i) => <p key={i} className="text-sm text-red-700">• {w}</p>)}
            </div>
          )}
          {rev.required_changes.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Required Changes</p>
              {rev.required_changes.map((c, i) => <p key={i} className="text-sm text-orange-700">• {c}</p>)}
            </div>
          )}
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">AI Rationale</p>
            <p className="text-sm">{rev.rationale}</p>
          </div>
        </Card>
      )}

      {/* Human review form */}
      {!isResolved ? (
        <Card padding="md">
          <CardHeader><CardTitle>Your Human Review Decision</CardTitle></CardHeader>
          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Final verdict *</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={verdict} onChange={(e) => setVerdict(e.target.value)}>
                <option value="APPROVED">APPROVED — Safe to implement</option>
                <option value="REJECTED">REJECTED — Do not implement</option>
                <option value="NEEDS_REVISION">NEEDS_REVISION — Rebalance required</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Review reason *</label>
              <textarea className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required
                placeholder="e.g. Reviewed with farm vet. Soybean inclusion is safe at 30% for this breed. Confirmed Ca:P ratio acceptable." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Reviewer notes</label>
              <textarea className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the farmer or feed advisor." />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={submitting}>Submit Review Decision</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card padding="md" className="bg-green-50 border border-green-200">
          <p className="font-semibold text-green-800">Review closed</p>
          {escalation.close_reason && <p className="mt-1 text-sm text-green-700">{escalation.close_reason}</p>}
        </Card>
      )}
    </div>
  );
}
