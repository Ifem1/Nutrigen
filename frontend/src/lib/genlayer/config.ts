export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';
export const NUTRIGEN_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0xCf15A810F8a1b687b042a7E56E7774F6ac7dE087';
