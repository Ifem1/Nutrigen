import { NextRequest, NextResponse } from 'next/server';

const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || '0xbC24799513516aB71CA2488C8aDA94DC4A0e0341';

// Call gen_call type=write directly — bypasses viem address validation entirely.
// StudioNet supports positional args via gen_call so no ABI encoding needed.
export async function POST(req: NextRequest) {
  try {
    const { method, args, privateKey } = await req.json();
    if (!method || !privateKey) {
      return NextResponse.json({ error: 'Missing method or privateKey' }, { status: 400 });
    }

    // Derive sender address from private key (only for `from` field in gen_call)
    const { createAccount } = await import('genlayer-js');
    const account = createAccount(privateKey as `0x${string}`);
    const senderAddress = account.address;

    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'gen_call',
      params: [{
        to: CONTRACT,
        from: senderAddress,
        data: '0x',
        value: '0x0',
        type: 'write',
        function_name: method,
        args_mode: 'positional',
        args: args ?? [],
      }],
    };

    const resp = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await resp.json();
    if (json.error) {
      console.error('[contract/write] gen_call error:', json.error);
      throw new Error(json.error.message ?? JSON.stringify(json.error));
    }

    // Decode the hex result from gen_call
    const decoded = decodeGenLayerResult(json.result);
    return NextResponse.json({ result: decoded });
  } catch (err: any) {
    console.error('[contract/write] error:', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

function decodeGenLayerResult(hexResult: string): string {
  if (!hexResult || hexResult === '0x') return '';
  try {
    const hex = hexResult.startsWith('0x') ? hexResult.slice(2) : hexResult;
    const bytes = hex.match(/.{2}/g)!.map((b) => parseInt(b, 16));
    if (bytes.length === 0) return '';
    const type = bytes[0] & 0b111;
    const length = bytes[0] >> 3;
    if (type === 4) {
      return new TextDecoder().decode(new Uint8Array(bytes.slice(1, 1 + length)));
    }
  } catch { /* fall through */ }
  return hexResult;
}
