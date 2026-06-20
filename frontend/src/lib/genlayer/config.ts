export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';
export const NUTRIGEN_CONTRACT_ADDRESS =
  ((process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0xbc24799513516ab71ca2488c8ada94dc4a0e0341').toLowerCase()) as `0x${string}`;
