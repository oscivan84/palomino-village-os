'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, User, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/muro', label: 'Muro', icon: Home },
  { href: '/torneos', label: 'Torneos', icon: Trophy },
  { href: '/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-palm-700">
            Village OS
          </h1>
          <span className="badge-category">Palomino</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>

      {/* Bottom Navigation — Touch-friendly */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center justify-center py-2 px-4 min-h-touch min-w-touch',
                  'transition-colors text-xs',
                  isActive
                    ? 'text-palm-600 font-semibold'
                    : 'text-gray-400',
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="mt-0.5">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
