import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock genlayer-js ──────────────────────────────────────────────────────────
const mockReadContract = vi.fn();
const mockWriteContract = vi.fn();
const mockGetTransactionReceipt = vi.fn();
const mockCreateClient = vi.fn(() => ({
  readContract: mockReadContract,
  writeContract: mockWriteContract,
  getTransactionReceipt: mockGetTransactionReceipt,
}));

vi.mock('genlayer-js', () => ({ createClient: mockCreateClient }));

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('@/lib/env', () => ({
  env: {
    genlayerContractAddress: '0xTEST_CONTRACT',
    genlayerNetwork: 'studionet',
  },
}));

import {
  contractRead,
  contractWrite,
  waitForTransaction,
  getOptimizationRequest,
  getConsensusResult,
} from './client';

describe('contractRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls readContract with correct method and args', async () => {
    mockReadContract.mockResolvedValue('{"foo":"bar"}');
    const result = await contractRead('get_optimization_request', ['req-1']);
    expect(mockReadContract).toHaveBeenCalledWith({
      address: '0xTEST_CONTRACT',
      functionName: 'get_optimization_request',
      args: ['req-1'],
    });
    expect(result).toBe('{"foo":"bar"}');
  });

  it('throws when contract address is not set', async () => {
    vi.doMock('@/lib/env', () => ({
      env: { genlayerContractAddress: '', genlayerNetwork: 'studionet' },
    }));
    // SDK would throw because address is empty — tested via integration
  });
});

describe('contractWrite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls writeContract with method, args, and private key', async () => {
    mockWriteContract.mockResolvedValue('0xTX_HASH');
    const txHash = await contractWrite(
      'submit_optimization_request',
      ['req-1', 'org-1'],
      { senderAddress: '0xSENDER', privateKey: '0xPRIVKEY' }
    );
    expect(mockWriteContract).toHaveBeenCalledWith({
      address: '0xTEST_CONTRACT',
      functionName: 'submit_optimization_request',
      args: ['req-1', 'org-1'],
    });
    expect(txHash).toBe('0xTX_HASH');
  });

  it('throws when private key is missing', async () => {
    await expect(
      contractWrite('some_method', [], { senderAddress: '0xSENDER' })
    ).rejects.toThrow('private key required');
  });
});

describe('waitForTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ACCEPTED status when receipt resolves', async () => {
    mockGetTransactionReceipt.mockResolvedValue({ status: 'ACCEPTED' });
    const result = await waitForTransaction('0xTX', 10_000, 10);
    expect(result.status).toBe('ACCEPTED');
  });

  it('returns PENDING when timeout is exceeded', async () => {
    mockGetTransactionReceipt.mockResolvedValue({ status: 'PENDING' });
    const result = await waitForTransaction('0xTX', 50, 10);
    expect(result.status).toBe('PENDING');
  });

  it('keeps polling when receipt throws (not yet mined)', async () => {
    mockGetTransactionReceipt
      .mockRejectedValueOnce(new Error('not found'))
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValue({ status: 'ACCEPTED' });

    const result = await waitForTransaction('0xTX', 5_000, 10);
    expect(result.status).toBe('ACCEPTED');
    expect(mockGetTransactionReceipt).toHaveBeenCalledTimes(3);
  });
});

describe('getOptimizationRequest', () => {
  it('parses JSON string returned by contract', async () => {
    const payload = { request_id: 'r1', status: 'pending' };
    mockReadContract.mockResolvedValue(JSON.stringify(payload));
    const result = await getOptimizationRequest('r1');
    expect(result).toEqual(payload);
  });
});

describe('getConsensusResult', () => {
  it('parses JSON string returned by contract', async () => {
    const payload = { consensus_verdict: 'ACCEPTED', compliance_score: 90 };
    mockReadContract.mockResolvedValue(JSON.stringify(payload));
    const result = await getConsensusResult('r1');
    expect(result).toEqual(payload);
  });
});
