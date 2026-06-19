import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard' };

import { DashboardClient } from './DashboardClient';
export default function DashboardPage() { return <DashboardClient />; }
