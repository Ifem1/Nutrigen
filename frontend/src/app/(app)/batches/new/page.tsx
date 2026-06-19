import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'New Livestock Batch' };
import { NewBatchClient } from './NewBatchClient';
export default function NewBatchPage() { return <NewBatchClient />; }
