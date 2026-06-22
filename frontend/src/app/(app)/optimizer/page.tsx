'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { submitAndOptimizeFeed } from '@/lib/genlayer/nutrigenContract';
import { buildFeedPacket, hashFeedPacket, generateRequestId } from '@/lib/nutrigen/feedPacket';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { syncOptimizationRequest, syncFeedDecision } from '@/lib/nutrigen/contractSync';
import { GENLAYER_EXPLORER_URL } from '@/lib/genlayer/config';

interface Farm { id: string; name: string; }
interface Batch { id: string; species: string; production_stage: string; farm_id: string; }
interface Advisor { id: string; name: string; farm_id: string; }
interface Ingredient { id: string; name: string; category: string; }
interface Standard { id: string; standard_id: string; title: string; version: string; farm_id: string; }

export default function OptimizerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);

  // Step 1
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState('');
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorId, setAdvisorId] = useState('');

  // Step 2
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardId, setStandardId] = useState('');

  // Step 3
  const [objectiveSummary, setObjectiveSummary] = useState('');
  const [currentFeedingSummary, setCurrentFeedingSummary] = useState('');
  const [availableFeedSummary, setAvailableFeedSummary] = useState('');
  const [candidateRationSummary, setCandidateRationSummary] = useState('');
  const [nutrientAnalysisSummary, setNutrientAnalysisSummary] = useState('');

  // Step 4
  const [costConstraintSummary, setCostConstraintSummary] = useState('');
  const [supplyConstraintSummary, setSupplyConstraintSummary] = useState('');
  const [healthContextSummary, setHealthContextSummary] = useState('');
  const [environmentContextSummary, setEnvironmentContextSummary] = useState('');
  const [evidenceManifestHash, setEvidenceManifestHash] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ requestId: string; txHash: string; undetermined?: boolean } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
    const supabase = createClient();
    supabase.from('farms').select('id, name').eq('status', 'ACTIVE').then(({ data }) => setFarms(data ?? []));
  }, []);

  useEffect(() => {
    if (!farmId) { setBatches([]); setAdvisors([]); setIngredients([]); setStandards([]); return; }
    const supabase = createClient();
    supabase.from('livestock_batches').select('id, species, production_stage, farm_id').eq('farm_id', farmId).then(({ data }) => setBatches(data ?? []));
    supabase.from('feed_advisors').select('id, name, farm_id').eq('farm_id', farmId).then(({ data }) => setAdvisors(data ?? []));
    supabase.from('feed_ingredients').select('id, name, category').eq('farm_id', farmId).then(({ data }) => setIngredients(data ?? []));
    supabase.from('feed_standard_versions').select('id, standard_id, title, version, farm_id').eq('farm_id', farmId).then(({ data }) => setStandards(data ?? []));
  }, [farmId]);

  function handleGenerateWallet() {
    const w = generateWallet();
    localStorage.setItem('nutrigen_wallet', JSON.stringify(w));
    setWallet(w);
  }

  function toggleIngredient(ingId: string) {
    setSelectedIngredients(prev => prev.includes(ingId) ? prev.filter(i => i !== ingId) : [...prev, ingId]);
  }

  async function handleSubmit() {
    if (!wallet) return;
    setError('');
    setLoading(true);
    try {
      const requestId = generateRequestId(farmId, batchId);
      const packet = buildFeedPacket({
        farm_id: farmId,
        batch_id: batchId,
        advisor_id: advisorId,
        ingredient_ids_csv: selectedIngredients.join(','),
        standard_ids_csv: standardId,
        objective_summary: objectiveSummary,
        current_feeding_summary: currentFeedingSummary,
        available_feed_summary: availableFeedSummary,
        candidate_ration_summary: candidateRationSummary,
        nutrient_analysis_summary: nutrientAnalysisSummary,
        cost_constraint_summary: costConstraintSummary,
        supply_constraint_summary: supplyConstraintSummary,
        health_context_summary: healthContextSummary,
        environment_context_summary: environmentContextSummary,
      });
      const rationHash = await hashFeedPacket(packet);
      // Contract requires a non-empty evidence_manifest_hash; fall back to ration_hash when user provides none
      const resolvedEvidenceHash = evidenceManifestHash.trim() || rationHash;

      const result = await submitAndOptimizeFeed({
        request_id: requestId,
        farm_id: farmId,
        batch_id: batchId,
        advisor_id: advisorId,
        standard_ids_csv: standardId,
        ingredient_ids_csv: selectedIngredients.join(','),
        objective_summary: objectiveSummary,
        current_feeding_summary: currentFeedingSummary,
        available_feed_summary: availableFeedSummary,
        candidate_ration_summary: candidateRationSummary,
        nutrient_analysis_summary: nutrientAnalysisSummary,
        cost_constraint_summary: costConstraintSummary,
        supply_constraint_summary: supplyConstraintSummary,
        health_context_summary: healthContextSummary,
        environment_context_summary: environmentContextSummary,
        evidence_manifest_hash: resolvedEvidenceHash,
        ration_hash: rationHash,
      }, wallet.privateKey);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await syncOptimizationRequest(result.txHash, {
        request_id: requestId, farm_id: farmId, batch_id: batchId,
        advisor_id: advisorId, standard_ids_csv: standardId,
        ingredient_ids_csv: selectedIngredients.join(','),
        objective_summary: objectiveSummary, current_feeding_summary: currentFeedingSummary,
        available_feed_summary: availableFeedSummary, candidate_ration_summary: candidateRationSummary,
        nutrient_analysis_summary: nutrientAnalysisSummary, cost_constraint_summary: costConstraintSummary,
        supply_constraint_summary: supplyConstraintSummary, health_context_summary: healthContextSummary,
        environment_context_summary: environmentContextSummary,
        evidence_manifest_hash: resolvedEvidenceHash, ration_hash: rationHash,
      }, user?.id);

      // Sync the decision that came back from GenLayer consensus
      if (result.data && typeof result.data === 'object') {
        await syncFeedDecision(result.txHash, requestId, result.data as Record<string, unknown>);
      }

      const isUndetermined = (result as any).consensusStatus === 'UNDETERMINED' ||
        String((result as any).consensusStatus ?? '').toUpperCase().includes('UNDETERMINED');
      setSubmitted({ requestId, txHash: result.txHash, undetermined: isUndetermined });
      if (!isUndetermined) setTimeout(() => router.push(`/results/${requestId}`), 2000);
    } catch (err: any) {
      setError(err.message ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Optimize Feed Ration</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h2 className="font-semibold text-gray-900 mb-2">Wallet Required</h2>
          <p className="text-sm text-gray-600 mb-5">You need a wallet to submit optimization requests to the GenLayer blockchain.</p>
          <button onClick={handleGenerateWallet} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Generate Wallet</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    if (submitted.undetermined) {
      return (
        <div className="max-w-lg mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Consensus Not Reached</h2>
            <p className="text-sm text-gray-600 mb-2">The GenLayer validators could not agree on a verdict (leader rotation). This occasionally happens on StudioNet.</p>
            <p className="text-xs text-gray-400 mb-4">Try submitting again — a new consensus round will start fresh.</p>
            <a href={`${GENLAYER_EXPLORER_URL}/tx/${submitted.txHash}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-xs block mb-5">View failed transaction ↗</a>
            <button onClick={() => setSubmitted(null)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Try Again</button>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submitted to GenLayer!</h2>
          <p className="text-sm text-gray-500 mb-4">AI consensus is evaluating your ration. Redirecting to results...</p>
          <p className="font-mono text-xs text-gray-400 mb-3">{submitted.requestId}</p>
          <a href={`${GENLAYER_EXPLORER_URL}/tx/${submitted.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">View Transaction ↗</a>
        </div>
      </div>
    );
  }

  const STEPS = ['Livestock', 'Ingredients & Standards', 'Ration Details', 'Constraints & Submit'];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Optimize Feed Ration</h1>
      <p className="text-gray-500 text-sm mb-6">Submit your ration for AI consensus evaluation on GenLayer</p>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${step > i + 1 ? 'bg-green-600 text-white' : step === i + 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <div className="ml-2 text-xs font-medium hidden sm:block" style={{ color: step === i + 1 ? '#16a34a' : '#9ca3af' }}>{s}</div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-green-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Step 1: Select Livestock</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
              <select required value={farmId} onChange={e => { setFarmId(e.target.value); setBatchId(''); setAdvisorId(''); }} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select a farm</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livestock Batch <span className="text-red-500">*</span></label>
              <select required value={batchId} onChange={e => setBatchId(e.target.value)} disabled={!farmId} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50">
                <option value="">Select a batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.species} — {b.production_stage}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feed Advisor <span className="text-red-500">*</span></label>
              <select required value={advisorId} onChange={e => setAdvisorId(e.target.value)} disabled={!farmId} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50">
                <option value="">Select an advisor</option>
                {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {farmId && advisors.length === 0 && <p className="text-xs text-amber-600 mt-1">No advisors registered for this farm. <Link href="/advisors/new" className="underline">Add one</Link></p>}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!farmId || !batchId || !advisorId} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Next →</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Step 2: Ingredients & Standards</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Feed Ingredients <span className="text-red-500">*</span></label>
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {ingredients.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400 text-center">No ingredients for this farm. <Link href="/ingredients/new" className="text-green-600 underline">Add ingredients</Link></div>
                ) : ingredients.map(ing => (
                  <label key={ing.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                    <input type="checkbox" checked={selectedIngredients.includes(ing.id)} onChange={() => toggleIngredient(ing.id)} className="rounded text-green-600" />
                    <span className="text-sm text-gray-900">{ing.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{ing.category}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{selectedIngredients.length} ingredient(s) selected</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feed Standard <span className="text-red-500">*</span></label>
              <select required value={standardId} onChange={e => setStandardId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select a feed standard</option>
                {standards.map(s => <option key={s.id} value={s.standard_id}>{s.title} (v{s.version})</option>)}
              </select>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={() => setStep(3)} disabled={selectedIngredients.length === 0 || !standardId} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Next →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Step 3: Ration Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optimization Objective <span className="text-red-500">*</span></label>
              <textarea required value={objectiveSummary} onChange={e => setObjectiveSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Maximize growth rate while keeping ration cost below $0.40/kg DM" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Feeding Summary</label>
              <textarea value={currentFeedingSummary} onChange={e => setCurrentFeedingSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe what the animals are currently being fed..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Feed Summary</label>
              <textarea value={availableFeedSummary} onChange={e => setAvailableFeedSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="What ingredients are actually in stock and available now..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Ration Summary <span className="text-red-500">*</span></label>
              <textarea required value={candidateRationSummary} onChange={e => setCandidateRationSummary(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe the proposed ration mix: ingredient percentages, inclusion rates, preparation method..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nutrient Analysis Summary <span className="text-red-500">*</span></label>
              <textarea required value={nutrientAnalysisSummary} onChange={e => setNutrientAnalysisSummary(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Estimated CP, ME, amino acids, minerals, vitamins in the candidate ration..." />
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={() => setStep(4)} disabled={!objectiveSummary || !candidateRationSummary || !nutrientAnalysisSummary} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Next →</button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Step 4: Constraints & Submit</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Constraint Summary</label>
              <textarea value={costConstraintSummary} onChange={e => setCostConstraintSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Maximum budget $0.45/kg DM; limited capital for expensive premixes..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supply Constraint Summary</label>
              <textarea value={supplyConstraintSummary} onChange={e => setSupplyConstraintSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Soybean meal supply uncertain after October; maize available in bulk..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Health Context Summary</label>
              <textarea value={healthContextSummary} onChange={e => setHealthContextSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Any current health conditions, medication interactions, recovery status..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment Context Summary</label>
              <textarea value={environmentContextSummary} onChange={e => setEnvironmentContextSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. High-altitude farm, hot climate, wet season — adjust energy density..." />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>Ready to submit.</strong> This will broadcast a transaction to GenLayer StudioNet. AI validators will evaluate your ration and reach consensus. This may take 1-5 minutes.
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Submitting to GenLayer consensus...
                  </>
                ) : '🎯 Submit for Optimization'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
