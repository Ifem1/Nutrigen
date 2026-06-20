import { NextRequest, NextResponse } from 'next/server';

const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || '0x0C5Ec297AfDA24F411500E3e37B82069a9b98C1a';

export async function POST(req: NextRequest) {
  try {
    // Client sends walletAddress to avoid server-side private-key-to-address derivation
    const { method, args, privateKey, walletAddress } = await req.json();

    if (!method) return NextResponse.json({ error: 'Missing method' }, { status: 400 });
    if (!walletAddress) return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });

    console.info('[Nutrigen /write debug]', {
      contractAddress: CONTRACT,
      functionName: method,
      args,
      from: walletAddress,
      rpcUrl: RPC,
      hasPrivateKey: Boolean(privateKey),
      privateKeyLength: (privateKey || '').length,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });

    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'gen_call',
      params: [{
        to: CONTRACT,
        from: walletAddress,
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
    console.info('[Nutrigen /write] gen_call response:', JSON.stringify(json));

    if (json.error) {
      throw new Error(json.error.message ?? JSON.stringify(json.error));
    }

    return NextResponse.json({ result: decodeGenLayerResult(json.result) });
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
