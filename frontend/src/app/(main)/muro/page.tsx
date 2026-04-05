'use client';

import { useState } from 'react';
import { useFeed } from '@/hooks/use-feed';
import { CategoryFilter } from '@/components/ui/category-filter';
import { SearchBar } from '@/components/muro/search-bar';
import { PostCard } from '@/components/muro/post-card';
import { Loader2, WifiOff, Plus } from 'lucide-react';
import type { PostCategory } from '@/types';

// TODO: obtener del contexto del nodo activo
const CURRENT_NODE_ID = 'palomino';

export default function MuroPage() {
  const [category, setCategory] = useState<PostCategory | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useFeed(
    CURRENT_NODE_ID,
    { category, search: search || undefined, page },
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Category Filters */}
      <CategoryFilter selected={category} onChange={setCategory} />

      {/* Feed */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-palm-500" />
        </div>
      ) : isError ? (
        <div className="card text-center py-8">
          <WifiOff size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            {error?.message || 'Error al cargar el muro'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Mostrando datos en cache si disponibles
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {data?.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                No hay publicaciones{category ? ' en esta categoría' : ''}
              </p>
            </div>
          )}

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline text-sm px-4 py-2"
              >
                Anterior
              </button>
              <span className="flex items-center text-sm text-gray-500">
                {page} / {data.meta.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.meta.totalPages, p + 1))
                }
                disabled={page === data.meta.totalPages}
                className="btn-outline text-sm px-4 py-2"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* FAB: Crear publicación */}
      <button className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-palm-600 text-white shadow-lg flex items-center justify-center active:bg-palm-700 z-40">
        <Plus size={24} />
      </button>

      {/* Offline indicator */}
      {isFetching && !isLoading && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-ocean-600 text-white text-xs px-3 py-1 rounded-full z-50">
          Sincronizando...
        </div>
      )}
    </div>
  );
}
