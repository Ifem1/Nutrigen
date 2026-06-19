import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Feed Standards' };
import { FeedStandardsClient } from './FeedStandardsClient';
export default function FeedStandardsPage() { return <FeedStandardsClient />; }
