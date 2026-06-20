import { NextRequest, NextResponse } from 'next/server';

const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
// Always lowercase — viem rejects mixed-case addresses with invalid EIP-55 checksum.
const CONTRACT = (
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0xbc24799513516ab71ca2488c8ada94dc4a0e0341'
).toLowerCase();

// Call gen_call type=write directly over HTTP.
// No viem address validation — addresses are plain strings in the JSON payload.
export async function POST(req: NextRequest) {
  try {
    const { method, args, privateKey } = await req.json();
    if (!method || !privateKey) {
      return NextResponse.json({ error: 'Missing method or privateKey' }, { status: 400 });
    }

    // Derive sender address from private key using ethers (pure JS, no viem address checks here)
    const { Wallet } = await import('ethers');
    const wallet = new Wallet(privateKey);
    const senderAddress = wallet.address.toLowerCase();

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
