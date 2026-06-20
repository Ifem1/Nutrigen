export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';
export const NUTRIGEN_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  '0x0C5Ec297AfDA24F411500E3e37B82069a9b98C1a') as `0x${string}`;
