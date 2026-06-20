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
    const contractAddress = normalizeAddress(process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS);
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

    // simulateWriteContract uses gen_call type=write with GenLayer's own calldata encoding.
    // writeContract targets the consensus contract which is not deployed on StudioNet.
    const result = await client.simulateWriteContract({
      address: contractAddress,
      functionName: method,
      args: callArgs,
    });

    console.info('[Nutrigen /write] simulateWriteContract result:', result);

    return NextResponse.json({ result: result ?? '' });
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
