export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';
export const NUTRIGEN_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0xbC24799513516aB71CA2488C8aDA94DC4A0e0341') as `0x${string}`;
