/**
 * Offline-First: Persistencia local con IndexedDB para zonas de baja conectividad.
 * Usa idb-keyval como wrapper liviano.
 */
import { get, set, del, keys } from 'idb-keyval';

const CACHE_PREFIX = 'pvo_'; // palomino village os

export const offlineStore = {
  async cacheFeed(nodeId: string, data: any) {
    await set(`${CACHE_PREFIX}feed_${nodeId}`, {
      data,
      cachedAt: Date.now(),
    });
  },

  async getCachedFeed(nodeId: string) {
    const cached = await get(`${CACHE_PREFIX}feed_${nodeId}`);
    if (!cached) return null;

    // Cache válido por 30 minutos offline
    const isStale = Date.now() - cached.cachedAt > 30 * 60 * 1000;
    return { data: cached.data, isStale };
  },

  async cacheUser(user: any) {
    await set(`${CACHE_PREFIX}user`, user);
  },

  async getCachedUser() {
    return get(`${CACHE_PREFIX}user`);
  },

  async queueAction(action: {
    type: string;
    endpoint: string;
    method: string;
    body: any;
  }) {
    const queue =
      (await get<any[]>(`${CACHE_PREFIX}offline_queue`)) || [];
    queue.push({ ...action, queuedAt: Date.now() });
    await set(`${CACHE_PREFIX}offline_queue`, queue);
  },

  async getOfflineQueue() {
    return (await get<any[]>(`${CACHE_PREFIX}offline_queue`)) || [];
  },

  async clearQueue() {
    await del(`${CACHE_PREFIX}offline_queue`);
  },

  async syncQueue(fetchFn: typeof fetch) {
    const queue = await this.getOfflineQueue();
    const failed: any[] = [];

    for (const action of queue) {
      try {
        await fetchFn(action.endpoint, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.body),
        });
      } catch {
        failed.push(action);
      }
    }

    if (failed.length > 0) {
      await set(`${CACHE_PREFIX}offline_queue`, failed);
    } else {
      await this.clearQueue();
    }

    return { synced: queue.length - failed.length, failed: failed.length };
  },
};
