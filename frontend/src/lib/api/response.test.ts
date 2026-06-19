import { describe, it, expect } from 'vitest';
import { jsonOk, jsonErr, extractErrorMessage } from './response';

describe('jsonOk', () => {
  it('returns 200 with data wrapped in success envelope', async () => {
    const res = jsonOk({ foo: 'bar' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('accepts null as data', async () => {
    const res = jsonOk(null);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });
});

describe('jsonErr', () => {
  it('returns 400 by default with error message', async () => {
    const res = jsonErr('Something went wrong');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'Something went wrong' });
  });

  it('accepts custom status codes', async () => {
    const res = jsonErr('Unauthorized', 401);
    expect(res.status).toBe(401);
  });

  it('returns 500 for server errors', async () => {
    const res = jsonErr('DB exploded', 500);
    expect(res.status).toBe(500);
  });
});

describe('extractErrorMessage', () => {
  it('extracts message from Error instances', () => {
    expect(extractErrorMessage(new Error('oops'))).toBe('oops');
  });

  it('converts strings directly', () => {
    expect(extractErrorMessage('raw string')).toBe('raw string');
  });

  it('handles unknown types gracefully', () => {
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(undefined)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(42)).toBe('An unexpected error occurred');
  });
});
