import { getAddress as viemGetAddress, isAddress } from 'viem';

/**
 * Validate and normalise an EVM address to proper EIP-55 checksum form.
 * Accepts any valid casing (lowercase, uppercase, mixed) and returns the
 * correctly checksummed form that StudioNet and viem both accept.
 */
export function normalizeAddress(value: unknown): `0x${string}` {
  const raw = String(value ?? '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }
  // Compute proper EIP-55 checksum regardless of input casing
  return viemGetAddress(raw as `0x${string}`);
}

export function isValidAddress(value: unknown): boolean {
  try {
    normalizeAddress(value);
    return true;
  } catch {
    return false;
  }
}
