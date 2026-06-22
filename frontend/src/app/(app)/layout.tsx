'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/farms', label: 'Farms', icon: '🏡' },
  { href: '/batches', label: 'Livestock Batches', icon: '🐄' },
  { href: '/ingredients', label: 'Feed Ingredients', icon: '🌾' },
  { href: '/feed-standards', label: 'Feed Standards', icon: '📋' },
  { href: '/advisors', label: 'Feed Advisors', icon: '👨‍🔬' },
  { href: '/optimizer', label: 'Optimize Feed', icon: '🎯' },
  { href: '/history', label: 'Request History', icon: '🕐' },
  { href: '/escalations', label: 'Pending Reviews', icon: '⚠️' },
  { href: '/audit', label: 'Audit Trail', icon: '🔍' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
  { href: '/settings', label: 'My Profile', icon: '👤' },
];

const CONTRACT = '0x1D63Ef3E2edeE0509D1dda9d4DDe15F3E876b602';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/login');
      } else {
        const user = data.session.user;
        setUserEmail(user.email ?? '');
        // Ensure profile exists
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email ?? '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        setChecking(false);
      }
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🌿</div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-green-900 text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2 px-5 py-5 border-b border-green-800">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-lg">Nutrigen</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${active ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-800 hover:text-white'}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-green-800">
          <div className="bg-green-800 rounded-lg p-3 mb-3">
            <p className="text-xs text-green-300 font-medium mb-1">Contract</p>
            <p className="text-xs text-green-100 font-mono truncate">{CONTRACT.slice(0, 10)}...{CONTRACT.slice(-6)}</p>
            <p className="text-xs text-green-400 mt-1">GenLayer · StudioNet · 61999</p>
          </div>
          <button onClick={handleSignOut} className="w-full text-left text-xs text-green-300 hover:text-white px-2 py-1.5 rounded hover:bg-green-800 transition-colors">
            Sign Out ({userEmail.split('@')[0]})
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-900 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">{userEmail}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
