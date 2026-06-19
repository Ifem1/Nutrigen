import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Nutrigen', template: '%s | Nutrigen' },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {/* Logo bar */}
      <header className="px-6 py-5">
        <a href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground">Nutrigen</span>
        </a>
      </header>

      {/* Page content */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>

      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Nutrigen. All rights reserved.
      </footer>
    </div>
  );
}
