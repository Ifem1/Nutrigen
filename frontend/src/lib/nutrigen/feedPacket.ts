// Deterministic feed optimization packet builder & ration hash generator

export interface FeedPacket {
  farm_id: string;
  batch_id: string;
  advisor_id: string;
  standard_ids_csv: string;
  ingredient_ids_csv: string;
  objective_summary: string;
  current_feeding_summary: string;
  available_feed_summary: string;
  candidate_ration_summary: string;
  nutrient_analysis_summary: string;
  cost_constraint_summary: string;
  supply_constraint_summary: string;
  health_context_summary: string;
  environment_context_summary: string;
  nonce: string;
}

export function buildFeedPacket(params: Omit<FeedPacket, "nonce">): FeedPacket {
  return {
    ...params,
    nonce: Date.now().toString(),
  };
}

export async function hashFeedPacket(packet: FeedPacket): Promise<string> {
  const canonical = JSON.stringify({
    farm_id: packet.farm_id,
    batch_id: packet.batch_id,
    advisor_id: packet.advisor_id,
    standard_ids_csv: packet.standard_ids_csv,
    ingredient_ids_csv: packet.ingredient_ids_csv,
    objective_summary: packet.objective_summary,
    current_feeding_summary: packet.current_feeding_summary,
    available_feed_summary: packet.available_feed_summary,
    candidate_ration_summary: packet.candidate_ration_summary,
    nutrient_analysis_summary: packet.nutrient_analysis_summary,
    cost_constraint_summary: packet.cost_constraint_summary,
    supply_constraint_summary: packet.supply_constraint_summary,
    health_context_summary: packet.health_context_summary,
    environment_context_summary: packet.environment_context_summary,
    nonce: packet.nonce,
  });

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(canonical);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Server-side fallback
  const { createHash } = await import("crypto");
  return "0x" + createHash("sha256").update(canonical).digest("hex");
}

export function generateRequestId(farm_id: string, batch_id: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `req_${farm_id.slice(0, 6)}_${batch_id.slice(0, 6)}_${ts}_${rand}`;
}

export function generateEntityId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${ts}_${rand}`;
}
