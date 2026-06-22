'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getLatestDecisionForRequest, getActivatedFeedPlan, markFeedPlanActivated } from '@/lib/genlayer/nutrigenContract';
import { GENLAYER_EXPLORER_URL, NUTRIGEN_CONTRACT_ADDRESS } from '@/lib/genlayer/config';
import { syncActivatedFeedPlan } from '@/lib/nutrigen/contractSync';

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  HUMAN_APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  NEEDS_REVIEW: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  NEEDS_REVISION: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  PENDING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
};

const SCORE_COLORS = ['bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500', 'bg-orange-500'];

const SCORE_LABELS = [
  { key: 'nutrient_adequacy_score', label: 'Nutrient Adequacy' },
  { key: 'species_suitability_score', label: 'Species Suitability' },
  { key: 'safety_score', label: 'Safety' },
  { key: 'cost_efficiency_score', label: 'Cost Efficiency' },
  { key: 'availability_score', label: 'Availability' },
  { key: 'production_alignment_score', label: 'Production Alignment' },
  { key: 'explainability_score', label: 'Explainability' },
  { key: 'practicality_score', label: 'Practicality' },
];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [activatedPlan, setActivatedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activateSuccess, setActivateSuccess] = useState(false);
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: req } = await supabase.from('feed_optimization_requests').select('*, farms(name), livestock_batches(species, production_stage)').eq('id', id).single();
        setRequest(req);

        // Try GenLayer first, fall back to Supabase
        let dec = null;
        try {
          dec = await getLatestDecisionForRequest(id);
        } catch {
          const { data } = await supabase.from('feed_decisions').select('*').eq('request_id', id).order('created_at', { ascending: false }).limit(1).single();
          dec = data;
        }
        setDecision(dec);

        let plan = null;
        try {
          plan = await getActivatedFeedPlan(id);
        } catch {
          const { data } = await supabase.from('activated_feed_plans').select('*').eq('request_id', id).single();
          plan = data;
        }
        setActivatedPlan(plan);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleActivate() {
    if (!wallet) return;
    setActivating(true);
    setError('');
    try {
      const activationHash = `0x${Date.now().toString(16)}`;
      const result = await markFeedPlanActivated({ request_id: id, activation_hash: activationHash, activation_summary: 'Feed plan activated via Nutrigen dashboard' }, wallet.privateKey);
      await syncActivatedFeedPlan(result.txHash, { request_id: id, activation_hash: activationHash, activation_summary: 'Activated via dashboard', activated_by: wallet.address });
      setActivateSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Failed to activate plan');
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <svg className="animate-spin w-10 h-10 text-green-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <p className="text-gray-500 text-sm">Loading optimization results...</p>
      </div>
    );
  }

  const verdict = decision?.verdict || request?.status || 'PENDING';
  const style = VERDICT_STYLES[verdict] ?? VERDICT_STYLES.PENDING;

  const canActivate = (verdict === 'APPROVED' || verdict === 'HUMAN_APPROVED') && !activatedPlan && !activateSuccess;
  const needsReview = verdict === 'NEEDS_REVIEW' || verdict === 'NEEDS_REVISION';

  function renderList(items: any) {
    if (!items) return <p className="text-gray-400 text-sm">None reported</p>;
    const arr = Array.isArray(items) ? items : (typeof items === 'string' ? items.split('\n').filter(Boolean) : []);
    if (arr.length === 0) return <p className="text-gray-400 text-sm">None</p>;
    return <ul className="space-y-1">{arr.map((item: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-gray-400 shrink-0">•</span>{item}</li>)}</ul>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/history" className="text-gray-400 hover:text-gray-600 text-sm">History</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-mono">{id?.slice(0, 20)}...</span>
      </div>

      {/* Verdict Banner */}
      <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Feed Optimization Verdict</p>
            <div className={`text-3xl font-extrabold ${style.text}`}>{verdict.replace('_', ' ')}</div>
            {request && <p className="text-sm text-gray-600 mt-1">{(request.farms as any)?.name} — {(request.livestock_batches as any)?.species} {(request.livestock_batches as any)?.production_stage}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {canActivate && (
              <button onClick={handleActivate} disabled={activating || !wallet} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm">
                {activating ? 'Activating...' : '✅ Activate Feed Plan'}
              </button>
            )}
            {activateSuccess && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">Feed plan activated!</div>}
            {needsReview && (
              <Link href={`/escalations/${id}`} className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm text-center">Submit Human Review</Link>
            )}
          </div>
        </div>
        {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
      </div>

      {decision ? (
        <>
          {/* Score grid */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Quality Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SCORE_LABELS.map((s, i) => {
                const score = decision[s.key] ?? 0;
                const pct = Math.min(100, Math.max(0, score * 10));
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">{s.label}</span>
                      <span className="font-bold text-gray-900">{score}/10</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${SCORE_COLORS[i]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk & Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Risk Band</p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${decision.risk_band === 'LOW' ? 'bg-green-100 text-green-700' : decision.risk_band === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {decision.risk_band ?? 'N/A'}
              </span>
              {decision.risk_score != null && <p className="text-2xl font-bold text-gray-900 mt-2">{decision.risk_score}<span className="text-sm text-gray-400">/10</span></p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Confidence</p>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(decision.confidence_score ?? 0) * 10}%` }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{decision.confidence_score ?? 0}<span className="text-sm text-gray-400">/10</span></p>
            </div>
          </div>

          {/* Ration Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Recommended Ration Summary</h2>
            {decision.recommended_ration_summary && <p className="text-sm text-gray-700">{decision.recommended_ration_summary}</p>}
            <div className="grid md:grid-cols-3 gap-4">
              {decision.ingredient_mix_summary && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ingredient Mix</p>
                  <p className="text-sm text-gray-700">{decision.ingredient_mix_summary}</p>
                </div>
              )}
              {decision.daily_feeding_schedule && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Daily Feeding</p>
                  <p className="text-sm text-gray-700">{decision.daily_feeding_schedule}</p>
                </div>
              )}
              {decision.transition_plan && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Transition Plan</p>
                  <p className="text-sm text-gray-700">{decision.transition_plan}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lists */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Nutrient Gaps', key: 'nutrient_gaps', icon: '⚠️' },
              { title: 'Excess Risks', key: 'excess_risks', icon: '🔴' },
              { title: 'Ingredient Risks', key: 'ingredient_risks', icon: '🧪' },
              { title: 'Health Warnings', key: 'health_warnings', icon: '🏥' },
              { title: 'Cost Findings', key: 'cost_findings', icon: '💰' },
              { title: 'Availability Findings', key: 'availability_findings', icon: '📦' },
              { title: 'Required Changes', key: 'required_changes', icon: '✏️' },
              { title: 'Strengths', key: 'strengths', icon: '💪' },
            ].map(item => (
              <div key={item.key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-1.5"><span>{item.icon}</span>{item.title}</h3>
                {renderList(decision[item.key])}
              </div>
            ))}
          </div>

          {/* Instructions & Notes */}
          {(decision.feeding_instructions || decision.monitoring_notes || decision.rationale) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
              {decision.feeding_instructions && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Feeding Instructions</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{decision.feeding_instructions}</p>
                </div>
              )}
              {decision.monitoring_notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Monitoring Notes</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{decision.monitoring_notes}</p>
                </div>
              )}
              {decision.rationale && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI Rationale</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{decision.rationale}</p>
                </div>
              )}
            </div>
          )}

          {/* GenLayer Proof */}
          <div className="bg-gray-900 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-400"><span>🔗</span> GenLayer Blockchain Proof</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Contract Address</p>
                <a href={`${GENLAYER_EXPLORER_URL}/address/${NUTRIGEN_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="font-mono text-green-400 hover:text-green-300 text-xs">{NUTRIGEN_CONTRACT_ADDRESS}</a>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Chain ID</p>
                <p className="font-mono text-white">61999 (StudioNet)</p>
              </div>
              {(decision.tx_hash || request?.tx_hash) && (
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-xs mb-1">Transaction Hash</p>
                  <a href={`${GENLAYER_EXPLORER_URL}/tx/${decision.tx_hash || request?.tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-green-400 hover:text-green-300 text-xs break-all">
                    {decision.tx_hash || request?.tx_hash} ↗
                  </a>
                </div>
              )}
              {decision.adjudicated_at && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Adjudicated At</p>
                  <p className="text-white text-xs">{new Date(decision.adjudicated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="font-semibold text-gray-900 mb-2">Awaiting AI Consensus</h3>
          <p className="text-sm text-gray-500">GenLayer validators are evaluating your ration. This typically takes 1-5 minutes. Refresh this page to check for results.</p>
          <button onClick={() => window.location.reload()} className="mt-5 border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Refresh</button>
        </div>
      )}
    </div>
  );
}
