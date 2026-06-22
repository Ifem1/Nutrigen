'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { humanFeedReviewDecision } from '@/lib/genlayer/nutrigenContract';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { syncHumanReview } from '@/lib/nutrigen/contractSync';

export default function EscalationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [decision, setDecision] = useState<any>(null);
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [verdict, setVerdict] = useState('APPROVED');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: req }, { data: dec }] = await Promise.all([
        supabase.from('feed_optimization_requests').select('*, farms(name), livestock_batches(species, production_stage)').eq('id', id).single(),
        supabase.from('feed_decisions').select('*').eq('request_id', id).order('created_at', { ascending: false }).limit(1).single(),
      ]);
      setRequest(req);
      setDecision(dec);
      setLoading(false);
    }
    load();
  }, [id]);

  function handleGenerateWallet() {
    const w = generateWallet();
    localStorage.setItem('nutrigen_wallet', JSON.stringify(w));
    setWallet(w);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet || !reviewReason) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await humanFeedReviewDecision({ request_id: id, final_verdict: verdict, review_reason: reviewReason, reviewer_notes: reviewerNotes }, wallet.privateKey);
      await syncHumanReview(result.txHash, {
        request_id: id, final_verdict: verdict,
        review_reason: reviewReason, reviewer_notes: reviewerNotes,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>;

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review Submitted</h2>
          <p className="text-sm text-gray-600 mb-5">Your review has been recorded on the blockchain.</p>
          <Link href={`/results/${id}`} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">View Results →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/escalations" className="text-gray-400 hover:text-gray-600 text-sm">Pending Reviews</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-mono">{id?.slice(0, 16)}...</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Human Expert Review</h1>
      <p className="text-gray-500 text-sm mb-6">Review the AI decision and provide your expert verdict</p>

      {/* Request Summary */}
      {request && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-900 mb-3">Request Summary</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Farm: </span><span className="font-medium">{(request.farms as any)?.name}</span></div>
            <div><span className="text-gray-500">Species: </span><span className="font-medium">{(request.livestock_batches as any)?.species}</span></div>
            <div><span className="text-gray-500">Stage: </span><span className="font-medium">{(request.livestock_batches as any)?.production_stage}</span></div>
            <div><span className="text-gray-500">AI Status: </span><span className="font-medium text-yellow-600">{request.status}</span></div>
          </div>
        </div>
      )}

      {/* AI Decision Summary */}
      {decision && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-800 mb-3">AI Decision Summary</h2>
          {decision.rationale && <p className="text-sm text-gray-700 mb-3">{decision.rationale}</p>}
          {decision.required_changes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Required Changes Flagged by AI</p>
              <p className="text-sm text-gray-700">{Array.isArray(decision.required_changes) ? decision.required_changes.join('; ') : decision.required_changes}</p>
            </div>
          )}
          <div className="mt-3">
            <Link href={`/results/${id}`} className="text-green-600 hover:underline text-sm">View full AI analysis →</Link>
          </div>
        </div>
      )}

      {!wallet ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-5">
          <div className="text-3xl mb-3">🔑</div>
          <h2 className="font-semibold text-gray-900 mb-2">Wallet Required</h2>
          <p className="text-sm text-gray-600 mb-4">You need a wallet to sign and submit your review on-chain.</p>
          <button onClick={handleGenerateWallet} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Generate Wallet</button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-5 text-xs text-green-700">
          Reviewer wallet: <span className="font-mono">{wallet.address}</span>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Final Verdict <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {['APPROVED', 'REJECTED', 'NEEDS_REVISION'].map(v => (
              <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${verdict === v ? (v === 'APPROVED' ? 'border-green-500 bg-green-50' : v === 'REJECTED' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50') : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="verdict" value={v} checked={verdict === v} onChange={() => setVerdict(v)} className="sr-only" />
                <span className="text-sm font-medium">{v.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Review Reason <span className="text-red-500">*</span></label>
          <textarea required value={reviewReason} onChange={e => setReviewReason(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Explain the basis for your review decision, referencing nutritional evidence or safety concerns..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Notes</label>
          <textarea value={reviewerNotes} onChange={e => setReviewerNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Additional technical notes, recommended modifications, follow-up instructions..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting || !wallet} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-2.5 rounded-lg font-semibold transition-colors">
            {submitting ? 'Submitting review...' : 'Submit Expert Review'}
          </button>
          <Link href="/escalations" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
