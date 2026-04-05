'use client';

import {
  User,
  Trophy,
  Star,
  CreditCard,
  MapPin,
  CheckCircle,
  Settings,
  LogOut,
} from 'lucide-react';

export default function PerfilPage() {
  // TODO: obtener del contexto de auth
  const user = {
    displayName: 'Demo User',
    phone: '+57 300 123 4567',
    roles: ['LOCAL'],
    isVerified: true,
    bio: 'Técnico de plomería en Palomino',
    eloScores: [
      { type: 'BILLIARDS', score: 1450, wins: 23, losses: 8 },
      { type: 'SERVICE_RATING', score: 1380, wins: 45, losses: 3 },
    ],
    achievements: [
      { name: 'Primer Servicio', iconUrl: null },
      { name: 'Racha de 5', iconUrl: null },
      { name: 'Top 10 Billar', iconUrl: null },
    ],
    stats: {
      completedServices: 48,
      totalEarnings: 4800000,
      avgRating: 4.7,
    },
  };

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="card text-center">
        <div className="w-20 h-20 rounded-full bg-palm-100 flex items-center justify-center text-palm-700 font-bold text-2xl mx-auto">
          {user.displayName.charAt(0)}
        </div>
        <h2 className="text-xl font-bold mt-3 flex items-center justify-center gap-1.5">
          {user.displayName}
          {user.isVerified && (
            <CheckCircle size={18} className="text-palm-500" />
          )}
        </h2>
        <p className="text-sm text-gray-500">{user.bio}</p>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1">
          <MapPin size={12} />
          Palomino, La Guajira
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-palm-50 rounded-xl p-3">
            <CreditCard size={18} className="text-palm-600 mx-auto" />
            <span className="block text-lg font-bold mt-1">
              {user.stats.completedServices}
            </span>
            <span className="text-xs text-gray-500">Servicios</span>
          </div>
          <div className="bg-sand-50 rounded-xl p-3">
            <Star size={18} className="text-sand-600 mx-auto" />
            <span className="block text-lg font-bold mt-1">
              {user.stats.avgRating}
            </span>
            <span className="text-xs text-gray-500">Rating</span>
          </div>
          <div className="bg-ocean-50 rounded-xl p-3">
            <Trophy size={18} className="text-ocean-600 mx-auto" />
            <span className="block text-lg font-bold mt-1">
              {user.eloScores[0]?.score || '-'}
            </span>
            <span className="text-xs text-gray-500">ELO</span>
          </div>
        </div>
      </div>

      {/* Pasaporte Phygital — Logros */}
      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-sand-500" />
          Pasaporte Phygital
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {user.achievements.map((achievement, i) => (
            <div
              key={i}
              className="shrink-0 w-20 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-sand-100 flex items-center justify-center mx-auto">
                <Star size={20} className="text-sand-500" />
              </div>
              <span className="text-xs text-gray-600 mt-1 block leading-tight">
                {achievement.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ELO Scores */}
      <div className="card">
        <h3 className="font-semibold mb-3">Rankings ELO</h3>
        <div className="space-y-2">
          {user.eloScores.map((elo) => (
            <div
              key={elo.type}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div>
                <span className="font-medium text-sm">{elo.type === 'BILLIARDS' ? 'Billar' : 'Servicios'}</span>
                <span className="text-xs text-gray-400 block">
                  {elo.wins}W - {elo.losses}L
                </span>
              </div>
              <span className="font-bold text-lg">{elo.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <button className="card w-full flex items-center gap-3 active:bg-gray-50">
          <Settings size={20} className="text-gray-400" />
          <span className="text-sm font-medium">Configuración</span>
        </button>
        <button className="card w-full flex items-center gap-3 text-red-500 active:bg-red-50">
          <LogOut size={20} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
