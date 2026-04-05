import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { QueryProvider } from '@/providers/query-provider';
import '@/styles/globals.css';

const ServiceWorkerRegistrar = dynamic(
  () => import('@/providers/sw-registrar').then((m) => m.ServiceWorkerRegistrar),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'Palomino Village OS',
  description: 'Plataforma phygital para comunidades costeras',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Village OS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans">
        <QueryProvider>{children}</QueryProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
