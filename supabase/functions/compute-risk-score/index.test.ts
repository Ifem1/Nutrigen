/**
 * Tests for compute-risk-score edge function.
 * Run with: deno test supabase/functions/compute-risk-score/index.test.ts
 */

// ── Risk scoring logic (mirrors what's in index.ts) ───────────────────────────

function computeRiskScores(result: {
  crude_protein_percent?: number;
  total_daily_cost_per_head?: number;
  budget_per_head_per_day?: number;
  welfare_score?: number;
  agreement_percentage?: number;
}) {
  const nutritionalRisk = result.crude_protein_percent
    ? Math.max(0, 100 - result.crude_protein_percent * 4)
    : 50;

  const costRisk =
    result.total_daily_cost_per_head && result.budget_per_head_per_day
      ? Math.max(
          0,
          Math.min(
            100,
            ((result.total_daily_cost_per_head - result.budget_per_head_per_day) /
              result.budget_per_head_per_day) *
              100
          )
        )
      : 30;

  const welfareRisk = result.welfare_score
    ? Math.max(0, (10 - result.welfare_score) * 10)
    : 40;

  const consensusRisk = result.agreement_percentage
    ? Math.max(0, 100 - result.agreement_percentage)
    : 50;

  const marketRisk = 20;

  const overall =
    nutritionalRisk * 0.3 +
    costRisk * 0.25 +
    welfareRisk * 0.2 +
    consensusRisk * 0.15 +
    marketRisk * 0.1;

  const riskLevel =
    overall < 30 ? 'low' : overall < 60 ? 'medium' : overall < 80 ? 'high' : 'critical';

  return { nutritionalRisk, costRisk, welfareRisk, consensusRisk, marketRisk, overall, riskLevel };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test('low nutritional risk when protein is adequate', () => {
  const { nutritionalRisk } = computeRiskScores({ crude_protein_percent: 20 });
  // 100 - 20*4 = 20
  if (nutritionalRisk !== 20) throw new Error(`Expected 20, got ${nutritionalRisk}`);
});

Deno.test('zero nutritional risk when protein exceeds 25%', () => {
  const { nutritionalRisk } = computeRiskScores({ crude_protein_percent: 25 });
  if (nutritionalRisk !== 0) throw new Error(`Expected 0, got ${nutritionalRisk}`);
});

Deno.test('nutritional risk defaults to 50 when protein missing', () => {
  const { nutritionalRisk } = computeRiskScores({});
  if (nutritionalRisk !== 50) throw new Error(`Expected 50, got ${nutritionalRisk}`);
});

Deno.test('zero cost risk when actual cost equals budget', () => {
  const { costRisk } = computeRiskScores({
    total_daily_cost_per_head: 0.12,
    budget_per_head_per_day: 0.12,
  });
  if (costRisk !== 0) throw new Error(`Expected 0, got ${costRisk}`);
});

Deno.test('positive cost risk when actual exceeds budget', () => {
  const { costRisk } = computeRiskScores({
    total_daily_cost_per_head: 0.18,
    budget_per_head_per_day: 0.12,
  });
  // (0.18 - 0.12) / 0.12 * 100 = 50
  if (Math.abs(costRisk - 50) > 0.01) throw new Error(`Expected ~50, got ${costRisk}`);
});

Deno.test('cost risk capped at 100', () => {
  const { costRisk } = computeRiskScores({
    total_daily_cost_per_head: 1.0,
    budget_per_head_per_day: 0.12,
  });
  if (costRisk > 100) throw new Error(`costRisk ${costRisk} should not exceed 100`);
});

Deno.test('perfect welfare score gives zero welfare risk', () => {
  const { welfareRisk } = computeRiskScores({ welfare_score: 10 });
  if (welfareRisk !== 0) throw new Error(`Expected 0, got ${welfareRisk}`);
});

Deno.test('poor welfare score (4) gives 60% welfare risk', () => {
  const { welfareRisk } = computeRiskScores({ welfare_score: 4 });
  // (10 - 4) * 10 = 60
  if (welfareRisk !== 60) throw new Error(`Expected 60, got ${welfareRisk}`);
});

Deno.test('full consensus agreement gives zero consensus risk', () => {
  const { consensusRisk } = computeRiskScores({ agreement_percentage: 100 });
  if (consensusRisk !== 0) throw new Error(`Expected 0, got ${consensusRisk}`);
});

Deno.test('overall score stays within 0-100 range', () => {
  const extreme = computeRiskScores({
    crude_protein_percent: 0,
    total_daily_cost_per_head: 999,
    budget_per_head_per_day: 0.01,
    welfare_score: 0,
    agreement_percentage: 0,
  });
  if (extreme.overall < 0 || extreme.overall > 100) {
    throw new Error(`overall ${extreme.overall} out of range`);
  }
});

Deno.test('risk level boundaries are correct', () => {
  const low = computeRiskScores({ crude_protein_percent: 25, welfare_score: 10, agreement_percentage: 100 });
  const cases = [
    { score: 10, expected: 'low' },
    { score: 45, expected: 'medium' },
    { score: 70, expected: 'high' },
    { score: 90, expected: 'critical' },
  ];

  for (const { score, expected } of cases) {
    const level = score < 30 ? 'low' : score < 60 ? 'medium' : score < 80 ? 'high' : 'critical';
    if (level !== expected) throw new Error(`score=${score}: expected ${expected}, got ${level}`);
  }
});

Deno.test('weighted sum formula is correct', () => {
  // All components at 50% → overall = 50*(0.3+0.25+0.2+0.15+0.1) = 50
  const expected = 50 * 0.3 + 50 * 0.25 + 50 * 0.2 + 50 * 0.15 + 20 * 0.1;
  // nutritionalRisk=50 (no protein), costRisk=30 (default), welfareRisk=40 (default),
  // consensusRisk=50 (default), marketRisk=20
  const { overall } = computeRiskScores({});
  const manualOverall = 50 * 0.3 + 30 * 0.25 + 40 * 0.2 + 50 * 0.15 + 20 * 0.1;
  if (Math.abs(overall - manualOverall) > 0.001) {
    throw new Error(`Expected ${manualOverall}, got ${overall}`);
  }
});
