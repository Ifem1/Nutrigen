import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'genlayer-js';
import type { CalldataEncodable } from 'genlayer-js/types';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { GENLAYER_CHAIN_ID } from '@/lib/genlayer/config';
import { normalizeAddress } from '@/lib/genlayer/address';

const RPC =
  process.env.GENLAYER_RPC_URL ||
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
  'https://studio.genlayer.com/api';

export async function POST(req: NextRequest) {
  try {
    const { method, args, privateKey, walletAddress } = await req.json();

    if (typeof method !== 'string' || !method.trim()) {
      return NextResponse.json({ error: 'Missing method' }, { status: 400 });
    }

    const signingKey = validatePrivateKey(
      privateKey || process.env.GENLAYER_PRIVATE_KEY || process.env.PRIVATE_KEY
    );
    const account = privateKeyToAccount(signingKey);
    const contractAddress = normalizeAddress(process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || '0x16A41A68Fe0c2c86ec7BdC0b55bC392971EdeDf7');
    const from = walletAddress ? normalizeAddress(walletAddress) : normalizeAddress(account.address);

    if (normalizeAddress(account.address).toLowerCase() !== from.toLowerCase()) {
      return NextResponse.json({ error: 'Wallet address does not match signing key.' }, { status: 400 });
    }

    const callArgs = Array.isArray(args) ? (args as CalldataEncodable[]) : [];

    console.info('[Nutrigen write debug]', {
      contractAddress,
      functionName: method,
      args: callArgs,
      from,
      chainId: GENLAYER_CHAIN_ID,
      rpcUrl: RPC,
      hasPrivateKey: true,
      privateKeyLength: signingKey.length,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });

    const client = createClient({
      chain: studionet,
      account,
    });

    // writeContract submits through GenLayer consensus (actually commits state).
    // simulateWriteContract only simulates — does not persist state.
    const txHash = await client.writeContract({
      address: contractAddress,
      functionName: method,
      args: callArgs,
    });

    console.info('[Nutrigen /write] writeContract txHash:', txHash);

    // Wait for consensus (StudioNet typically confirms in <30s with 5 validators).
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    // GenLayer status 5 = ACCEPTED
    const genStatus = (receipt as any)?.status;
    console.info('[Nutrigen /write] receipt status:', genStatus, 'hash:', txHash);
    if (genStatus !== undefined && genStatus !== 5) {
      return NextResponse.json({ error: `Transaction rejected by consensus (status ${genStatus})` }, { status: 500 });
    }

    return NextResponse.json({ result: txHash, receipt });
  } catch (err: any) {
    console.error('[contract/write] error:', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

function validatePrivateKey(value: unknown): `0x${string}` {
  const key = String(value ?? '').trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('Missing or invalid private key. Expected 0x + 64 hex characters.');
  }
  return key as `0x${string}`;
}
