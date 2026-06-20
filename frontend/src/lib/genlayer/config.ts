import { normalizeAddress } from './address';

export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_EXPLORER_URL = 'https://explorer-studio.genlayer.com';
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';

export function getNutrigenContractAddress(): `0x${string}` {
  return normalizeAddress(
    process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || '0x8d1971d3B4fBB0D1d5EDC8a2BF59353eB3A0DDBE'
  );
}

export function getExplorerTxUrl(txHash: string): string {
  return `${GENLAYER_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${GENLAYER_EXPLORER_URL}/address/${normalizeAddress(address)}`;
}
