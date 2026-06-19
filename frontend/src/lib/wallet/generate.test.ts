import { describe, it, expect } from 'vitest';
import {
  generateWallet,
  encryptPrivateKey,
  decryptPrivateKey,
  createEncryptedWallet,
} from './generate';

describe('generateWallet', () => {
  it('returns address, privateKey, mnemonic', () => {
    const w = generateWallet();
    expect(w.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(w.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(w.mnemonic.split(' ').length).toBe(12);
  });

  it('generates unique wallets each call', () => {
    const a = generateWallet();
    const b = generateWallet();
    expect(a.address).not.toBe(b.address);
    expect(a.privateKey).not.toBe(b.privateKey);
  });
});

describe('encryptPrivateKey / decryptPrivateKey', () => {
  const fakeKey = '0x' + 'ab'.repeat(32);
  const password = 'test-password-123!';

  it('encrypts and decrypts round-trip successfully', async () => {
    const { encryptedPrivateKey, salt, iv, iterations } = await encryptPrivateKey(fakeKey, password);
    expect(encryptedPrivateKey).toBeTruthy();
    expect(salt.length).toBe(64); // 32 bytes hex
    expect(iv.length).toBe(24);   // 12 bytes hex
    expect(iterations).toBe(100_000);

    const decrypted = await decryptPrivateKey(encryptedPrivateKey, salt, iv, password);
    expect(decrypted).toBe(fakeKey);
  });

  it('fails to decrypt with wrong password', async () => {
    const { encryptedPrivateKey, salt, iv } = await encryptPrivateKey(fakeKey, password);
    await expect(
      decryptPrivateKey(encryptedPrivateKey, salt, iv, 'wrong-password')
    ).rejects.toThrow();
  });

  it('produces different ciphertext each call (random salt/IV)', async () => {
    const a = await encryptPrivateKey(fakeKey, password);
    const b = await encryptPrivateKey(fakeKey, password);
    expect(a.encryptedPrivateKey).not.toBe(b.encryptedPrivateKey);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
  });
});

describe('createEncryptedWallet', () => {
  it('generates a wallet and encrypts its private key', async () => {
    const { wallet, encrypted } = await createEncryptedWallet('my-secure-password');
    expect(wallet.address).toMatch(/^0x/);
    expect(encrypted.encryptedPrivateKey).toBeTruthy();

    // Verify the encrypted key can be decrypted back to the original
    const recovered = await decryptPrivateKey(
      encrypted.encryptedPrivateKey,
      encrypted.salt,
      encrypted.iv,
      'my-secure-password'
    );
    expect(recovered).toBe(wallet.privateKey);
  });
});
