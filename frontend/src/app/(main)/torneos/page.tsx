'use client';

import { useState } from 'react';
import { Trophy, Target, Waves, Star } from 'lucide-react';
import type { TournamentType } from '@/types';

const typeConfig: Record<
  string,
  { label: string; icon: typeof Trophy; color: string }
> = {
  BILLIARDS: { label: 'Billar', icon: Target, color: 'text-purple-600 bg-purple-50' },
  SURF: { label: 'Surf', icon: Waves, color: 'text-ocean-600 bg-ocean-50' },
  SERVICE_RATING: { label: 'Servicios', icon: Star, color: 'text-sand-600 bg-sand-50' },
};

export default function TorneosPage() {
  const [selectedType, setSelectedType] = useState<TournamentType>('BILLIARDS');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy size={24} className="text-sand-500" />
        Ranking ELO
      </h2>

      <div className="flex gap-2">
        {Object.entries(typeConfig).map(([type, config]) => {
          const Icon = config.icon;
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type as TournamentType)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium min-h-touch flex flex-col items-center gap-1 transition-colors ${
                isActive ? config.color : 'bg-gray-50 text-gray-400'
              }`}
            >
              <Icon size={20} />
              {config.label}
            </button>
          );
        })}
      </div>

      <p className="text-center text-gray-400 text-sm py-8">
        No hay jugadores clasificados todavía
      </p>
    </div>
  );
}
