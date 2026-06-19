import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Farms' };
import { FarmsClient } from './FarmsClient';
export default function FarmsPage() { return <FarmsClient />; }
