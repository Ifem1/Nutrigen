/**
 * Normalize any EVM address to lowercase `0x{40 hex chars}`.
 * Avoids viem's strict EIP-55 checksum validation on mixed-case inputs.
 */
export function normalizeAddress(value: unknown): `0x${string}` {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(raw)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }
  return raw as `0x${string}`;
}

export function isValidAddress(value: unknown): boolean {
  try {
    normalizeAddress(value);
    return true;
  } catch {
    return false;
  }
}
