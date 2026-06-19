import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must happen before any redirect
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/api/'));
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p);

  // Logged-in user visiting auth pages → redirect to dashboard
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Logged-out user visiting protected pages → redirect to login
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
