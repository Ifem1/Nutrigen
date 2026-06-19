import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Web Crypto API (Node doesn't have it natively in all versions) ────────────
// jsdom includes a partial implementation; supplement it here for PBKDF2 tests.
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('node:crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
  });
}

// ── Next.js headers/cookies (used in server-side supabase client) ─────────────
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  headers: vi.fn(() => new Map()),
}));

// ── Next.js navigation ────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
  redirect: vi.fn(),
}));

// ── Suppress noisy console.error output from React in tests ──────────────────
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('ReactDOM.render'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
