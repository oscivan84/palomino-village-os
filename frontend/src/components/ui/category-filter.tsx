'use client';

import { clsx } from 'clsx';
import {
  Home,
  Wrench,
  Truck,
  Briefcase,
  Calendar,
  LayoutGrid,
} from 'lucide-react';
import type { PostCategory } from '@/types';

const categories: {
  value: PostCategory | 'ALL';
  label: string;
  labelEn: string;
  icon: typeof Home;
  color: string;
}[] = [
  { value: 'ALL', label: 'Todo', labelEn: 'All', icon: LayoutGrid, color: 'bg-gray-100 text-gray-700' },
  { value: 'PROPERTY', label: 'Inmuebles', labelEn: 'Property', icon: Home, color: 'bg-sand-100 text-sand-800' },
  { value: 'SERVICE', label: 'Servicios', labelEn: 'Services', icon: Wrench, color: 'bg-ocean-100 text-ocean-800' },
  { value: 'LOGISTICS', label: 'Logística', labelEn: 'Logistics', icon: Truck, color: 'bg-purple-100 text-purple-800' },
  { value: 'JOB', label: 'Trabajo', labelEn: 'Jobs', icon: Briefcase, color: 'bg-palm-100 text-palm-800' },
  { value: 'EVENT', label: 'Eventos', labelEn: 'Events', icon: Calendar, color: 'bg-rose-100 text-rose-800' },
];

interface Props {
  selected: PostCategory | undefined;
  onChange: (category: PostCategory | undefined) => void;
  lang?: 'es' | 'en';
}

export function CategoryFilter({ selected, onChange, lang = 'es' }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {categories.map(({ value, label, labelEn, icon: Icon, color }) => {
        const isActive =
          value === 'ALL' ? !selected : selected === value;

        return (
          <button
            key={value}
            onClick={() =>
              onChange(value === 'ALL' ? undefined : (value as PostCategory))
            }
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium',
              'whitespace-nowrap transition-all shrink-0 min-h-touch',
              isActive
                ? `${color} ring-2 ring-offset-1 ring-current`
                : 'bg-gray-50 text-gray-500',
            )}
          >
            <Icon size={16} />
            {lang === 'en' ? labelEn : label}
          </button>
        );
      })}
    </div>
  );
}
