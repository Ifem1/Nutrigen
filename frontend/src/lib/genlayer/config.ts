import { normalizeAddress } from './address';

export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_EXPLORER_URL = 'https://explorer-studio.genlayer.com';
export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const GENLAYER_NETWORK =
  (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet') as 'studionet';

export function getNutrigenContractAddress(): `0x${string}` {
  return normalizeAddress(
    process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || '0xF95d93aF54f77a81735f4066512C43c3CE68c2A7'
  );
}

export function getExplorerTxUrl(txHash: string): string {
  return `${GENLAYER_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${GENLAYER_EXPLORER_URL}/address/${normalizeAddress(address)}`;
}
