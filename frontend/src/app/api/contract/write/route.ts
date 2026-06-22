import { NextRequest, NextResponse } from "next/server";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NUTRIGEN_CONTRACT_ADDRESS ?? "0x1D63Ef3E2edeE0509D1dda9d4DDe15F3E876b602";
const EXPLORER_URL = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? "https://explorer-studio.genlayer.com";

export async function POST(req: NextRequest) {
  try {
    const { method, args, privateKey, contractAddress } = await req.json();

    if (!method || !privateKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const address = (contractAddress ?? CONTRACT_ADDRESS) as `0x${string}`;
    const account = createAccount(privateKey as `0x${string}`);

    const client = createClient({
      chain: studionet,
      account,
    });

    const txHash = await client.writeContract({
      address,
      functionName: method,
      args: args ?? [],
      value: BigInt(0),
    });

    const explorerUrl = `${EXPLORER_URL}/tx/${txHash}`;

    // Wait for any terminal state (ACCEPTED or UNDETERMINED)
    let data: unknown = null;
    let consensusStatus = "PENDING";
    try {
      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        status: "FINALIZED" as any,
        retries: 80,
        interval: 5000,
      });
      data = receipt;
      consensusStatus = (receipt as any)?.status ?? (receipt as any)?.consensus_data?.final_used_leader_receipt?.execution_result ?? "FINALIZED";
    } catch {
      // Transaction submitted but consensus still pending
      consensusStatus = "PENDING";
    }

    return NextResponse.json({
      txHash: String(txHash),
      explorerUrl,
      data,
      consensusStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
