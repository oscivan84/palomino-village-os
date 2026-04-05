'use client';

import { CategoryFilter } from '@/components/ui/category-filter';
import { SearchBar } from '@/components/muro/search-bar';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { PostCategory } from '@/types';

export default function MuroPage() {
  const [category, setCategory] = useState<PostCategory | undefined>();
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter selected={category} onChange={setCategory} />

      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">
          No hay publicaciones{category ? ' en esta categoría' : ''}
        </p>
        <p className="text-xs text-gray-300 mt-2">
          Backend no conectado — mostrando vista offline
        </p>
      </div>

      <button className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-palm-600 text-white shadow-lg flex items-center justify-center active:bg-palm-700 z-40">
        <Plus size={24} />
      </button>
    </div>
  );
}
