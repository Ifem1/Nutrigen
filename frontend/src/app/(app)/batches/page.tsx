import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Livestock Batches' };
import { BatchesClient } from './BatchesClient';
export default function BatchesPage() { return <BatchesClient />; }
