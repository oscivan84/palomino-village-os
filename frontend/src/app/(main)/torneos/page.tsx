'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tournamentsApi } from '@/lib/api';
import { Trophy, Target, Waves, Star, ChevronRight } from 'lucide-react';
import type { EloScore, TournamentType } from '@/types';

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

  const { data: leaderboard, isLoading } = useQuery<EloScore[]>({
    queryKey: ['leaderboard', selectedType],
    queryFn: () => tournamentsApi.getLeaderboard(selectedType),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy size={24} className="text-sand-500" />
        Ranking ELO
      </h2>

      {/* Type selector */}
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

      {/* Leaderboard */}
      <div className="space-y-2">
        {leaderboard?.map((entry, index) => (
          <div
            key={entry.id}
            className="card flex items-center gap-3"
          >
            {/* Rank */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                index === 0
                  ? 'bg-sand-400 text-white'
                  : index === 1
                    ? 'bg-gray-300 text-white'
                    : index === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-100 text-gray-500'
              }`}
            >
              {index + 1}
            </div>

            {/* Player */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">
                  {entry.user.displayName}
                </span>
                {entry.streak > 2 && (
                  <span className="text-xs text-orange-500">
                    {entry.streak} racha
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {entry.wins}W - {entry.losses}L
              </div>
            </div>

            {/* ELO Score */}
            <div className="text-right">
              <span className="font-bold text-lg">{entry.score}</span>
              <span className="text-xs text-gray-400 block">ELO</span>
            </div>
          </div>
        ))}

        {leaderboard?.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            No hay jugadores clasificados todavía
          </p>
        )}
      </div>
    </div>
  );
}
