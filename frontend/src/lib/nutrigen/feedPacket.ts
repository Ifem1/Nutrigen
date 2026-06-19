// Deterministic hashing for ration_hash and evidence_manifest_hash
// Uses Web Crypto API (available in Next.js 14 App Router on Edge/Node)

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = encoder.encode(data);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface RationPacket {
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  standard_ids_csv: string;
  ingredient_ids_csv: string;
  objective_summary: string;
  candidate_ration_summary: string;
  nutrient_analysis_summary: string;
}

export interface EvidenceManifest {
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  current_feeding_summary: string;
  available_feed_summary: string;
  cost_constraint_summary: string;
  supply_constraint_summary: string;
  health_context_summary: string;
  environment_context_summary: string;
  submitted_at: string;
}

export async function buildRationHash(packet: RationPacket): Promise<string> {
  const canonical = JSON.stringify({
    farm_id: packet.farm_id,
    batch_id: packet.batch_id,
    advisor_id: packet.advisor_id,
    standard_ids_csv: packet.standard_ids_csv,
    ingredient_ids_csv: packet.ingredient_ids_csv,
    objective_summary: packet.objective_summary.trim(),
    candidate_ration_summary: packet.candidate_ration_summary.trim(),
    nutrient_analysis_summary: packet.nutrient_analysis_summary.trim(),
  });
  return sha256Hex(canonical);
}

export async function buildEvidenceManifestHash(manifest: EvidenceManifest): Promise<string> {
  const canonical = JSON.stringify({
    farm_id: manifest.farm_id,
    batch_id: manifest.batch_id,
    advisor_id: manifest.advisor_id,
    current_feeding_summary: manifest.current_feeding_summary.trim(),
    available_feed_summary: manifest.available_feed_summary.trim(),
    cost_constraint_summary: manifest.cost_constraint_summary.trim(),
    supply_constraint_summary: manifest.supply_constraint_summary.trim(),
    health_context_summary: manifest.health_context_summary.trim(),
    environment_context_summary: manifest.environment_context_summary.trim(),
    submitted_at: manifest.submitted_at,
  });
  return sha256Hex(canonical);
}

export async function buildMetadataHash(obj: Record<string, unknown>): Promise<string> {
  return sha256Hex(JSON.stringify(obj, Object.keys(obj).sort()));
}
