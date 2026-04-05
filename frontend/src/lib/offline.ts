/**
 * Offline-First: Persistencia local con IndexedDB para zonas de baja conectividad.
 * Usa idb-keyval como wrapper liviano.
 *
 * Todas las operaciones son no-op en SSR (server-side rendering)
 * para evitar crashes por acceso a indexedDB inexistente.
 */

const isClient = typeof window !== 'undefined';

async function idbGet<T>(key: string): Promise<T | undefined> {
  if (!isClient) return undefined;
  const { get } = await import('idb-keyval');
  return get<T>(key);
}

async function idbSet(key: string, value: any): Promise<void> {
  if (!isClient) return;
  const { set } = await import('idb-keyval');
  await set(key, value);
}

async function idbDel(key: string): Promise<void> {
  if (!isClient) return;
  const { del } = await import('idb-keyval');
  await del(key);
}

const CACHE_PREFIX = 'pvo_';

export const offlineStore = {
  async cacheFeed(nodeId: string, data: any) {
    await idbSet(`${CACHE_PREFIX}feed_${nodeId}`, {
      data,
      cachedAt: Date.now(),
    });
  },

  async getCachedFeed(nodeId: string) {
    const cached = await idbGet<{ data: any; cachedAt: number }>(
      `${CACHE_PREFIX}feed_${nodeId}`,
    );
    if (!cached) return null;

    const isStale = Date.now() - cached.cachedAt > 30 * 60 * 1000;
    return { data: cached.data, isStale };
  },

  async cacheUser(user: any) {
    await idbSet(`${CACHE_PREFIX}user`, user);
  },

  async getCachedUser() {
    return idbGet(`${CACHE_PREFIX}user`);
  },

  async queueAction(action: {
    type: string;
    endpoint: string;
    method: string;
    body: any;
  }) {
    const queue =
      (await idbGet<any[]>(`${CACHE_PREFIX}offline_queue`)) || [];
    queue.push({ ...action, queuedAt: Date.now() });
    await idbSet(`${CACHE_PREFIX}offline_queue`, queue);
  },

  async getOfflineQueue() {
    return (await idbGet<any[]>(`${CACHE_PREFIX}offline_queue`)) || [];
  },

  async clearQueue() {
    await idbDel(`${CACHE_PREFIX}offline_queue`);
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
      await idbSet(`${CACHE_PREFIX}offline_queue`, failed);
    } else {
      await this.clearQueue();
    }

    return { synced: queue.length - failed.length, failed: failed.length };
  },
};
