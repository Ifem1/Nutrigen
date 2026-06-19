// Type-safe API response helpers used in Supabase Edge Functions
// and Next.js Route Handlers.

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function err(message: string, code?: string): ApiError {
  return { success: false, error: message, code };
}

export function isApiError<T>(res: ApiResponse<T>): res is ApiError {
  return !res.success;
}

// Response factory for Next.js Route Handlers
export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(ok(data), { status });
}

export function jsonErr(message: string, status = 400, code?: string): Response {
  return Response.json(err(message, code), { status });
}

// Extract error message from unknown catch values
export function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'An unexpected error occurred';
}
