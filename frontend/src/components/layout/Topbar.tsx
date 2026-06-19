'use client';

import { usePathname } from 'next/navigation';
import { Bell, LogOut, User, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Badge } from '@/components/ui';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/optimizer': 'Feed Optimizer',
  '/history': 'Validation History',
  '/policies': 'Policy Management',
  '/agents': 'Agent Management',
  '/escalations': 'Escalations',
  '/analytics': 'Risk Analytics',
  '/audit': 'Audit Trail',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
};

export function Topbar() {
  const pathname = usePathname();
  const { profile, walletAddress } = useAuthStore();
  const { setNotificationsPanelOpen } = useUIStore();
  const { signOut } = useAuth();

  const label = Object.entries(PAGE_LABELS).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'Nutrigen';

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-sm font-semibold text-foreground">{label}</h1>

      <div className="flex items-center gap-3">
        {shortAddress && (
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 sm:flex">
            <Wallet className="h-3 w-3 text-brand-600" />
            <span className="font-mono text-xs text-muted-foreground">{shortAddress}</span>
          </div>
        )}

        <button
          onClick={() => setNotificationsPanelOpen(true)}
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-3.5 w-3.5" />
          </div>
          {profile?.full_name && (
            <span className="hidden text-sm font-medium text-foreground sm:block">
              {profile.full_name.split(' ')[0]}
            </span>
          )}
          <Button variant="ghost" size="xs" onClick={signOut} title="Sign out">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
