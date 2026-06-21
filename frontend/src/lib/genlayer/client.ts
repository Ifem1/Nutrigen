// GenLayer RPC client — thin wrapper around gen_call JSON-RPC
import { GENLAYER_RPC_URL, NUTRIGEN_CONTRACT_ADDRESS, explorerTxUrl } from "./config";

type CallType = "read" | "write";

interface GenCallPayload {
  jsonrpc: "2.0";
  id: number;
  method: "gen_call";
  params: [
    {
      to: string;
      data: { method: string; args: unknown[] };
      type: CallType;
      value?: string;
    }
  ];
}

async function rpc<T>(payload: GenCallPayload): Promise<T> {
  const res = await fetch(GENLAYER_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`GenLayer RPC error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.error) throw new Error(`GenLayer error: ${JSON.stringify(json.error)}`);
  return json.result as T;
}

let _reqId = 1;

export async function contractRead<T = unknown>(
  method: string,
  args: unknown[] = [],
  contractAddress = NUTRIGEN_CONTRACT_ADDRESS
): Promise<T> {
  const result = await rpc<string>({
    jsonrpc: "2.0",
    id: _reqId++,
    method: "gen_call",
    params: [{ to: contractAddress, data: { method, args }, type: "read" }],
  });
  // Result may be a JSON string or already an object
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
): Promise<{ txHash: string; explorerUrl: string; data?: unknown }> {
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
