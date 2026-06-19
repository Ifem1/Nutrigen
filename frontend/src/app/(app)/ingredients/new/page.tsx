import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'New Feed Ingredient' };
import { NewIngredientClient } from './NewIngredientClient';
export default function NewIngredientPage() { return <NewIngredientClient />; }
