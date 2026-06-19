import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('initializes with correct default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.walletAddress).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isInitialized).toBe(false);
  });

  it('setUser updates user', () => {
    const fakeUser = { id: 'user-1', email: 'test@example.com' } as any;
    useAuthStore.getState().setUser(fakeUser);
    expect(useAuthStore.getState().user).toEqual(fakeUser);
  });

  it('setWalletAddress updates wallet address', () => {
    useAuthStore.getState().setWalletAddress('0xABC123');
    expect(useAuthStore.getState().walletAddress).toBe('0xABC123');
  });

  it('setLoading toggles isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('setInitialized marks store as initialized', () => {
    useAuthStore.getState().setInitialized(true);
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('reset clears all state back to defaults', () => {
    useAuthStore.getState().setUser({ id: 'u1' } as any);
    useAuthStore.getState().setWalletAddress('0xDEAD');
    useAuthStore.getState().setInitialized(true);
    useAuthStore.getState().setLoading(false);

    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.walletAddress).toBeNull();
    expect(state.isInitialized).toBe(false);
    expect(state.isLoading).toBe(true);
  });
});
