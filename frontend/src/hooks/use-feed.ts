'use client';

import { useQuery } from '@tanstack/react-query';
import { communityApi } from '@/lib/api';
import { offlineStore } from '@/lib/offline';
import type { FeedFilters, PaginatedResponse, Post } from '@/types';

export function useFeed(nodeId: string, filters: FeedFilters = {}) {
  return useQuery<PaginatedResponse<Post>>({
    queryKey: ['feed', nodeId, filters],
    queryFn: async () => {
      try {
        const data = await communityApi.getFeed(nodeId, filters);
        // Cachear para uso offline
        await offlineStore.cacheFeed(nodeId, data);
        return data;
      } catch (error) {
        // Offline fallback: retornar datos cacheados
        const cached = await offlineStore.getCachedFeed(nodeId);
        if (cached) return cached.data;
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
  });
}
