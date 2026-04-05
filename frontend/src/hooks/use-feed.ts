'use client';

import { useQuery } from '@tanstack/react-query';
import { communityApi } from '@/lib/api';
import { offlineStore } from '@/lib/offline';
import type { FeedFilters, PaginatedResponse, Post } from '@/types';

const EMPTY_FEED: PaginatedResponse<Post> = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export function useFeed(nodeId: string, filters: FeedFilters = {}) {
  return useQuery<PaginatedResponse<Post>>({
    queryKey: ['feed', nodeId, filters],
    queryFn: async () => {
      try {
        const data = await communityApi.getFeed(nodeId, filters);
        await offlineStore.cacheFeed(nodeId, data).catch(() => {});
        return data;
      } catch (error) {
        // Offline fallback: retornar datos cacheados
        try {
          const cached = await offlineStore.getCachedFeed(nodeId);
          if (cached) return cached.data;
        } catch {
          // IndexedDB no disponible
        }
        // Si no hay cache ni backend, devolver feed vacío en vez de crash
        return EMPTY_FEED;
      }
    },
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
