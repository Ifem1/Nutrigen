import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Publish Feed Standard' };
import { NewStandardClient } from './NewStandardClient';
export default function NewStandardPage() { return <NewStandardClient />; }
