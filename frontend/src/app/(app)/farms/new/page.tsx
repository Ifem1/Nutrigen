import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'New Farm' };
import { NewFarmClient } from './NewFarmClient';
export default function NewFarmPage() { return <NewFarmClient />; }
