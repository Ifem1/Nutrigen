'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

interface Ingredient {
  id: string;
  ingredient_id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  farms?: { name: string };
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('feed_ingredients').select('*, farms(name)').order('created_at', { ascending: false });
      setIngredients((data ?? []) as Ingredient[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed Ingredients</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your available feed ingredients and their nutritional profiles</p>
        </div>
        <Link href="/ingredients/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Add Ingredient</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading ingredients...</div>
        ) : ingredients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🌾</div>
            <p className="text-gray-500 text-sm mb-4">No feed ingredients registered yet</p>
            <Link href="/ingredients/new" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Add your first ingredient</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Ingredient Name</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Farm</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ingredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{ing.name}</td>
                    <td className="px-5 py-3 text-gray-600">{ing.category}</td>
                    <td className="px-5 py-3 text-gray-500">{(ing.farms as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[ing.status] ?? 'bg-gray-100 text-gray-600'}`}>{ing.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(ing.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
