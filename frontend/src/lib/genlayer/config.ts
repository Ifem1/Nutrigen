export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';
export const NUTRIGEN_CONTRACT_ADDRESS =
  ((process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0x0c5ec297afda24f411500e3e37b82069a9b98c1a').toLowerCase()) as `0x${string}`;
