'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/store/authStore';
import { PageSpinner } from '@/components/ui';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) return <PageSpinner label="Loading Nutrigen…" />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
