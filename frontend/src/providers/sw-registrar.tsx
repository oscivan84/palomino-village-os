'use client';

import { useEffect } from 'react';

/**
 * Registra el Service Worker agresivo para "Modo Pueblo Offline".
 * El muro de la comunidad y perfiles de técnicos cargan sin señal.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered:', reg.scope);

          // Cuando vuelve la conexión, notificar al SW para sincronizar
          window.addEventListener('online', () => {
            reg.active?.postMessage('SYNC_QUEUE');
          });
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    }
  }, []);

  return null;
}
