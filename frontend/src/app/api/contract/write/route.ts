import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";

export async function POST(req: NextRequest) {
  try {
    const { method, args, privateKey, contractAddress } = await req.json();

    if (!method || !privateKey || !contractAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build the gen_call write payload
    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "gen_call",
      params: [
        {
          to: contractAddress,
          data: { method, args: args ?? [] },
          type: "write",
          value: "0x0",
        },
      ],
    };

    // Sign the payload with the private key (GenLayer uses eth_sign style)
    const wallet = new ethers.Wallet(privateKey);
    const messageHash = ethers.hashMessage(JSON.stringify(payload.params[0]));
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    // Send to GenLayer RPC
    const rpcPayload = {
      ...payload,
      params: [
        {
          ...payload.params[0],
          from: wallet.address,
          signature,
        },
      ],
    };

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpcPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `RPC error: ${text}` }, { status: 502 });
    }

    const result = await res.json();

    if (result.error) {
      return NextResponse.json({ error: result.error.message ?? JSON.stringify(result.error) }, { status: 400 });
    }

    const txHash: string = result.result ?? "";
    const explorerUrl = `${process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? "https://explorer-studio.genlayer.com"}/tx/${txHash}`;

    return NextResponse.json({
      txHash,
      explorerUrl,
      data: result.result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
