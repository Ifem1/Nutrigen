import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase client ───────────────────────────────────────────────────────
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

// ── Mock ethers ───────────────────────────────────────────────────────────────
vi.mock('ethers', () => ({
  ethers: {
    Wallet: vi.fn((privateKey: string) => ({
      address: '0xMockedAddress',
    })),
  },
}));

// ── Mock generate.ts decryptPrivateKey ───────────────────────────────────────
vi.mock('./generate', () => ({
  decryptPrivateKey: vi.fn(),
}));

import { storeWallet, getWalletRecord, unlockWallet } from './storage';
import { decryptPrivateKey } from './generate';

describe('storeWallet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserts wallet record into user_wallets table', async () => {
    mockFrom.mockReturnValue({
      insert: mockInsert.mockResolvedValue({ error: null }),
    });

    await storeWallet('user-1', '0xADDRESS', 'encKey', 'salt', 'iv', 100_000);

    expect(mockFrom).toHaveBeenCalledWith('user_wallets');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        address: '0xADDRESS',
        encrypted_private_key: 'encKey',
        encryption_salt: 'salt',
        encryption_iv: 'iv',
        key_derivation_iterations: 100_000,
        is_primary: true,
      })
    );
  });

  it('throws when insert fails', async () => {
    mockFrom.mockReturnValue({
      insert: mockInsert.mockResolvedValue({
        error: { message: 'unique constraint' },
      }),
    });

    await expect(
      storeWallet('user-1', '0xADDRESS', 'encKey', 'salt', 'iv', 100_000)
    ).rejects.toThrow('unique constraint');
  });
});

describe('getWalletRecord', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches primary wallet for user', async () => {
    const fakeRecord = { id: 'wallet-1', user_id: 'user-1', address: '0xADDR' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeRecord, error: null }),
    });

    const record = await getWalletRecord('user-1');
    expect(record).toEqual(fakeRecord);
  });

  it('throws when wallet is not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      }),
    });

    await expect(getWalletRecord('user-1')).rejects.toThrow('No rows found');
  });
});

describe('unlockWallet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('decrypts private key and returns it when address matches', async () => {
    const fakeRecord = {
      encrypted_private_key: 'enc',
      encryption_salt: 'salt',
      encryption_iv: 'iv',
      address: '0xMockedAddress', // same as mock ethers returns
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeRecord, error: null }),
    });

    vi.mocked(decryptPrivateKey).mockResolvedValue('0xPRIVATE_KEY');

    const key = await unlockWallet('user-1', 'my-password');
    expect(key).toBe('0xPRIVATE_KEY');
    expect(decryptPrivateKey).toHaveBeenCalledWith('enc', 'salt', 'iv', 'my-password');
  });

  it('throws when decrypted address does not match stored address', async () => {
    const fakeRecord = {
      encrypted_private_key: 'enc',
      encryption_salt: 'salt',
      encryption_iv: 'iv',
      address: '0xDIFFERENT_ADDRESS', // mismatch with ethers mock returning 0xMockedAddress
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeRecord, error: null }),
    });

    vi.mocked(decryptPrivateKey).mockResolvedValue('0xWRONG_KEY');

    await expect(unlockWallet('user-1', 'wrong-password')).rejects.toThrow(
      'Wrong password'
    );
  });
});
