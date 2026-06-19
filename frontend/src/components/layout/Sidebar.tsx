'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FlaskConical, History, ShieldCheck,
  BarChart3, ClipboardList, AlertTriangle,
  Settings, Users, ChevronLeft, ChevronRight, Leaf,
  Tractor, Beef, Package, BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '@/store/uiStore';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Farms', href: '/farms', icon: Tractor },
  { label: 'Batches', href: '/batches', icon: Beef },
  { label: 'Ingredients', href: '/ingredients', icon: Package },
  { label: 'Feed Standards', href: '/feed-standards', icon: BookOpen },
  { label: 'Optimizer', href: '/optimizer', icon: FlaskConical },
  { label: 'History', href: '/history', icon: History },
  { label: 'Escalations', href: '/escalations', icon: AlertTriangle },
  { label: 'Audit Trail', href: '/audit', icon: ClipboardList },
];

const BOTTOM_NAV = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Admin', href: '/admin', icon: Users },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-border bg-card transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600">
          <Leaf className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-bold text-foreground">Nutrigen</span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border py-3">
        <ul className="space-y-0.5 px-2">
          {BOTTOM_NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Collapse toggle */}
        <div className="mt-2 px-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:bg-secondary"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : (
              <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
