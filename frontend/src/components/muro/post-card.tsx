'use client';

import { MapPin, Eye, Clock, CheckCircle, Briefcase } from 'lucide-react';
import type { Post } from '@/types';

const categoryLabels: Record<string, { es: string; en: string }> = {
  PROPERTY: { es: 'Inmueble', en: 'Property' },
  SERVICE: { es: 'Servicio', en: 'Service' },
  LOGISTICS: { es: 'Logística', en: 'Logistics' },
  JOB: { es: 'Trabajo', en: 'Job' },
  EVENT: { es: 'Evento', en: 'Event' },
  GENERAL: { es: 'General', en: 'General' },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface Props {
  post: Post;
  lang?: 'es' | 'en';
  onPress?: () => void;
}

export function PostCard({ post, lang = 'es', onPress }: Props) {
  const catLabel = categoryLabels[post.category]?.[lang] || post.category;

  return (
    <button
      onClick={onPress}
      className="card w-full text-left active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-palm-100 flex items-center justify-center text-palm-700 font-semibold text-sm shrink-0">
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">
                {post.author.displayName}
              </span>
              {post.author.isVerified && (
                <CheckCircle size={14} className="text-palm-500" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={11} />
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        <span className="badge-category text-xs">{catLabel}</span>
      </div>

      {/* Body */}
      <div className="mt-3">
        <h3 className="font-semibold text-base leading-snug">{post.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.body}</p>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {post.images.slice(0, 3).map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-24 h-24 object-cover rounded-lg shrink-0"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {post.isVerified && (
            <span className="badge-verified">
              <CheckCircle size={11} className="mr-1" />
              Verificado
            </span>
          )}
          {post.lat && (
            <span className="flex items-center gap-0.5">
              <MapPin size={11} />
              Geo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {post.category === 'JOB' && post._count?.jobApplications !== undefined && (
            <span className="flex items-center gap-0.5">
              <Briefcase size={11} />
              {post._count.jobApplications} postulaciones
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Eye size={11} />
            {post.viewCount}
          </span>
        </div>
      </div>
    </button>
  );
}
