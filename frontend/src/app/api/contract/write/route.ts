import { NextRequest, NextResponse } from 'next/server';

const CONTRACT = (process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0xbC24799513516aB71CA2488C8aDA94DC4A0e0341') as `0x${string}`;

// Server-side contract write using genlayer-js v1.1.8 simulateWriteContract.
// StudioNet does not support eth_sendRawTransaction, so we use gen_call type=write
// via the SDK's simulateWriteContract which returns the decoded result directly.
export async function POST(req: NextRequest) {
  try {
    const { method, args, privateKey } = await req.json();
    if (!method || !privateKey) {
      return NextResponse.json({ error: 'Missing method or privateKey' }, { status: 400 });
    }

    const { createClient, createAccount, chains } = await import('genlayer-js');
    const account = createAccount(privateKey as `0x${string}`);
    const client = createClient({ chain: (chains as any).studionet, account });

    const result = await (client as any).simulateWriteContract({
      address: CONTRACT,
      functionName: method,
      args: args ?? [],
    });

    // result is already decoded by the SDK (string, object, etc.)
    const serialized = result === null || result === undefined
      ? ''
      : typeof result === 'object'
        ? JSON.stringify(result)
        : String(result);

    return NextResponse.json({ result: serialized });
  } catch (err: any) {
    console.error('[contract/write] error:', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
