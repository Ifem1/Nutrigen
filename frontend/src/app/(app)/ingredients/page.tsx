import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Feed Ingredients' };
import { IngredientsClient } from './IngredientsClient';
export default function IngredientsPage() { return <IngredientsClient />; }
