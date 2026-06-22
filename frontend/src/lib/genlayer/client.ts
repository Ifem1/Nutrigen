// GenLayer client — uses genlayer-js SDK
import { createClient as createGLClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { NUTRIGEN_CONTRACT_ADDRESS, explorerTxUrl } from "./config";

// Read-only client (no account needed for reads)
function getReadClient() {
  return createGLClient({ chain: studionet });
}

export async function contractRead<T = unknown>(
  method: string,
  args: unknown[] = [],
  contractAddress = NUTRIGEN_CONTRACT_ADDRESS
): Promise<T> {
  const client = getReadClient();
  const result = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: method,
    args: args as any[],
  });
  // Result may be a JSON string or already parsed
  if (typeof result === "string") {
    try {
      return JSON.parse(result) as T;
    } catch {
      return result as unknown as T;
    }
  }
  return result as T;
}

export async function contractWrite(
  method: string,
  args: unknown[],
  privateKey: string,
  contractAddress = NUTRIGEN_CONTRACT_ADDRESS
): Promise<{ txHash: string; explorerUrl: string; data?: unknown; consensusStatus?: string }> {
  // Write calls go through API route to keep private key server-side
  const res = await fetch("/api/contract/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, args, privateKey, contractAddress }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Contract write failed: ${err}`);
  }
  const result = await res.json();
  if (result.error) throw new Error(result.error);
  const txHash: string = result.txHash ?? result.tx_hash ?? "";
  return {
    txHash,
    explorerUrl: explorerTxUrl(txHash),
    data: result.data,
    consensusStatus: result.consensusStatus,
  };
}

export function parseJsonResult<T>(raw: unknown): T {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
  return raw as T;
}

export function parsePipeIndex(raw: unknown): string[] {
  if (!raw || raw === "") return [];
  const str = typeof raw === "string" ? raw : String(raw);
  return str.split("|").filter(Boolean);
}
